<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MapRiskSummary from './MapRiskSummary.vue'
import MapLayerControls from './MapLayerControls.vue'
import MapLegend from './MapLegend.vue'
import TimeScrubberCard from './TimeScrubberCard.vue'
import { isMapAvailable, loadNaverMaps } from '@/composables/useNaverMaps'
import { drawHeatmap } from './heatmapCanvas'
import { chartColors } from '@/composables/useEchartsTheme'
import { regionByCode } from '@/constants/regions'
import { useDashboardStore } from '@/stores/dashboard'
import { useSimulationStore } from '@/stores/simulation'

const dashboard = useDashboardStore()
const simulation = useSimulationStore()

const mapEl = ref<HTMLDivElement | null>(null)
const heatCanvasEl = ref<HTMLCanvasElement | null>(null)
const mapReady = ref(false)
const mapFailed = ref(false)

// 지도 객체들은 반응형일 필요가 없다 — ref에 넣으면 프록시 래핑 비용만 생긴다
let map: naver.maps.Map | null = null
let clusterMarkers: naver.maps.Marker[] = []
let mapListeners: naver.maps.MapEventListener[] = []
let heatRaf = 0
let destroyed = false

function currentRegion() {
  return regionByCode(simulation.settings.region ?? 'pangyo')
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
    // 팬/줌/리사이즈 시 히트맵 캔버스를 다시 그린다 (rAF로 스로틀)
    mapListeners = [
      naver.maps.Event.addListener(map, 'bounds_changed', scheduleHeatDraw),
      naver.maps.Event.addListener(map, 'zoom_changed', scheduleHeatDraw),
    ]
    window.addEventListener('resize', scheduleHeatDraw)
    scheduleHeatDraw()
    renderClusters()
  } catch (error) {
    console.warn('[MapPanel] 지도 초기화 실패 — 플레이스홀더로 전환합니다.', error)
    mapFailed.value = true
  }
}

function scheduleHeatDraw(): void {
  if (heatRaf) return
  heatRaf = requestAnimationFrame(() => {
    heatRaf = 0
    renderHeatmap()
  })
}

/**
 * 커스텀 캔버스 히트맵 — 네이버 visualization.HeatMap은 타일을 뷰포트 밖에 배치하는
 * 문제가 있어 사용하지 않는다. 격자 좌표를 뷰포트 픽셀로 변환해 직접 그린다.
 */
function renderHeatmap(): void {
  const canvas = heatCanvasEl.value
  if (!canvas) return
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const grids = dashboard.gridRisk?.grids
  if (!map || !dashboard.heatmapOn || !grids?.length) {
    drawHeatmap(canvas, [], width, height)
    return
  }
  const projection = map.getProjection()
  const points = grids.map((g) => {
    const offset = projection.fromCoordToOffset(new naver.maps.LatLng(g.lat, g.lng))
    return { x: offset.x, y: offset.y, weight: g.riskScore / 100 }
  })
  drawHeatmap(canvas, points, width, height, 18)
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
    bucket.riskSum += g.riskScore
    bucket.count += 1
    buckets.set(key, bucket)
  }

  for (const bucket of buckets.values()) {
    const meanRisk = bucket.riskSum / bucket.count
    const color =
      meanRisk >= 65 ? chartColors.danger : meanRisk >= 40 ? chartColors.warning : chartColors.primary
    const size = Math.min(44, 24 + Math.round(bucket.count / 12))
    clusterMarkers.push(
      new naver.maps.Marker({
        map,
        position: new naver.maps.LatLng(bucket.latSum / bucket.count, bucket.lngSum / bucket.count),
        icon: {
          content: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};opacity:.85;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.25)">${bucket.count}</div>`,
          anchor: new naver.maps.Point(size / 2, size / 2),
        },
      }),
    )
  }
}

watch(
  () => dashboard.gridRisk,
  () => {
    scheduleHeatDraw()
    renderClusters()
  },
)
watch(() => dashboard.heatmapOn, scheduleHeatDraw)
watch(() => dashboard.clusterOn, renderClusters)
watch(
  () => simulation.settings.region,
  () => {
    if (!map) return
    const region = currentRegion()
    map.morph(new naver.maps.LatLng(region.center.lat, region.center.lng), region.zoom)
  },
)

onMounted(() => {
  void initMap()
})

onBeforeUnmount(() => {
  destroyed = true
  if (heatRaf) cancelAnimationFrame(heatRaf)
  window.removeEventListener('resize', scheduleHeatDraw)
  mapListeners.forEach((l) => naver.maps.Event.removeListener(l))
  mapListeners = []
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
        <canvas
          ref="heatCanvasEl"
          class="map-panel__heat"
          aria-hidden="true"
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

  // 커스텀 히트맵 캔버스 — 지도 위, 오버레이 카드 아래
  &__heat {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
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
