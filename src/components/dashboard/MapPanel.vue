<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MapRiskSummary from './MapRiskSummary.vue'
import MapLayerControls from './MapLayerControls.vue'
import MapLegend from './MapLegend.vue'
import TimeScrubberCard from './TimeScrubberCard.vue'
import { isMapAvailable, loadNaverMaps } from '@/composables/useNaverMaps'
import { createHeatLayer, type HeatLayer } from './naverHeatLayer'
import { createOutsideHatchLayer, type OutsideHatchLayer } from './naverOutsideHatchLayer'
import { chartColors } from '@/composables/useEchartsTheme'
import { expandBounds, MAX_BOUNDS_EXPAND, regionByCode } from '@/constants/regions'
import type { GeoBounds } from '@/types/geo'
import { useDashboardStore } from '@/stores/dashboard'
import { useSimulationStore } from '@/stores/simulation'

const dashboard = useDashboardStore()
const simulation = useSimulationStore()

const mapEl = ref<HTMLDivElement | null>(null)
const mapReady = ref(false)
const mapFailed = ref(false)

// 지도 객체들은 반응형일 필요가 없다 — ref에 넣으면 프록시 래핑 비용만 생기고 SDK 내부와 충돌한다
let map: naver.maps.Map | null = null
let heatLayer: HeatLayer | null = null
let hatchLayer: OutsideHatchLayer | null = null
let boundaryRect: naver.maps.Rectangle | null = null
let clusterMarkers: naver.maps.Marker[] = []
let mapListeners: naver.maps.MapEventListener[] = []
let heatRaf = 0
let destroyed = false

function currentRegion() {
  return regionByCode(simulation.settings.region ?? 'pangyo')
}

function toLatLngBounds(bounds: GeoBounds): naver.maps.LatLngBounds {
  return new naver.maps.LatLngBounds(
    new naver.maps.LatLng(bounds.latMin, bounds.lngMin),
    new naver.maps.LatLng(bounds.latMax, bounds.lngMax),
  )
}

/**
 * 지역의 분석 영역 경계를 지도에 반영 — 이동 제한(느슨한 1.75배 박스)과
 * 경계 실선·영역 외 사선 표시를 갱신한다 (이슈 #26 C안)
 */
function applyRegionBounds(): void {
  if (!map) return
  const region = currentRegion()
  map.setOptions({
    maxBounds: toLatLngBounds(expandBounds(region.bounds, MAX_BOUNDS_EXPAND)),
    // 제한 박스보다 훨씬 넓게 축소되지 않도록 지역 기본 줌에서 두 단계까지만 허용
    minZoom: region.zoom - 2,
  })
  boundaryRect?.setBounds(toLatLngBounds(region.bounds))
  hatchLayer?.setBounds(region.bounds)
}

async function initMap(): Promise<void> {
  if (!isMapAvailable || !mapEl.value) {
    mapFailed.value = !isMapAvailable
    return
  }
  try {
    const maps = await loadNaverMaps()
    if (destroyed || !mapEl.value) return
    const region = currentRegion()
    map = new maps.Map(mapEl.value, {
      center: new maps.LatLng(region.center.lat, region.center.lng),
      zoom: region.zoom,
      mapDataControl: false,
      scaleControl: false,
      logoControlOptions: { position: maps.Position.BOTTOM_LEFT },
    })
    mapReady.value = true
    heatLayer = createHeatLayer(18)
    heatLayer.setMap(dashboard.heatmapOn ? map : null)
    updateHeatData()
    // 분석 영역 경계 실선 — 히트맵·클러스터가 놓이는 데이터 범위를 명시한다
    boundaryRect = new maps.Rectangle({
      map,
      bounds: toLatLngBounds(region.bounds),
      strokeColor: chartColors.primary,
      strokeWeight: 2,
      strokeOpacity: 0.9,
      fillOpacity: 0,
      clickable: false,
    })
    // 분석 영역 밖은 파란 사선으로 구분
    hatchLayer = createOutsideHatchLayer()
    hatchLayer.setBounds(region.bounds)
    hatchLayer.setMap(map)
    applyRegionBounds()
    // 팬/줌 후 드러난 마진 영역을 다시 그린다 (드래그 중 위치 고정은 pane이 담당)
    mapListeners = [
      naver.maps.Event.addListener(map, 'bounds_changed', scheduleOverlayDraw),
      naver.maps.Event.addListener(map, 'zoom_changed', scheduleOverlayDraw),
    ]
    renderClusters()
  } catch (error) {
    console.warn('[MapPanel] 지도 초기화 실패 — 플레이스홀더로 전환합니다.', error)
    mapFailed.value = true
  }
}

function scheduleOverlayDraw(): void {
  if (heatRaf) return
  heatRaf = requestAnimationFrame(() => {
    heatRaf = 0
    if (destroyed) return
    heatLayer?.redraw()
    hatchLayer?.redraw()
  })
}

/** 지도 레이어가 그릴 격자 지수 — 시뮬레이션 실행 후에는 참여율 적용 지수를 쓴다 */
function displayScore(g: { riskScore: number; projectedRiskScore: number }): number {
  return dashboard.gridAppliedRate != null ? g.projectedRiskScore : g.riskScore
}

function updateHeatData(): void {
  const grids = dashboard.gridRisk?.grids ?? []
  heatLayer?.setData(grids.map((g) => ({ lat: g.lat, lng: g.lng, weight: displayScore(g) / 100 })))
}

interface ClusterBucket {
  latSum: number
  lngSum: number
  riskSum: number
  count: number
}

/** 플러그인 없는 경량 클러스터 — 약 0.004° 격자로 버킷팅해 개수·평균 위험도 마커 표시 */
function renderClusters(): void {
  if (!map) return
  clusterMarkers.forEach((m) => m.setMap(null))
  clusterMarkers = []
  const grids = dashboard.gridRisk?.grids
  if (!dashboard.clusterOn || !grids?.length) return

  const CELL = 0.004
  const buckets = new Map<string, ClusterBucket>()
  for (const g of grids) {
    const key = `${Math.floor(g.lat / CELL)}:${Math.floor(g.lng / CELL)}`
    const bucket = buckets.get(key) ?? { latSum: 0, lngSum: 0, riskSum: 0, count: 0 }
    bucket.latSum += g.lat
    bucket.lngSum += g.lng
    bucket.riskSum += displayScore(g)
    bucket.count += 1
    buckets.set(key, bucket)
  }

  for (const bucket of buckets.values()) {
    const meanRisk = bucket.riskSum / bucket.count
    const color =
      meanRisk >= 65 ? chartColors.danger : meanRisk >= 40 ? chartColors.warning : chartColors.primary
    // 크기는 격자 개수(밀도) 유지 — 숫자·색상은 평균 위험도로 통일 (이슈 #30)
    const size = Math.min(44, 26 + Math.round(bucket.count / 12))
    // 흰 배경 + 색 테두리 — 반투명 배경 히트맵 위에서 또렷하게 보이는 조합
    clusterMarkers.push(
      new naver.maps.Marker({
        map,
        position: new naver.maps.LatLng(bucket.latSum / bucket.count, bucket.lngSum / bucket.count),
        icon: {
          content: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#fff;border:3px solid ${color};color:${color};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(15,23,42,.35)">${Math.round(meanRisk)}</div>`,
          anchor: new naver.maps.Point(size / 2, size / 2),
        },
      }),
    )
  }
}

watch(
  () => dashboard.gridRisk,
  () => {
    updateHeatData()
    renderClusters()
  },
)
watch(
  () => dashboard.heatmapOn,
  (on) => {
    heatLayer?.setMap(on && map ? map : null)
  },
)
watch(() => dashboard.clusterOn, renderClusters)
watch(
  () => simulation.settings.region,
  () => {
    if (!map) return
    const region = currentRegion()
    // 새 지역의 제한·경계를 먼저 적용한다 — morph 목적지(지역 센터)는 항상 새 제한 박스 안이다
    applyRegionBounds()
    map.morph(new naver.maps.LatLng(region.center.lat, region.center.lng), region.zoom)
  },
)

onMounted(() => {
  void initMap()
})

onBeforeUnmount(() => {
  destroyed = true
  if (heatRaf) cancelAnimationFrame(heatRaf)
  mapListeners.forEach((l) => naver.maps.Event.removeListener(l))
  mapListeners = []
  heatLayer?.setMap(null)
  heatLayer = null
  hatchLayer?.setMap(null)
  hatchLayer = null
  boundaryRect?.setMap(null)
  boundaryRect = null
  clusterMarkers.forEach((m) => m.setMap(null))
  map?.destroy()
  map = null
})
</script>

<template>
  <section class="map-panel">
    <div class="map-panel__stage">
      <div class="map-panel__viewport">
        <div
          ref="mapEl"
          class="map-panel__map"
        />
        <div
          v-if="!mapReady"
          class="map-panel__placeholder"
        >
          <span
            class="map-panel__pin"
            aria-hidden="true"
          >🗺️</span>
          <p class="map-panel__text">
            판교테크노밸리 공간 분석 지도
          </p>
          <p class="map-panel__hint">
            {{ mapFailed ? '지도 API 키 미설정 또는 로드 실패 — 레이아웃 확인용 플레이스홀더' : '지도를 불러오는 중입니다…' }}
          </p>
        </div>

        <div class="map-panel__overlays">
          <MapRiskSummary
            class="map-panel__risk"
            :global-risk="dashboard.globalRisk"
            :projected-risk="dashboard.globalRiskProjected"
            :state-label="dashboard.riskStateLabel"
            :is-fallback="dashboard.gridIsFallback"
          />
          <MapLayerControls
            v-model:heatmap="dashboard.heatmapOn"
            v-model:cluster="dashboard.clusterOn"
            class="map-panel__controls"
            :hour="dashboard.selectedHour"
          />
          <MapLegend class="map-panel__legend" />
        </div>
      </div>

      <TimeScrubberCard
        v-model="dashboard.selectedHour"
        class="map-panel__scrubber"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.map-panel {
  @include card;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: inherit;
  overflow: hidden;
  border-radius: $radius-lg;

  &__stage {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: inherit;
  }

  // 지도·플레이스홀더·오버레이가 절대배치로 채우는 영역
  &__viewport {
    position: relative;
    flex: 1;
    min-height: inherit;
  }

  &__map {
    position: absolute;
    inset: 0;
    // 네이버 SDK가 컨테이너에 인라인 position: relative를 심어 absolute가 무효화될 수 있어
    // inset에 의존하지 않고 명시적 크기로 뷰포트를 채운다
    width: 100%;
    height: 100%;
  }

  &__placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-2;
    background:
      linear-gradient(rgba(226, 232, 240, 0.4) 1px, transparent 1px),
      linear-gradient(90deg, rgba(226, 232, 240, 0.4) 1px, transparent 1px);
    background-size: 24px 24px;
    background-color: #eef4ee;
  }

  &__pin {
    font-size: 32px;
  }

  &__text {
    font-size: $font-size-base;
    font-weight: 600;
    color: $color-text-secondary;
  }

  &__hint {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-align: center;
    padding: 0 $space-4;
  }

  &__overlays {
    position: absolute;
    inset: $space-3;
    pointer-events: none;

    > * {
      pointer-events: auto;
    }
  }

  &__risk {
    position: absolute;
    top: 0;
    left: 0;
  }

  &__controls {
    position: absolute;
    top: 0;
    right: 0;
  }

  &__legend {
    position: absolute;
    right: 0;
    // 스크러버 카드(하단 고정)와 겹치지 않도록 그 위에 배치
    bottom: 132px;
  }

  &__scrubber {
    position: absolute;
    left: $space-3;
    right: $space-3;
    bottom: $space-3;
    z-index: 1;
  }

  // 좁은 화면: 스크러버를 지도 밖 일반 플로우로 내려 지도를 가리지 않게 한다
  @include below($bp-sm) {
    &__stage {
      min-height: 0;
    }

    &__viewport {
      flex: none;
      min-height: 320px;
    }

    &__overlays {
      inset: $space-2;
    }

    &__legend {
      display: none;
    }

    &__scrubber {
      position: static;
      margin: $space-2;
    }
  }
}
</style>
