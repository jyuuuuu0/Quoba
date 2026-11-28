# Quoba 코드리뷰 가이드

## 언어

- 모든 리뷰 요약과 댓글은 **한국어**로 작성한다.
- 코드, 식별자, 에러 메시지는 원문 그대로 둔다.

## 프로젝트 맥락

Quoba는 Electron + React 19 + TypeScript 데스크톱 앱이다. 사용자의 채팅 · 메일 · 노트 · 파일을 AutoRAG Agent(`@autorag/librarian`)로 검색한다.
대화 원문은 매우 민감한 개인 데이터라서 보안과 프라이버시를 가장 우선한다.

- `src/main`: 메인 프로세스 (창, IPC, 설정 저장, 전역 단축키)
- `src/engine`: utilityProcess에서 도는 AutoRAG 엔진 (검색, 답변, 약속 추출, 로그인)
- `src/preload`: 렌더러에 노출하는 API (sandbox, contextIsolation)
- `src/renderer`: React 화면, zustand 상태, i18next 다국어
- `src/shared`: 프로세스 간 공유 타입

## 중점적으로 볼 것

1. **보안**
   - IPC 입력은 메인 프로세스에서 zod로 검증해야 한다.
   - 렌더러에서 Node API나 `ipcRenderer`를 직접 노출하지 않는다.
   - 토큰 · 자격 증명은 `safeStorage`나 Pi `auth.json`에만 두고, 로그와 렌더러로 보내지 않는다.
   - 대화 원문을 외부로 보내는 코드(네트워크 요청, 로그)를 추가하면 반드시 지적한다.
2. **다국어**
   - 화면에 보이는 문자열은 하드코딩하지 않고 `t()`를 쓴다.
   - 새 키는 `en` / `ko` / `ja` 세 파일에 모두 있어야 한다.
3. **엔진 프로세스**
   - 무거운 작업(인덱싱, 검색)은 `src/engine`에서만 하고 메인 프로세스를 막지 않는다.
   - 엔진 프로토콜(`protocol.ts`)을 바꾸면 `host.ts`와 `src/main/engine.ts`가 함께 바뀌었는지 확인한다.
4. **타입**
   - `any`, 근거 없는 `as` 캐스팅, `@ts-ignore`를 지적한다.
5. **디자인 토큰**
   - 색은 `styles.css`의 토큰(`ink`, `panel`, `fg*`, `mint*` 등)을 쓴다. 임의의 hex 값을 지적한다.
   - mint 강조색은 아껴 쓴다. 검색창에 glow나 shadow를 넣지 않는다.

## 지적하지 않을 것

- Prettier · ESLint가 이미 잡는 포맷 문제
- 취향 차이 수준의 이름 변경 제안
- 커밋 메시지 형식 (`type: 내용`은 별도 규칙으로 관리)
