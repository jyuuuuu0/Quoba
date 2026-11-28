# Quoba

**Quote + Base** — 내가 한 모든 말의 저장소.

카카오톡, 디스코드, 슬랙, 텔레그램, 왓츠앱, 메일, 노션, 옵시디언, GitHub, 내 컴퓨터 파일에 흩어진 대화에서
"누가 언제 무슨 말을 했는지"를 찾아 원문 출처와 함께 보여주는 데스크톱 앱입니다.
검색 엔진으로 [AutoRAG Agent](https://github.com/Marker-Inc-Korea/AutoRAG)를 사용하며, 대화 원본은 내 컴퓨터 밖으로 나가지 않습니다.

## 주요 기능

- **통합 검색** — 앱·기간·화자를 몰라도 뜻으로 검색하고, 문장마다 출처를 표시
- **Promises** — "제가 할게요" 같은 내 약속을 자동으로 모아 할 일 목록으로
- **Timeline** — 한 주제에 대한 대화를 앱 구분 없이 시간순으로
- **단축키** — 앱 안 단축키와 어디서든 Quoba를 여는 전역 단축키를 설정에서 변경
- **다국어** — English, 한국어, 日本語
- **API 키 없이 시작** — 검색은 로그인 없이, AI 답변은 브라우저 로그인 한 번으로

## 시작하기

**필요 환경**: Node.js 24 이상 (AutoRAG Agent 요구 사항), macOS 또는 Windows

```bash
npm install
npm run dev
```

처음 실행하면 온보딩에서 언어, 내 이름("내가 한 말" 구분용), 연결할 소스를 고릅니다.
검색과 약속 수집은 로그인 없이 동작하고, AI 답변을 쓰려면 설정에서 Dazzi 브라우저 로그인을 한 번 하면 됩니다.

## 스크립트

| 명령                | 설명                                         |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | 개발 모드 실행                               |
| `npm run build`     | 프로덕션 빌드 (`out/`)                       |
| `npm run dist`      | 설치 파일 만들기 (`dist/`, .dmg / .exe)      |
| `npm run typecheck` | 타입 검사                                    |
| `npm run lint`      | ESLint                                       |
| `npm run lint:i18n` | en / ko / ja 번역 키가 서로 맞는지 검사      |
| `npm test`          | 단위 테스트 (vitest)                         |
| `npm run eval`      | 성능 평가 ([eval/README.md](eval/README.md)) |

## 구조

```
src/
├─ main/       Electron 메인 프로세스 (창, IPC, 설정 저장, 전역 단축키)
├─ engine/     AutoRAG를 실행하는 별도 프로세스 (검색, 답변, 약속 추출, 로그인)
├─ preload/    렌더러에 노출하는 타입 안전 API
├─ renderer/   React 화면 (검색, 소스, 약속, 타임라인, 설정, 온보딩)
└─ shared/     프로세스 간 공유 타입과 상수
eval/          평가 데이터 생성과 채점
```

엔진은 Electron `utilityProcess`에서 돌아서 인덱싱이 무거워도 화면이 멈추지 않습니다.
IPC 입력은 zod로 검증하고, 렌더러는 sandbox와 contextIsolation이 켜진 상태로 실행됩니다.

## 릴리스

`v*` 태그를 푸시하면 GitHub Actions가 macOS · Windows 설치 파일을 만들어 드래프트 릴리스에 올립니다.

```bash
git tag v0.1.0 && git push origin v0.1.0
```

코드 서명은 아직 설정하지 않아 첫 실행 시 OS 경고가 뜹니다.

## 커밋 규칙

`type: 내용` 형식을 사용합니다.

| type     | 용도                     |
| -------- | ------------------------ |
| feat     | 새 기능                  |
| fix      | 버그 수정                |
| refactor | 동작 변경 없는 구조 개선 |
| style    | 포맷, 스타일             |
| chore    | 설정, 의존성             |
| docs     | 문서                     |
| test     | 테스트                   |
| ci       | 빌드·배포                |
