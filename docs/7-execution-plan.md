# 실행계획 (Execution Plan)

## 문서 정보

| 항목 | 내용 |
|------|------|
| 버전 | 1.0 |
| 작성일 | 2026-05-13 |
| 관련 문서 | [2-prd.md](./2-prd.md), [4-project-principles.md](./4-project-principles.md), [6-erd.md](./6-erd.md) |
| 목적 | MVP(UC-01·02·05~09) 개발을 위한 단계별 실행계획 및 Task 분해 |

---

## 사전 결정 사항 (착수 전 확인 필수)

개발 착수 전에 아래 Open Questions를 반드시 결정한다.

| ID | 질문 | 기본값 (결정 전 임시 적용) |
|----|------|--------------------------|
| OQ-01 | JWT Access Token 만료 시간 | `1h` |
| OQ-02 | 기본 카테고리 목록 | `업무, 개인, 쇼핑, 기타` (schema.sql 적용 완료) |
| OQ-03 | 할일 목록 정렬 기준 | `created_at DESC` |

---

## 전체 Task 목록 및 의존성 요약

```
[DB-01] 환경 구성 및 스키마 적용
    └─▶ [DB-02] 마이그레이션 파일 분리
    └─▶ [BE-01] 백엔드 프로젝트 초기화
            └─▶ [BE-02] DB 연결 · 설정 모듈
                    └─▶ [BE-03] 공통 미들웨어
                            ├─▶ [BE-04] Auth 모듈 (회원가입·로그인)
                            ├─▶ [BE-05] Categories 모듈 (목록 조회)
                            └─▶ [BE-06] Todos 모듈 (CRUD)
                                    └─▶ [BE-07] 통합 테스트
[FE-01] 프론트엔드 프로젝트 초기화
    └─▶ [FE-02] 공통 설정 (라우터·스토어·QueryClient)
            ├─▶ [FE-03] Auth 화면 (SCR-01·02)
            ├─▶ [FE-04] 할일 목록 화면 (SCR-03)
            ├─▶ [FE-05] 할일 등록·수정 화면 (SCR-04·05)
            └─▶ [FE-06] 공통 컴포넌트 (Button·Input·Modal·Select)
                    └─▶ [FE-07] E2E 연동 검증
```

---

## 1. 데이터베이스 (Database)

### DB-01 · 로컬 환경 구성 및 스키마 적용

**목표**: PostgreSQL 17 데이터베이스를 로컬에서 구동하고 `database/schema.sql`을 적용한다.

#### 완료 조건
- [ ] PostgreSQL 17 서버가 로컬에서 정상 실행된다 (`pg_isready` 성공)
- [ ] `todolist_dev` 데이터베이스가 생성된다
- [ ] `database/schema.sql`을 실행하면 오류 없이 3개 테이블(users, categories, todos)이 생성된다
- [ ] 4개 기본 카테고리 시드 데이터(업무·개인·쇼핑·기타)가 categories 테이블에 INSERT된다
- [ ] `psql -c "\d todos"` 로 컬럼·인덱스 구조가 ERD와 일치함을 확인한다
- [ ] `.env.example`에 `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD` 항목이 포함된다

#### 의존성
- 없음 (최초 착수 가능)

---

### DB-02 · 마이그레이션 파일 분리

**목표**: `database/schema.sql`을 테이블 단위 마이그레이션 파일로 분리하여 버전 관리한다.

#### 완료 조건
- [ ] `database/migrations/001-create-users.sql` 파일이 존재한다
- [ ] `database/migrations/002-create-categories.sql` 파일이 존재한다
- [ ] `database/migrations/003-create-todos.sql` 파일이 존재한다
- [ ] `database/seeds/seed-categories.sql` 파일에 기본 카테고리 INSERT 문이 포함된다
- [ ] 마이그레이션 파일을 순서대로 실행했을 때 `database/schema.sql`과 동일한 결과를 낸다
- [ ] 각 마이그레이션 파일은 `IF NOT EXISTS` 또는 `DROP TABLE IF EXISTS`로 재실행 안전성을 보장한다

#### 의존성
- [x] DB-01 완료 후 착수

---

## 2. 백엔드 (Backend)

### BE-01 · 프로젝트 초기화 및 기본 구조 구성

**목표**: `backend/` 디렉토리에 Express + TypeScript 프로젝트를 초기화하고 `4-project-principles.md`에 정의된 디렉토리 구조를 생성한다.

#### 완료 조건
- [ ] `backend/package.json`에 아래 의존성이 선언된다
  - 런타임: `express`, `pg`, `jsonwebtoken`, `bcrypt`, `morgan`, `winston`, `dotenv`
  - 개발: `typescript`, `ts-node-dev`, `@types/*`
- [ ] `backend/tsconfig.json`에 `strict: true`가 활성화된다
- [ ] 아래 디렉토리 구조가 생성된다
  ```
  backend/src/
    config/ · middleware/ · modules/(auth·users·todos·categories) · types/ · utils/
  ```
- [ ] `backend/src/app.ts`에 Express 앱 인스턴스가 생성되고 `json()`, `morgan` 미들웨어가 등록된다
- [ ] `backend/src/server.ts`에서 포트 3000(기본값)으로 서버가 기동된다
- [ ] `npm run dev` 명령으로 서버가 정상 기동되고 `GET /health` 가 `200 OK`를 반환한다
- [ ] `.env.example`에 `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY`, `SERVER_PORT`, `NODE_ENV`, `CORS_ORIGIN` 항목이 포함된다

#### 의존성
- [x] DB-01 완료 후 착수

---

### BE-02 · DB 연결 및 설정 모듈

**목표**: `pg.Pool` 기반 DB 연결 인스턴스와 환경변수 파싱 모듈을 구현한다.

#### 완료 조건
- [ ] `backend/src/config/db.ts`에서 `pg.Pool`이 `DATABASE_URL` 환경변수를 사용해 초기화된다
- [ ] Pool 최대 연결 수가 20으로 설정된다
- [ ] `backend/src/config/env.ts`에서 필수 환경변수(`DATABASE_URL`, `JWT_SECRET`)가 존재하지 않을 경우 서버 기동 시 즉시 프로세스를 종료한다
- [ ] `db.query()`를 통해 `SELECT 1` 쿼리 실행이 성공한다 (연결 검증)
- [ ] DB 연결 실패 시 winston 로거에 에러 레벨 로그가 출력된다

#### 의존성
- [x] BE-01 완료 후 착수
- [x] DB-01 완료 (DB 서버 실행 중)

---

### BE-03 · 공통 미들웨어 구현

**목표**: JWT 인증, 전역 에러 핸들러, 입력 검증 미들웨어를 구현한다.

#### 완료 조건

**인증 미들웨어** (`auth.middleware.ts`):
- [ ] `Authorization: Bearer <token>` 헤더가 없으면 `401 Unauthorized`를 반환한다
- [ ] 유효하지 않거나 만료된 토큰은 `401 Unauthorized`를 반환한다
- [ ] 유효한 토큰은 `req.user`에 `{ id, email }`을 설정하고 `next()`를 호출한다
- [ ] `backend/src/types/express.d.ts`에 `req.user` 타입이 확장 선언된다

**에러 핸들러** (`error.middleware.ts`):
- [ ] `production` 환경에서는 스택 트레이스를 응답 바디에 포함하지 않는다
- [ ] 처리되지 않은 에러는 `500 Internal Server Error`로 응답한다
- [ ] 알려진 비즈니스 에러(예: `AppError` 클래스)는 지정된 HTTP 상태코드로 응답한다
- [ ] 모든 서버 에러는 winston 로거에 기록된다

**입력 검증** (`validation.middleware.ts`):
- [ ] 필수 필드 누락 시 `400 Bad Request`와 어느 필드가 누락되었는지 메시지를 반환한다
- [ ] 이메일 형식 검증이 동작한다 (RFC 5322 기준)

#### 의존성
- [x] BE-02 완료 후 착수

---

### BE-04 · Auth 모듈 구현 (UC-01·02)

**목표**: 회원가입과 로그인 API를 구현한다.

#### 완료 조건

**회원가입** (`POST /api/auth/register`):
- [ ] 이메일·비밀번호·이름이 모두 있어야 하며, 누락 시 `400`을 반환한다
- [ ] 이메일 형식이 유효하지 않으면 `400`을 반환한다
- [ ] 이미 가입된 이메일이면 `409 Conflict`를 반환한다
- [ ] 비밀번호는 `bcrypt.hash(password, 10)` 이상으로 해시하여 저장한다
- [ ] 성공 시 `201 Created`와 `{ id, email, name }` (비밀번호 미포함)을 반환한다

**로그인** (`POST /api/auth/login`):
- [ ] 존재하지 않는 이메일이면 `401 Unauthorized`를 반환한다
- [ ] 비밀번호 불일치 시 `401 Unauthorized`를 반환한다 (이메일 존재 여부 노출 금지)
- [ ] 성공 시 `200 OK`와 `{ access_token, user: { id, email, name } }`을 반환한다
- [ ] `access_token`의 payload에는 `user_id`와 `email`이 포함된다
- [ ] `access_token`의 만료 시간은 `JWT_EXPIRY` 환경변수 값을 따른다

**공통**:
- [ ] 모든 SQL 쿼리는 파라미터화 쿼리(`$1, $2`)를 사용한다
- [ ] `backend/src/utils/password.utils.ts`에 `hashPassword()`, `comparePassword()` 함수가 구현된다
- [ ] `backend/src/utils/jwt.utils.ts`에 `signToken()`, `verifyToken()` 함수가 구현된다

#### 의존성
- [x] BE-03 완료 후 착수

---

### BE-05 · Categories 모듈 구현 (MVP: 조회만)

**목표**: 카테고리 목록 조회 API를 구현한다. (사용자 정의 카테고리 CRUD는 Post-MVP)

#### 완료 조건

**목록 조회** (`GET /api/categories`):
- [ ] `auth.middleware`가 적용되어 인증되지 않은 요청은 `401`을 반환한다
- [ ] 기본 카테고리(`user_id IS NULL`) + 로그인 사용자 소유 카테고리를 함께 반환한다
- [ ] 반환 형식: `{ data: [{ id, name, is_default }] }`
- [ ] 기본 카테고리가 목록 상단에 먼저 나온다

**공통**:
- [ ] `categories.repository.ts`에 `findByUserId(userId)` 함수가 구현된다
- [ ] 모든 쿼리는 파라미터화 쿼리를 사용한다

#### 의존성
- [x] BE-03 완료 후 착수

---

### BE-06 · Todos 모듈 구현 (UC-05~09)

**목표**: 할일 CRUD 및 완료 처리 API를 모두 구현한다.

#### 완료 조건

**목록 조회** (`GET /api/todos`):
- [ ] `auth.middleware`가 적용된다
- [ ] 로그인 사용자 본인의 할일만 반환된다
- [ ] `?category_id=` 파라미터로 카테고리 필터링이 동작한다
- [ ] `?is_completed=true/false` 파라미터로 완료 여부 필터링이 동작한다
- [ ] `?overdue=true` 파라미터로 기간 초과(`due_date < CURRENT_DATE AND is_completed = FALSE`) 필터링이 동작한다
- [ ] 기본 정렬은 `created_at DESC`이다
- [ ] 반환 형식: `{ data: [todos] }`

**단건 조회** (`GET /api/todos/:id`):
- [ ] 존재하지 않는 ID는 `404 Not Found`를 반환한다
- [ ] 다른 사용자의 할일에 접근하면 `403 Forbidden`을 반환한다

**등록** (`POST /api/todos`):
- [ ] `title`과 `category_id`는 필수이며, 누락 시 `400`을 반환한다
- [ ] `category_id`가 DB에 존재하지 않으면 `400`을 반환한다
- [ ] `due_date`는 ISO 8601 날짜 형식(`YYYY-MM-DD`)만 허용한다
- [ ] 성공 시 `201 Created`와 생성된 할일 전체를 반환한다

**수정** (`PUT /api/todos/:id`):
- [ ] 존재하지 않는 ID는 `404`를 반환한다
- [ ] 다른 사용자의 할일 수정 시도는 `403`을 반환한다
- [ ] `updated_at`이 현재 시각으로 갱신된다
- [ ] 성공 시 `200 OK`와 수정된 할일 전체를 반환한다

**완료 토글** (`PATCH /api/todos/:id/complete`):
- [ ] 존재하지 않는 ID는 `404`를 반환한다
- [ ] 다른 사용자의 할일 토글 시도는 `403`을 반환한다
- [ ] `is_completed`가 `TRUE ↔ FALSE`로 토글된다
- [ ] `updated_at`이 갱신된다
- [ ] 반환 형식: `{ id, is_completed, updated_at }`

**삭제** (`DELETE /api/todos/:id`):
- [ ] 존재하지 않는 ID는 `404`를 반환한다
- [ ] 다른 사용자의 할일 삭제 시도는 `403`을 반환한다
- [ ] 성공 시 `204 No Content`를 반환한다

**공통**:
- [ ] `todos.repository.ts`에 `findByUserId()`, `findById()`, `create()`, `update()`, `updateComplete()`, `remove()` 함수가 구현된다
- [ ] 모든 쿼리는 파라미터화 쿼리를 사용한다
- [ ] 소유권 검증 로직은 `todos.service.ts`에 위치한다

#### 의존성
- [x] BE-03 완료 후 착수
- [x] BE-05 완료 (카테고리 유효성 검사 필요)

---

### BE-07 · 백엔드 통합 테스트

**목표**: 주요 시나리오에 대한 통합 테스트를 작성하고 통과시킨다.

#### 완료 조건
- [ ] `tests/integration/auth.test.ts`: 회원가입·로그인 성공/실패 케이스를 커버한다
- [ ] `tests/integration/todos.test.ts`: 할일 CRUD·완료 토글·필터링 성공/실패 케이스를 커버한다
- [ ] `tests/integration/auth-guard.test.ts`: 인증 토큰 없음·만료·다른 사용자 접근 등 보안 케이스를 커버한다
- [ ] `npm test` 실행 시 모든 테스트가 통과한다
- [ ] 테스트는 별도 `todolist_test` 데이터베이스를 사용하며, 각 테스트 후 데이터를 초기화한다

#### 의존성
- [x] BE-04·BE-05·BE-06 모두 완료 후 착수

---

## 3. 프론트엔드 (Frontend)

### FE-01 · 프로젝트 초기화 및 기본 구조 구성

**목표**: `frontend/` 디렉토리에 React 19 + TypeScript + Vite 프로젝트를 초기화하고 `4-project-principles.md`에 정의된 디렉토리 구조를 생성한다.

#### 완료 조건
- [ ] `frontend/package.json`에 아래 의존성이 선언된다
  - 런타임: `react@19`, `react-dom@19`, `react-router-dom`, `zustand`, `@tanstack/react-query`
  - 개발: `typescript`, `vite`, `@types/react`, `@types/react-dom`
- [ ] `frontend/tsconfig.json`에 `strict: true`가 활성화된다
- [ ] 아래 디렉토리 구조가 생성된다
  ```
  frontend/src/
    api/ · components/(common·layout) · features/(auth·todos·categories)
    pages/ · stores/ · types/ · utils/ · constants/ · router/
  ```
- [ ] `npm run dev` 명령으로 Vite 개발 서버가 기동된다 (기본 포트 5173)
- [ ] `frontend/.env.example`에 `VITE_API_BASE_URL` 항목이 포함된다
- [ ] `vite.config.ts`에 백엔드 프록시 설정(`/api → http://localhost:3000`)이 포함된다

#### 의존성
- 없음 (DB-01과 병렬 착수 가능)

---

### FE-02 · 공통 설정 (라우터·스토어·QueryClient)

**목표**: 라우팅, Zustand 인증 스토어, TanStack Query 클라이언트를 설정한다.

#### 완료 조건

**라우터** (`router/AppRouter.tsx`):
- [ ] `/login` → `LoginPage`, `/register` → `RegisterPage`, `/todos` → `TodoListPage`, `/todos/create` → `TodoCreatePage`, `/todos/:id/edit` → `TodoEditPage` 라우팅이 설정된다
- [ ] 인증되지 않은 사용자가 `/todos`에 접근 시 `/login`으로 리다이렉트되는 `PrivateRoute`가 구현된다
- [ ] 인증된 사용자가 `/login`, `/register`에 접근 시 `/todos`로 리다이렉트된다

**인증 스토어** (`stores/useAuthStore.ts`):
- [ ] `{ user, token, isLoading }` 상태와 `setUser()`, `setToken()`, `setLoading()`, `logout()` 액션이 구현된다
- [ ] `token`은 메모리에만 저장된다 (localStorage 사용 금지)
- [ ] `logout()` 호출 시 `user`와 `token`이 `null`로 초기화된다
- [ ] 컴포넌트 외부에서 `useAuthStore.getState().token`으로 토큰에 접근 가능하다

**TanStack Query** (`main.tsx`):
- [ ] `QueryClient`가 `staleTime: 1000 * 60` (1분)으로 설정된다
- [ ] `QueryClientProvider`가 앱 최상위에 래핑된다
- [ ] 개발 환경에서 `ReactQueryDevtools`가 활성화된다

#### 의존성
- [x] FE-01 완료 후 착수

---

### FE-03 · Auth 화면 구현 (SCR-01·02, UC-01·02)

**목표**: 회원가입과 로그인 화면을 구현하고 백엔드 API와 연동한다.

#### 완료 조건

**API 클라이언트** (`api/auth.api.ts`):
- [ ] `register(email, password, name)` 함수가 `POST /api/auth/register`를 호출한다
- [ ] `login(email, password)` 함수가 `POST /api/auth/login`을 호출하고 `{ access_token, user }`를 반환한다
- [ ] API 에러 시 서버 응답 메시지를 포함한 에러를 throw한다

**회원가입 화면** (`pages/RegisterPage.tsx`):
- [ ] 이메일·비밀번호·이름 입력 필드가 존재한다
- [ ] 필수 필드 미입력 시 각 필드 하단에 에러 메시지가 표시된다
- [ ] 회원가입 성공 시 `/login`으로 이동한다
- [ ] 이미 사용 중인 이메일 오류 시 `409` 응답 메시지가 표시된다
- [ ] 로그인 화면으로 이동하는 링크가 있다

**로그인 화면** (`pages/LoginPage.tsx`):
- [ ] 이메일·비밀번호 입력 필드가 존재한다
- [ ] 로그인 성공 시 `useAuthStore.setToken()` 및 `setUser()`를 호출한 후 `/todos`로 이동한다
- [ ] 인증 실패 시 `401` 응답 메시지가 표시된다
- [ ] 회원가입 화면으로 이동하는 링크가 있다

**공통**:
- [ ] 모바일(375px) 기준에서 레이아웃이 깨지지 않는다
- [ ] API 호출 중 로딩 상태(`isLoading`)가 버튼에 시각적으로 표시된다

#### 의존성
- [x] FE-02 완료 후 착수
- [x] BE-04 완료 (API 연동 테스트 시)

---

### FE-04 · 할일 목록 화면 구현 (SCR-03, UC-06·08)

**목표**: 할일 목록 조회, 필터링, 완료 처리 화면을 구현한다.

#### 완료 조건

**API 클라이언트** (`api/todos.api.ts`):
- [ ] `getTodos(params)` 함수가 `GET /api/todos`를 호출하며 필터 파라미터를 querystring으로 전달한다
- [ ] `completeTodo(id)` 함수가 `PATCH /api/todos/:id/complete`를 호출한다
- [ ] 모든 API 함수는 `useAuthStore.getState().token`으로 `Authorization: Bearer` 헤더를 설정한다

**훅** (`features/todos/hooks/`):
- [ ] `useTodos(filters)`: `useQuery`를 사용하며, 필터 파라미터가 변경되면 자동으로 재요청된다
- [ ] `useTodoMutations()`: `completeTodo`를 `useMutation`으로 구현하며, 성공 시 `queryClient.invalidateQueries(['todos'])`를 호출한다

**할일 목록 화면** (`pages/TodoListPage.tsx`):
- [ ] 필터 패널에 카테고리·완료여부·기간초과 필터가 존재한다
- [ ] 필터 변경 시 목록이 즉시 갱신된다
- [ ] 각 할일 카드에 제목·카테고리 태그·종료예정일이 표시된다
- [ ] 기간 초과 할일의 종료예정일은 붉은색으로 강조 표시된다
- [ ] 완료 체크박스 클릭 시 `completeTodo` API가 호출되고 목록이 갱신된다
- [ ] 할일이 없을 경우 빈 상태 메시지가 표시된다
- [ ] 헤더에 로그인 사용자 이름과 로그아웃 버튼이 표시된다
- [ ] 로그아웃 클릭 시 `useAuthStore.logout()`이 호출되고 `/login`으로 이동한다
- [ ] 할일 등록 버튼 클릭 시 `/todos/create`로 이동한다

**카테고리 API** (`api/categories.api.ts`):
- [ ] `getCategories()` 함수가 `GET /api/categories`를 호출한다
- [ ] `useCategories()` 훅이 `useQuery`로 구현된다

**공통**:
- [ ] 모바일(375px) · 데스크톱(1280px) 레이아웃이 깨지지 않는다

#### 의존성
- [x] FE-02 완료 후 착수
- [x] BE-05·BE-06 완료 (API 연동 테스트 시)

---

### FE-05 · 할일 등록·수정 화면 구현 (SCR-04·05, UC-05·07·09)

**목표**: 할일 등록과 수정·삭제 화면을 구현한다.

#### 완료 조건

**API 클라이언트** (`api/todos.api.ts` 추가):
- [ ] `createTodo(data)` 함수가 `POST /api/todos`를 호출한다
- [ ] `updateTodo(id, data)` 함수가 `PUT /api/todos/:id`를 호출한다
- [ ] `deleteTodo(id)` 함수가 `DELETE /api/todos/:id`를 호출한다
- [ ] `getTodoById(id)` 함수가 `GET /api/todos/:id`를 호출한다

**훅** (`features/todos/hooks/useTodoMutations.ts` 추가):
- [ ] `createTodo`: 성공 시 `/todos`로 이동하고 `todos` 쿼리를 무효화한다
- [ ] `updateTodo`: 성공 시 `/todos`로 이동하고 `todos` 쿼리를 무효화한다
- [ ] `deleteTodo`: 성공 시 `/todos`로 이동하고 `todos` 쿼리를 무효화한다

**할일 등록 화면** (`pages/TodoCreatePage.tsx`):
- [ ] 제목(필수)·설명(선택)·종료예정일(선택)·카테고리(필수) 입력 필드가 존재한다
- [ ] 카테고리 선택 드롭다운에 기본 카테고리 목록이 표시된다
- [ ] 제목 미입력 시 에러 메시지가 표시된다
- [ ] 저장 성공 시 할일 목록 화면으로 이동한다
- [ ] 취소 버튼 클릭 시 할일 목록 화면으로 이동한다

**할일 수정 화면** (`pages/TodoEditPage.tsx`):
- [ ] 기존 할일 데이터가 폼에 미리 채워진다
- [ ] 수정 후 저장 성공 시 할일 목록 화면으로 이동한다
- [ ] 삭제 버튼 클릭 시 확인 다이얼로그 후 삭제 API가 호출된다
- [ ] 삭제 성공 시 할일 목록 화면으로 이동한다
- [ ] 존재하지 않는 할일 ID 접근 시 에러 메시지를 표시하거나 목록으로 리다이렉트한다

**공통**:
- [ ] 모바일(375px) · 데스크톱(1280px) 레이아웃이 깨지지 않는다

#### 의존성
- [x] FE-02·FE-04 완료 후 착수
- [x] BE-05·BE-06 완료 (API 연동 테스트 시)

---

### FE-06 · 공통 컴포넌트 구현

**목표**: 재사용 가능한 공통 UI 컴포넌트를 구현한다.

#### 완료 조건

**Button** (`components/common/Button.tsx`):
- [ ] `variant` (primary·secondary·danger)와 `isLoading` prop을 지원한다
- [ ] `isLoading`이 `true`일 때 버튼이 비활성화되고 로딩 표시가 나타난다

**Input** (`components/common/Input.tsx`):
- [ ] `label`, `error`, `required` prop을 지원한다
- [ ] `error`가 있으면 인풋 테두리가 붉게 표시되고 에러 메시지가 하단에 표시된다

**Select** (`components/common/Select.tsx`):
- [ ] `options: { value, label }[]` prop으로 옵션 목록을 렌더링한다
- [ ] `error` prop을 지원한다

**Modal** (`components/common/Modal.tsx`):
- [ ] `isOpen`, `onClose`, `title`, `children` prop을 지원한다
- [ ] 배경 클릭 시 `onClose`가 호출된다
- [ ] ESC 키 입력 시 `onClose`가 호출된다

**AppLayout** (`components/layout/AppLayout.tsx`):
- [ ] 모바일·데스크톱 레이아웃을 모두 지원하는 래퍼 컴포넌트이다
- [ ] `Header.tsx`가 포함된다

#### 의존성
- [x] FE-01 완료 후 착수 (FE-03·04·05와 병렬 진행 가능)

---

### FE-07 · E2E 연동 검증

**목표**: 프론트엔드–백엔드 전체 연동을 검증하고 핵심 시나리오가 정상 동작함을 확인한다.

#### 완료 조건

**회원가입·로그인 흐름**:
- [ ] SCR-01에서 회원가입 후 SCR-02 로그인, SCR-03 할일 목록 진입이 연속으로 성공한다
- [ ] 잘못된 비밀번호 입력 시 에러 메시지가 표시된다
- [ ] 페이지 새로고침 시 로그인 화면으로 이동한다 (Zustand 메모리 초기화)

**할일 CRUD 흐름**:
- [ ] SCR-04에서 할일을 등록하면 SCR-03 목록에 즉시 나타난다
- [ ] SCR-05에서 할일을 수정하면 SCR-03 목록에 변경 내용이 반영된다
- [ ] SCR-03에서 완료 체크박스 클릭 시 완료 상태가 즉시 갱신된다
- [ ] SCR-05에서 할일 삭제 시 SCR-03 목록에서 사라진다

**필터링 흐름**:
- [ ] 카테고리 필터 선택 시 해당 카테고리 할일만 표시된다
- [ ] 완료 여부 필터 선택 시 해당 상태 할일만 표시된다
- [ ] 기간 초과 필터 선택 시 오늘 이전 `due_date`를 가진 미완료 할일만 표시된다

**보안 검증**:
- [ ] 로그인 없이 `/todos` 접근 시 `/login`으로 리다이렉트된다
- [ ] 토큰 없이 API 직접 호출 시 `401` 응답이 반환된다

**UI 반응형 검증**:
- [ ] 375px(모바일) 너비에서 주요 화면(SCR-01~05)이 정상 렌더링된다
- [ ] 1280px(데스크톱) 너비에서 주요 화면이 정상 렌더링된다

#### 의존성
- [x] FE-03·FE-04·FE-05·FE-06 모두 완료 후 착수
- [x] BE-07 완료 (백엔드 통합 테스트 통과)

---

## Task 요약표

| Task ID | 제목 | 단위 | 우선순위 | 의존성 |
|---------|------|------|---------|-------|
| DB-01 | 환경 구성 및 스키마 적용 | DB | 최상 | 없음 |
| DB-02 | 마이그레이션 파일 분리 | DB | 중 | DB-01 |
| BE-01 | 프로젝트 초기화 | Backend | 최상 | DB-01 |
| BE-02 | DB 연결·설정 모듈 | Backend | 최상 | BE-01, DB-01 |
| BE-03 | 공통 미들웨어 | Backend | 높음 | BE-02 |
| BE-04 | Auth 모듈 (UC-01·02) | Backend | 높음 | BE-03 |
| BE-05 | Categories 모듈 | Backend | 높음 | BE-03 |
| BE-06 | Todos 모듈 (UC-05~09) | Backend | 높음 | BE-03, BE-05 |
| BE-07 | 백엔드 통합 테스트 | Backend | 중 | BE-04·05·06 |
| FE-01 | 프로젝트 초기화 | Frontend | 최상 | 없음 (DB-01과 병렬) |
| FE-02 | 공통 설정 | Frontend | 최상 | FE-01 |
| FE-03 | Auth 화면 (SCR-01·02) | Frontend | 높음 | FE-02 |
| FE-04 | 할일 목록 화면 (SCR-03) | Frontend | 높음 | FE-02 |
| FE-05 | 할일 등록·수정 화면 (SCR-04·05) | Frontend | 높음 | FE-02·04 |
| FE-06 | 공통 컴포넌트 | Frontend | 중 | FE-01 (병렬 가능) |
| FE-07 | E2E 연동 검증 | Frontend | 중 | FE-03·04·05·06, BE-07 |

---

## 병렬 실행 권장 구간

아래 Task 그룹은 서로 독립적이므로 동시에 진행할 수 있다.

| 구간 | 병렬 실행 가능 Task |
|------|-------------------|
| 1단계 | `DB-01` ‖ `FE-01` |
| 2단계 | `DB-02` ‖ `BE-01` ‖ `FE-02` |
| 3단계 | `BE-02` ‖ `FE-06` |
| 4단계 | `BE-04` ‖ `BE-05` ‖ `FE-03` ‖ `FE-04` |
| 5단계 | `BE-06` ‖ `FE-05` |
| 6단계 | `BE-07` ‖ `FE-07` |

---

## 변경 이력

| 버전 | 날짜 | 변경자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2026-05-13 | Plan Engineer | 실행계획 최초 작성. DB 2개, Backend 7개, Frontend 7개 총 16개 Task 정의 |
