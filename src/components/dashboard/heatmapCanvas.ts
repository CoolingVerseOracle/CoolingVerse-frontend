/**
 * 캔버스 히트맵 렌더러 — 네이버 visualization.HeatMap 대체.
 * (서브모듈이 히트맵 타일을 뷰포트 밖 좌표에 배치하는 문제가 있어 직접 그린다.
 *  지도 위에 겹친 캔버스에 뷰포트 픽셀 좌표로 렌더링하며, 지도 API에 의존하지 않는다)
 *
 * 방식: 표준 2-pass 히트맵 —
 *  1) 각 점을 가중치만큼의 알파를 가진 방사형 그라데이션(검정)으로 누적
 *  2) 누적된 알파값을 색상 램프(파랑→주황→빨강)로 치환
 */

export interface HeatPoint {
  /** 캔버스 픽셀 좌표 */
  x: number
  y: number
  /** 0–1 가중치 */
  weight: number
}

/** 알파(0–255) → RGBA 색상 램프 룩업테이블. 토큰 색과 동일 팔레트(primary/warning/danger) */
function buildColorLut(): Uint8ClampedArray {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return new Uint8ClampedArray(256 * 4)
  const gradient = ctx.createLinearGradient(0, 0, 256, 0)
  gradient.addColorStop(0, 'rgba(30, 144, 255, 0)') // $color-primary, 투명
  gradient.addColorStop(0.3, 'rgba(30, 144, 255, 0.7)')
  gradient.addColorStop(0.6, 'rgba(245, 158, 11, 0.8)') // $color-warning
  gradient.addColorStop(0.85, 'rgba(220, 38, 38, 0.85)') // $color-danger
  gradient.addColorStop(1, 'rgba(185, 28, 28, 0.9)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 1)
  return ctx.getImageData(0, 0, 256, 1).data
}

let lut: Uint8ClampedArray | null = null

/**
 * points를 (width×height) 캔버스에 히트맵으로 그린다. 기존 내용은 지워진다.
 * 뷰포트 밖 점은 자동으로 걸러진다.
 */
export function drawHeatmap(
  canvas: HTMLCanvasElement,
  points: HeatPoint[],
  width: number,
  height: number,
  radius = 18,
): void {
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx || width === 0 || height === 0) return
  ctx.clearRect(0, 0, width, height)
  if (!points.length) return

  // 1-pass: 알파 누적 — 점이 겹치며 합산되므로 개별 알파는 낮게 잡아 포화를 막는다
  for (const p of points) {
    if (p.x < -radius || p.y < -radius || p.x > width + radius || p.y > height + radius) continue
    const alpha = Math.min(1, Math.max(0.03, p.weight * 0.4))
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius)
    gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2)
  }

  // 2-pass: 알파 → 색상 램프 치환
  lut ??= buildColorLut()
  const image = ctx.getImageData(0, 0, width, height)
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]
    if (alpha === 0) continue
    const offset = alpha * 4
    data[i] = lut[offset]
    data[i + 1] = lut[offset + 1]
    data[i + 2] = lut[offset + 2]
    data[i + 3] = lut[offset + 3]
  }
  ctx.putImageData(image, 0, 0)
}
