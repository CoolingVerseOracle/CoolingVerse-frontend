/**
 * 분석 영역 경계 오버레이 — pane 고정 캔버스(naverCanvasOverlay) 하나에
 * 영역 밖 파란 사선과 경계 실선을 함께 그린다. (이슈 #26 C안)
 *
 * 실선을 SDK Rectangle로 따로 그리지 않는 이유: 셰이프와 캔버스가 서로 다른
 * 렌더 경로를 타면 줌 애니메이션 중 둘의 갱신 시점이 어긋나 실선이 사선·지도와
 * 따로 노는 것처럼 보인다. 같은 캔버스에 그리면 구조적으로 어긋날 수 없다.
 */
import { createCanvasOverlay, type CanvasOverlay } from './naverCanvasOverlay'
import type { GeoBounds } from '@/types/geo'

export interface BoundaryLayer extends CanvasOverlay {
  setBounds(bounds: GeoBounds): void
}

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

/** naver SDK 로드 이후에만 호출 가능 */
export function createBoundaryLayer(style: BoundaryLayerStyle): BoundaryLayer {
  let bounds: GeoBounds | null = null
  let pattern: CanvasPattern | null = null

  const overlay = createCanvasOverlay(({ canvas, width, height, left, top, toCanvasPoint }) => {
    if (!bounds) return
    // width/height 대입은 값이 같아도 비트맵을 재할당·초기화하므로 크기가 변한 경우에만
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    pattern ??= ctx.createPattern(buildHatchPattern(style.hatchColor), 'repeat')
    if (!pattern) return

    // 분석 영역 사각형 (캔버스 픽셀 좌표)
    const nw = toCanvasPoint(bounds.latMax, bounds.lngMin)
    const se = toCanvasPoint(bounds.latMin, bounds.lngMax)
    // 캔버스와의 교집합 — 사선은 이 사각형 밖 네 밴드(상·하·좌·우)에만 채운다
    const holeX0 = Math.min(Math.max(nw.x, 0), width)
    const holeX1 = Math.min(Math.max(se.x, 0), width)
    const holeY0 = Math.min(Math.max(nw.y, 0), height)
    const holeY1 = Math.min(Math.max(se.y, 0), height)

    ctx.clearRect(0, 0, width, height)
    // 패턴 원점을 pane 좌표에 맞춰 팬/줌 후 재그리기에도 줄무늬가 이어지게 한다
    const s = PATTERN_SIZE
    pattern.setTransform(
      new DOMMatrix().translateSelf(-(((left % s) + s) % s), -(((top % s) + s) % s)),
    )
    ctx.fillStyle = pattern
    const bands: [number, number, number, number][] = [
      [0, 0, width, holeY0],
      [0, holeY1, width, height - holeY1],
      [0, holeY0, holeX0, holeY1 - holeY0],
      [holeX1, holeY0, width - holeX1, holeY1 - holeY0],
    ]
    for (const [x, y, w, h] of bands) {
      if (w > 0 && h > 0) ctx.fillRect(x, y, w, h)
    }

    ctx.strokeStyle = style.lineColor
    ctx.lineWidth = 2
    ctx.strokeRect(nw.x, nw.y, se.x - nw.x, se.y - nw.y)
  })

  // overlay는 클래스 인스턴스라 스프레드하면 프로토타입 메서드가 사라진다 — 명시적 위임
  return {
    setMap: (map) => overlay.setMap(map),
    getMap: () => overlay.getMap(),
    redraw: () => overlay.redraw(),
    setBounds(next: GeoBounds): void {
      bounds = next
      overlay.redraw()
    },
  }
}
