/**
 * 네이버 지도용 히트맵 오버레이 — OverlayView 서브클래스.
 * 캔버스를 지도 overlayLayer pane 안에 넣어 드래그 중에도 히트맵이
 * 지리 좌표에 고정된다(뷰포트 고정 캔버스 방식은 팬 중에 화면에 붙어 따라오는 버그).
 * 실제 그리기는 heatmapCanvas.drawHeatmap에 위임한다.
 */
import { drawHeatmap } from './heatmapCanvas'

export interface GeoHeatPoint {
  lat: number
  lng: number
  /** 0–1 가중치 */
  weight: number
}

export interface HeatLayer {
  setMap(map: naver.maps.Map | null): void
  getMap(): naver.maps.Map | null
  setData(points: GeoHeatPoint[]): void
  redraw(): void
}

/** 뷰포트 대비 여유 렌더 마진 비율 — 드래그로 드러나는 가장자리 공백을 줄인다 */
const MARGIN_RATIO = 0.5

/** naver SDK 로드 이후에만 호출 가능 (클래스가 naver.maps.OverlayView를 상속) */
export function createHeatLayer(radius = 18): HeatLayer {
  class HeatOverlay extends naver.maps.OverlayView {
    private canvas = document.createElement('canvas')
    private points: GeoHeatPoint[] = []
    private retries = 0
    private retryTimer: ReturnType<typeof setTimeout> | null = null

    constructor() {
      super()
      this.canvas.style.position = 'absolute'
      this.canvas.style.pointerEvents = 'none'
      // 히트맵은 배경 레이어 — 마커 pane(클러스터 핀)이 위에서 또렷하게 보이도록 감쇠
      this.canvas.style.opacity = '0.55'
    }

    setData(points: GeoHeatPoint[]): void {
      this.points = points
      this.redraw()
    }

    redraw(): void {
      if (this.getMap()) this.draw()
    }

    onAdd(): void {
      this.getPanes().overlayLayer.appendChild(this.canvas)
    }

    draw(): void {
      const map = this.getMap() as naver.maps.Map | null
      if (!map) return
      const projection = this.getProjection() as naver.maps.MapSystemProjection | undefined
      const size = map.getSize()
      // 지도 생성 직후에는 projection/레이아웃이 준비 전일 수 있어 짧게 재시도
      if (!projection || size.width === 0 || size.height === 0) {
        if (this.retries < 20) {
          this.retries += 1
          if (this.retryTimer) clearTimeout(this.retryTimer)
          this.retryTimer = setTimeout(() => {
            this.retryTimer = null
            this.redraw()
          }, 150)
        }
        return
      }
      this.retries = 0

      const marginX = Math.round(size.width * MARGIN_RATIO)
      const marginY = Math.round(size.height * MARGIN_RATIO)
      const bounds = map.getBounds() as naver.maps.LatLngBounds
      const ne = bounds.getNE()
      const sw = bounds.getSW()
      // 캔버스를 뷰포트 좌상단(+마진) 위치에 pane 좌표로 고정
      const topLeft = projection.fromCoordToOffset(new naver.maps.LatLng(ne.lat(), sw.lng()))
      this.canvas.style.left = `${topLeft.x - marginX}px`
      this.canvas.style.top = `${topLeft.y - marginY}px`

      const width = size.width + marginX * 2
      const height = size.height + marginY * 2
      const pixels = this.points.map((p) => {
        const offset = projection.fromCoordToOffset(new naver.maps.LatLng(p.lat, p.lng))
        return { x: offset.x - topLeft.x + marginX, y: offset.y - topLeft.y + marginY, weight: p.weight }
      })
      drawHeatmap(this.canvas, pixels, width, height, radius)
    }

    onRemove(): void {
      if (this.retryTimer) clearTimeout(this.retryTimer)
      this.canvas.remove()
    }
  }

  return new HeatOverlay()
}
