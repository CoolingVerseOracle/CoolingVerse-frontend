/**
 * 지도 pane 고정 캔버스 오버레이 공용 베이스 — OverlayView 서브클래스.
 * 캔버스를 지도 overlayLayer pane 안에 넣어 드래그 중에도 그림이 지리 좌표에
 * 고정된다(뷰포트 고정 캔버스 방식은 팬 중에 화면에 붙어 따라오는 버그).
 * 캔버스 배치·마진·projection 준비 재시도를 여기서 소유하고,
 * 실제 그리기는 소비자가 넘긴 paint 콜백에 위임한다.
 * (소비자: naverHeatLayer 히트맵, naverBoundaryLayer 분석 영역 경계)
 */

export interface OverlayFrame {
  /** 크기 설정·그리기는 paint가 소유한다 — 베이스는 위치만 잡는다 */
  canvas: HTMLCanvasElement
  /** 그려야 할 캔버스 크기(px) — 뷰포트 + 양쪽 마진 */
  width: number
  height: number
  /** pane 좌표계의 캔버스 좌상단 — 패턴 정렬 등 pane 고정 계산용 */
  left: number
  top: number
  /** 위경도 → 캔버스 픽셀 좌표 */
  toCanvasPoint(lat: number, lng: number): { x: number; y: number }
}

export interface CanvasOverlay {
  setMap(map: naver.maps.Map | null): void
  getMap(): naver.maps.Map | null
  redraw(): void
}

/** 뷰포트 대비 여유 렌더 마진 비율 — 드래그로 드러나는 가장자리 공백을 줄인다 */
const MARGIN_RATIO = 0.5

export interface CanvasOverlayOptions {
  /** 캔버스 전체 감쇠 — 히트맵처럼 배경 레이어로 쓸 때 */
  opacity?: number
}

/** naver SDK 로드 이후에만 호출 가능 (클래스가 naver.maps.OverlayView를 상속) */
export function createCanvasOverlay(
  paint: (frame: OverlayFrame) => void,
  options: CanvasOverlayOptions = {},
): CanvasOverlay {
  class PaneCanvasOverlay extends naver.maps.OverlayView {
    private canvas = document.createElement('canvas')
    private retries = 0
    private retryTimer: ReturnType<typeof setTimeout> | null = null

    constructor() {
      super()
      this.canvas.style.position = 'absolute'
      this.canvas.style.pointerEvents = 'none'
      if (options.opacity != null) this.canvas.style.opacity = String(options.opacity)
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
      const left = topLeft.x - marginX
      const top = topLeft.y - marginY
      this.canvas.style.left = `${left}px`
      this.canvas.style.top = `${top}px`

      paint({
        canvas: this.canvas,
        width: size.width + marginX * 2,
        height: size.height + marginY * 2,
        left,
        top,
        toCanvasPoint(lat: number, lng: number) {
          const offset = projection.fromCoordToOffset(new naver.maps.LatLng(lat, lng))
          return { x: offset.x - left, y: offset.y - top }
        },
      })
    }

    onRemove(): void {
      if (this.retryTimer) clearTimeout(this.retryTimer)
      this.canvas.remove()
    }
  }

  return new PaneCanvasOverlay()
}
