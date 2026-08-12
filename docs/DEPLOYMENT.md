# 프런트엔드 배포 및 CI/CD

프런트엔드는 OCI Compute의 nginx가 `https://coolingverse.com`에서 정적 파일을 제공하고, 같은 출처의 `/api` 요청은 Spring Boot 백엔드로 전달하는 구조다. 따라서 운영 빌드는 `VITE_API_BASE_URL=/api`를 사용하며 CORS 설정이 필요 없다. `www.coolingverse.com`은 대표 주소로 리다이렉트한다.

## 자동화 흐름

| 시점 | 작업 | 결과 |
| --- | --- | --- |
| `main` 대상 PR | lint · 타입 검사 · 단위 테스트 · 프로덕션 빌드 | 병합 전 품질 검증 |
| `main` 병합 | 위 검증을 다시 수행한 뒤 OCI Compute에 업로드 | 새 정적 사이트 릴리스 활성화 |
| 수동 실행 | Actions의 **Frontend CD** 실행 | 같은 절차로 재배포 |

배포 워크플로는 릴리스를 `/var/www/coolingverse/releases/<commit>-<attempt>`에 풀고, `index.html`과 HTTPS를 확인한 폴더만 `/var/www/coolingverse/current` 심볼릭 링크로 전환한다. 검증 실패 시 직전 링크로 복구한다.

## GitHub `production` 환경 설정

각 저장소의 **Settings → Environments → production**에서 승인 규칙(필요 시)을 설정한 뒤 아래 값을 등록한다. 배포 작업은 `production` 환경에 연결돼 있어 해당 환경의 비밀값만 읽는다.

| 구분 | 이름 | 값 |
| --- | --- | --- |
| Environment secret | `DEPLOY_HOST` | OCI Compute 공인 IP 또는 도메인 |
| Environment secret | `DEPLOY_USER` | 서버 배포 계정 (현재 구성은 `ubuntu`) |
| Environment secret | `DEPLOY_SSH_PRIVATE_KEY` | 배포 전용 SSH 개인키 전체 |
| Environment secret | `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan -H <호스트>` 결과 |
| Environment variable | `DEPLOY_PORT` | SSH 포트, 기본값 `22` |
| Repository variable | `NAVER_MAP_CLIENT_ID` | 네이버 지도 클라이언트 ID — 브라우저에 포함되는 공개 값 |

`NAVER_MAP_CLIENT_ID`는 프런트 번들에 포함되므로 비밀값으로 취급하면 안 된다. 설정하지 않아도 배포·로그인은 동작하지만 지도는 플레이스홀더로 표시된다.

## 서버 최초 1회 준비

백엔드의 `deploy/nginx-api.conf`를 nginx 사이트 설정으로 설치한 뒤, 프런트 릴리스 경로를 만든다.

```bash
sudo install -d -o ubuntu -g www-data -m 2775 /var/www/coolingverse/releases
```

백엔드 저장소의 `deploy/nginx-bootstrap.conf`로 최초 인증서를 발급하고 최종 HTTPS 설정으로 교체한 뒤 첫 **Frontend CD**를 실행한다. 이후에는 `main` 병합마다 자동으로 반영된다.

## 배포 확인

```bash
curl -I https://coolingverse.com/
curl -I https://www.coolingverse.com/
curl -I https://coolingverse.com/api/login
```

첫 요청은 `200`, `www`는 apex로 리다이렉트, 로그인 GET은 `405`가 정상이다. 네이버 지도 콘솔의 서비스 URL에도 `https://coolingverse.com`을 등록한다.
