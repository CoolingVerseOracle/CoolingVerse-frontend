<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MapRiskSummary from './MapRiskSummary.vue'
import MapLayerControls from './MapLayerControls.vue'
import MapLegend from './MapLegend.vue'
import TimeScrubberCard from './TimeScrubberCard.vue'
import { isMapAvailable, loadNaverMaps } from '@/composables/useNaverMaps'
import { createHeatLayer, type HeatLayer } from './naverHeatLayer'
import { createBoundaryLayer, type BoundaryLayer } from './naverBoundaryLayer'
import { chartColors } from '@/composables/useEchartsTheme'
import { regionByCode } from '@/constants/regions'
import { boundsEqual, expandBounds } from '@/utils/geoBounds'
import { bucketGrids, cellSizeForZoom, type ClusterBucket } from '@/utils/clusterGrids'
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
let boundaryLayer: BoundaryLayer | null = null
let clusterMarkers: naver.maps.Marker[] = []
let clusterListeners: naver.maps.MapEventListener[] = []
let mapListeners: naver.maps.MapEventListener[] = []
let overlayRaf = 0
let destroyed = false

// 제한 박스보다 훨씬 넓게 축소되지 않도록 지역 기본 줌에서 허용하는 축소 단계
const MIN_ZOOM_STEPS_OUT = 2

function currentRegion() {
  return regionByCode(simulation.settings.region ?? 'pangyo')
}

function toLatLngBounds(bounds: GeoBounds): naver.maps.LatLngBounds {
  return new naver.maps.LatLngBounds(
    new naver.maps.LatLng(bounds.latMin, bounds.lngMin),
    new naver.maps.LatLng(bounds.latMax, bounds.lngMax),
  )
}

// 마지막으로 지도에 반영한 데이터 바운딩박스 — 시간대 스크럽마다 같은 박스로 재설정하는 것을 막는다
let appliedBounds: GeoBounds | null = null

/**
 * 현재 지역 grid-risk 응답의 바운딩박스를 지도에 반영 — 이동 제한(느슨한 1.75배 박스)과
 * 경계 실선·영역 외 사선 표시를 갱신한다 (이슈 #26 C안). 상수가 아니라 응답 기반이라
 * 지역(district)이 추가되어도 해당 지역 데이터 범위를 그대로 따라간다
 */
function applyDataBounds(): void {
  if (!map) return
  const bounds = dashboard.gridBounds
  if (!bounds) {
    // 지역 전환 직후 등 현재 지역 응답이 아직 없음 — 제한을 풀고 새 응답을 기다린다
    if (appliedBounds) {
      appliedBounds = null
      map.setOptions({ maxBounds: null })
    }
    return
  }
  if (appliedBounds && boundsEqual(appliedBounds, bounds)) return
  appliedBounds = bounds
  boundaryLayer?.setBounds(bounds)
  map.setOptions({ maxBounds: toLatLngBounds(expandBounds(bounds)) })
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
      minZoom: region.zoom - MIN_ZOOM_STEPS_OUT,
      mapDataControl: false,
      scaleControl: false,
      logoControlOptions: { position: maps.Position.BOTTOM_LEFT },
    })
    mapReady.value = true
    heatLayer = createHeatLayer(18)
    heatLayer.setMap(dashboard.heatmapOn ? map : null)
    updateHeatData()
    // 분석 영역 경계 실선 + 영역 외 파란 사선 — 데이터 범위를 명시한다
    boundaryLayer = createBoundaryLayer({
      hatchColor: 'rgba(30, 144, 255, 0.35)',
      lineColor: chartColors.primary,
    })
    boundaryLayer.setMap(map)
    // 격자 응답이 지도보다 먼저 도착해 있을 수 있으므로 즉시 1회 반영
    applyDataBounds()
    // 팬 후 드러난 마진 영역은 bounds_changed로, 줌은 애니메이션이 끝난 idle에서 다시 그린다
    // (줌 시작 시점(zoom_changed)에 그리면 pane 변환이 끝나기 전 좌표로 재배치되어 어긋난다)
    mapListeners = [
      naver.maps.Event.addListener(map, 'bounds_changed', scheduleOverlayDraw),
      naver.maps.Event.addListener(map, 'idle', scheduleOverlayDraw),
      // 클러스터 마커는 SDK가 좌표 기준으로 배치하므로 캔버스 오버레이와 달리
      // 줌 시작 시점(zoom_changed)에 셀 크기를 다시 계산해 재버킷팅해도 어긋나지 않는다
      naver.maps.Event.addListener(map, 'zoom_changed', renderClusters),
    ]
    renderClusters()
  } catch (error) {
    console.warn('[MapPanel] 지도 초기화 실패 — 플레이스홀더로 전환합니다.', error)
    mapFailed.value = true
  }
}

function scheduleOverlayDraw(): void {
  if (overlayRaf) return
  overlayRaf = requestAnimationFrame(() => {
    overlayRaf = 0
    if (destroyed) return
    heatLayer?.redraw()
    boundaryLayer?.redraw()
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

// 핀 클릭 확대 폭과 상한 — 셀이 줌당 절반씩 줄어 +2면 버킷이 4분할된 모습을 보게 된다
const CLUSTER_CLICK_ZOOM_STEP = 2
const CLUSTER_MAX_ZOOM = 19

/** 핀 클릭 시 해당 버킷 영역으로 부드럽게 확대 — 세분화된 하위 클러스터가 드러난다 */
function zoomToBucket(bucket: ClusterBucket): void {
  if (!map) return
  const targetZoom = Math.min(map.getZoom() + CLUSTER_CLICK_ZOOM_STEP, CLUSTER_MAX_ZOOM)
  map.morph(new naver.maps.LatLng(bucket.lat, bucket.lng), targetZoom)
}

/**
 * 플러그인 없는 경량 클러스터 — 줌 레벨에 따라 셀 크기를 바꿔 버킷팅해
 * 평균 위험도 핀을 표시한다 (이슈 #24). 최대 줌 부근에서는 셀이 격자 간격보다
 * 작아져 자연스럽게 개별 격자 표시로 풀린다
 */
function renderClusters(): void {
  if (!map) return
  clusterListeners.forEach((l) => naver.maps.Event.removeListener(l))
  clusterListeners = []
  clusterMarkers.forEach((m) => m.setMap(null))
  clusterMarkers = []
  const grids = dashboard.gridRisk?.grids
  if (!dashboard.clusterOn || !grids?.length) return

  const cell = cellSizeForZoom(map.getZoom())
  const buckets = bucketGrids(
    grids.map((g) => ({ lat: g.lat, lng: g.lng, score: displayScore(g) })),
    cell,
  )

  for (const bucket of buckets) {
    const color =
      bucket.meanScore >= 65
        ? chartColors.danger
        : bucket.meanScore >= 40
          ? chartColors.warning
          : chartColors.primary
    // 크기는 격자 개수(밀도) 유지 — 숫자·색상은 평균 위험도로 통일 (이슈 #30)
    const size = Math.min(44, 26 + Math.round(bucket.count / 12))
    // 흰 배경 + 색 테두리 유지 — 스타일은 전역 .map-cluster-pin 블록 참조 (SDK 주입 DOM이라 scoped 불가)
    const marker = new naver.maps.Marker({
      map,
      position: new naver.maps.LatLng(bucket.lat, bucket.lng),
      icon: {
        content: `<div class="map-cluster-pin" style="width:${size}px;height:${size}px;border-color:${color};color:${color}">${Math.round(bucket.meanScore)}<span class="map-cluster-pin__tip">격자 ${bucket.count}개 · 평균 ${bucket.meanScore.toFixed(1)} · 최대 ${bucket.maxScore.toFixed(1)}</span></div>`,
        anchor: new naver.maps.Point(size / 2, size / 2),
      },
    })
    clusterListeners.push(naver.maps.Event.addListener(marker, 'click', () => zoomToBucket(bucket)))
    clusterMarkers.push(marker)
  }
}

watch(
  () => dashboard.gridRisk,
  () => {
    updateHeatData()
    renderClusters()
    applyDataBounds()
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
    // 지역이 바뀌면 스토어 gridBounds가 즉시 null이 되므로(응답 지역 검사) 이전 제한이 풀려
    // morph가 경계에 막히지 않는다. 새 제한·경계는 새 지역 응답 도착 시 다시 걸린다
    applyDataBounds()
    map.setOptions({ minZoom: region.zoom - MIN_ZOOM_STEPS_OUT })
    map.morph(new naver.maps.LatLng(region.center.lat, region.center.lng), region.zoom)
  },
)

onMounted(() => {
  void initMap()
})

onBeforeUnmount(() => {
  destroyed = true
  if (overlayRaf) cancelAnimationFrame(overlayRaf)
  mapListeners.forEach((l) => naver.maps.Event.removeListener(l))
  mapListeners = []
  clusterListeners.forEach((l) => naver.maps.Event.removeListener(l))
  clusterListeners = []
  heatLayer?.setMap(null)
  heatLayer = null
  boundaryLayer?.setMap(null)
  boundaryLayer = null
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

<style lang="scss">
// 클러스터 핀 — 네이버 SDK가 마커 content로 주입하는 DOM이라 scoped 속성이 붙지 않아 전역 블록에서 스타일링.
// 흰 배경 + 위험도 색 테두리(파랑/주황/빨강)는 인라인 border-color/color로 핀마다 지정된다
.map-cluster-pin {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid;
  border-radius: 50%;
  background: #fff;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.35);
  cursor: pointer;

  // 호버 상세 팝업 — 격자 수·평균/최대 위험지수
  &__tip {
    display: none;
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    border-radius: 6px;
    background: rgba(15, 23, 42, 0.92);
    color: #fff;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    z-index: 1;
  }

  &:hover &__tip {
    display: block;
  }
}
</style>

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
