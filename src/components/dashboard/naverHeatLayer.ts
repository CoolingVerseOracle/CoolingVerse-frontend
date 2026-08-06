/**
 * 네이버 지도용 히트맵 오버레이 — pane 고정 캔버스(naverCanvasOverlay) 위에
 * heatmapCanvas.drawHeatmap으로 격자 가중치를 그린다.
 */
import { createCanvasOverlay, type CanvasOverlay } from './naverCanvasOverlay'
import { drawHeatmap } from './heatmapCanvas'

export interface GeoHeatPoint {
  lat: number
  lng: number
  /** 0–1 가중치 */
  weight: number
}

export interface HeatLayer extends CanvasOverlay {
  setData(points: GeoHeatPoint[]): void
}

/** naver SDK 로드 이후에만 호출 가능 */
export function createHeatLayer(radius = 18): HeatLayer {
  let points: GeoHeatPoint[] = []

  const overlay = createCanvasOverlay(
    ({ canvas, width, height, toCanvasPoint }) => {
      const pixels = points.map((p) => ({ ...toCanvasPoint(p.lat, p.lng), weight: p.weight }))
      drawHeatmap(canvas, pixels, width, height, radius)
    },
    // 히트맵은 배경 레이어 — 마커 pane(클러스터 핀)이 위에서 또렷하게 보이도록 감쇠
    { opacity: 0.55 },
  )

  // overlay는 클래스 인스턴스라 스프레드하면 프로토타입 메서드가 사라진다 — 명시적 위임
  return {
    setMap: (map) => overlay.setMap(map),
    getMap: () => overlay.getMap(),
    redraw: () => overlay.redraw(),
    setData(next: GeoHeatPoint[]): void {
      points = next
      overlay.redraw()
    },
  }
}
