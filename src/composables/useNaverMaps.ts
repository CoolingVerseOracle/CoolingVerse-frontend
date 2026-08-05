/**
 * 네이버 지도(NCP Maps) JS SDK 로더.
 * - 스크립트는 앱 전체에서 1회만 주입한다(싱글턴 프라미스).
 * - 키 미설정/로드 실패 시 reject — 사용처(MapPanel)가 플레이스홀더로 전환한다.
 */
const SCRIPT_TIMEOUT_MS = 10_000

const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID

/** 키가 있어야만 지도 로드를 시도한다 — 템플릿 분기용 */
export const isMapAvailable = Boolean(clientId)

let loadPromise: Promise<typeof naver.maps> | null = null

export function loadNaverMaps(): Promise<typeof naver.maps> {
  if (loadPromise) return loadPromise

  loadPromise = new Promise<typeof naver.maps>((resolve, reject) => {
    if (!clientId) {
      reject(new Error('VITE_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다.'))
      return
    }
    if (typeof naver !== 'undefined' && naver.maps) {
      resolve(naver.maps)
      return
    }

    const script = document.createElement('script')
    // 히트맵은 커스텀 캔버스로 그리므로 visualization 서브모듈은 불필요
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`
    script.async = true

    const timeout = setTimeout(() => {
      reject(new Error('네이버 지도 스크립트 로드 시간 초과'))
    }, SCRIPT_TIMEOUT_MS)

    script.onload = () => {
      if (typeof naver === 'undefined' || !naver.maps) {
        clearTimeout(timeout)
        reject(new Error('네이버 지도 SDK 초기화 실패'))
        return
      }
      // visualization 등 서브모듈은 maps.js onload 이후 비동기로 로드된다 —
      // jsContentLoaded 전에 resolve하면 naver.maps.visualization이 undefined다
      if (naver.maps.jsContentLoaded) {
        clearTimeout(timeout)
        resolve(naver.maps)
        return
      }
      naver.maps.onJSContentLoaded = () => {
        clearTimeout(timeout)
        resolve(naver.maps)
      }
    }
    script.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('네이버 지도 스크립트 로드 실패 (키/도메인 등록 확인)'))
    }
    document.head.appendChild(script)
  })

  // 실패를 캐시하지 않는다 — 새로고침 없이 재시도 가능하도록
  loadPromise.catch(() => {
    loadPromise = null
  })

  return loadPromise
}
