/**
 * 분석 영역 경계 오버레이 — 경계 실선과 영역 밖 파란 사선을 한 캔버스에 그린다.
 * naverHeatLayer와 같은 pane(overlayLayer) 캔버스 방식이라 드래그 중에도
 * 지리 좌표에 고정된다. 뷰포트 전체를 사선 패턴으로 칠한 뒤 분석 영역
 * 사각형만 뚫어내고(clearRect) 그 둘레에 실선을 두르는 방식. (이슈 #26 C안)
 *
 * 실선을 SDK Rectangle로 따로 그리지 않는 이유: 셰이프와 캔버스가 서로 다른
 * 렌더 경로를 타면 줌 애니메이션 중 둘의 갱신 시점이 어긋나 실선이 사선·지도와
 * 따로 노는 것처럼 보인다. 같은 캔버스에 그리면 구조적으로 어긋날 수 없다.
 */
import type { GeoBounds } from '@/types/geo'

export interface BoundaryLayer {
  setMap(map: naver.maps.Map | null): void
  getMap(): naver.maps.Map | null
  setBounds(bounds: GeoBounds): void
  redraw(): void
}

/** 뷰포트 대비 여유 렌더 마진 비율 — 드래그로 드러나는 가장자리 공백을 줄인다 */
const MARGIN_RATIO = 0.5

/** 사선 패턴 타일 크기(px) — 값이 클수록 줄 간격이 넓어진다 */
const PATTERN_SIZE = 12

/** 파란 사선 타일 — 대각선 1줄이 이어지도록 양옆 반 줄을 함께 그린다 */
function buildHatchPattern(color: string): HTMLCanvasElement {
  const tile = document.createElement('canvas')
  tile.width = PATTERN_SIZE
  tile.height = PATTERN_SIZE
  const ctx = tile.getContext('2d')
  if (!ctx) return tile
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.lineCap = 'square'
  const s = PATTERN_SIZE
  ctx.beginPath()
  ctx.moveTo(-s / 2, s / 2)
  ctx.lineTo(s / 2, -s / 2)
  ctx.moveTo(0, s)
  ctx.lineTo(s, 0)
  ctx.moveTo(s / 2, s * 1.5)
  ctx.lineTo(s * 1.5, s / 2)
  ctx.stroke()
  return tile
}

export interface BoundaryLayerStyle {
  /** 영역 외 사선 색 */
  hatchColor: string
  /** 경계 실선 색 */
  lineColor: string
}

/** naver SDK 로드 이후에만 호출 가능 (클래스가 naver.maps.OverlayView를 상속) */
export function createBoundaryLayer(style: BoundaryLayerStyle): BoundaryLayer {
  class BoundaryOverlay extends naver.maps.OverlayView {
    private canvas = document.createElement('canvas')
    private pattern: CanvasPattern | null = null
    private bounds: GeoBounds | null = null
    private retries = 0
    private retryTimer: ReturnType<typeof setTimeout> | null = null

    constructor() {
      super()
      this.canvas.style.position = 'absolute'
      this.canvas.style.pointerEvents = 'none'
    }

    setBounds(bounds: GeoBounds): void {
      this.bounds = bounds
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
      if (!map || !this.bounds) return
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
      const viewBounds = map.getBounds() as naver.maps.LatLngBounds
      const ne = viewBounds.getNE()
      const sw = viewBounds.getSW()
      // 캔버스를 뷰포트 좌상단(+마진) 위치에 pane 좌표로 고정
      const topLeft = projection.fromCoordToOffset(new naver.maps.LatLng(ne.lat(), sw.lng()))
      const left = topLeft.x - marginX
      const top = topLeft.y - marginY
      this.canvas.style.left = `${left}px`
      this.canvas.style.top = `${top}px`

      const width = size.width + marginX * 2
      const height = size.height + marginY * 2
      this.canvas.width = width
      this.canvas.height = height
      const ctx = this.canvas.getContext('2d')
      if (!ctx) return

      this.pattern ??= ctx.createPattern(buildHatchPattern(style.hatchColor), 'repeat')
      if (!this.pattern) return

      // 패턴 원점을 pane 좌표에 맞춰 팬/줌 후 재그리기에도 줄무늬가 이어지게 한다
      const s = PATTERN_SIZE
      const offX = ((left % s) + s) % s
      const offY = ((top % s) + s) % s
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.translate(-offX, -offY)
      ctx.fillStyle = this.pattern
      ctx.fillRect(0, 0, width + s, height + s)
      ctx.restore()

      // 분석 영역 사각형만 뚫어내고(그 밖이 "영역 외") 둘레에 경계 실선을 두른다
      const nw = projection.fromCoordToOffset(
        new naver.maps.LatLng(this.bounds.latMax, this.bounds.lngMin),
      )
      const se = projection.fromCoordToOffset(
        new naver.maps.LatLng(this.bounds.latMin, this.bounds.lngMax),
      )
      const rectX = nw.x - left
      const rectY = nw.y - top
      const rectW = se.x - nw.x
      const rectH = se.y - nw.y
      ctx.clearRect(rectX, rectY, rectW, rectH)
      ctx.strokeStyle = style.lineColor
      ctx.lineWidth = 2
      ctx.strokeRect(rectX, rectY, rectW, rectH)
    }

    onRemove(): void {
      if (this.retryTimer) clearTimeout(this.retryTimer)
      this.canvas.remove()
    }
  }

  return new BoundaryOverlay()
}
