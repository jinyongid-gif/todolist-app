# 프론트엔드 통합 가이드

## 문서 정보

| 항목 | 내용 |
|------|------|
| 버전 | 1.0 |
| 작성일 | 2026-05-14 |
| 관련 문서 | [2-prd.md](./2-prd.md), [4-project-principles.md](./4-project-principles.md), [7-execution-plan.md](./7-execution-plan.md) |
| 목적 | 완성된 백엔드 API와 프론트엔드를 연동하는 데 필요한 모든 정보를 제공 |
| 대상 독자 | FE-01~FE-07 Task를 담당하는 프론트엔드 개발자 |

---

## 1. 백엔드 서버 실행

### 1.1 사전 조건

- PostgreSQL 17 로컬 실행 중
- `todolist_dev` 데이터베이스 및 스키마 적용 완료
- `backend/.env` 파일 설정 완료

### 1.2 실행 명령

```bash
# backend/ 디렉토리에서
npm run dev       # 개발 서버 (nodemon, 파일 변경 자동 재시작)
npm start         # 프로덕션 서버
```

서버 기동 후 확인:

```bash
curl http://localhost:3000/health
# → { "status": "ok" }
```

Swagger UI 확인: `http://localhost:3000/api-docs`

### 1.3 환경 변수 기본값

| 변수 | 기본값 |
|------|--------|
| `SERVER_PORT` | `3000` |
| `CORS_ORIGIN` | `http://localhost:5173` |
| `JWT_EXPIRY` | `1h` |

---

## 2. Vite 프록시 설정

프론트엔드에서 `fetch('/api/...')` 형태로 호출하면 Vite 개발 서버가 백엔드(`localhost:3000`)로 프록시합니다.

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

> 프록시를 사용하면 CORS 이슈 없이 개발할 수 있습니다. 프로덕션에서는 `VITE_API_BASE_URL` 환경변수로 대체합니다.

---

## 3. 타입 정의

`frontend/src/types/` 에 아래 타입을 선언합니다.

```typescript
// types/auth.types.ts
export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'Bearer';
  user: User;
}

// types/category.types.ts
export interface Category {
  id: number;
  name: string;
  is_default: boolean;
  user_id: number | null;
}

// types/todo.types.ts
export interface Todo {
  id: number;
  user_id: number;
  category_id: number;
  title: string;
  description?: string;
  due_date?: string;            // "YYYY-MM-DD" 문자열. Date 객체 아님
  is_completed: boolean;
  created_at: string;           // ISO 8601
  updated_at: string;           // ISO 8601
}

export interface CreateTodoPayload {
  title: string;
  category_id: number;
  description?: string;
  due_date?: string;            // "YYYY-MM-DD" 형식만 허용
}

export interface UpdateTodoPayload {
  title: string;
  category_id: number;
  description?: string;
  due_date?: string;
}

export interface TodoFilters {
  category_id?: number;
  is_completed?: boolean;
  overdue?: boolean;
  due_date_from?: string;   // "YYYY-MM-DD" 클라이언트 사이드 범위 필터 시작일
  due_date_to?: string;     // "YYYY-MM-DD" 클라이언트 사이드 범위 필터 종료일
}

// types/api.types.ts
export interface ApiError {
  error: string;
  message: string;
}
```

> `due_date`는 백엔드에서 PostgreSQL `DATE` 타입을 `"YYYY-MM-DD"` 문자열로 반환합니다. JavaScript `Date` 객체로 변환하지 마세요 (타임존 오차 발생).

---

## 4. 인증 스토어 (Zustand)

```typescript
// stores/useAuthStore.ts
import { create } from 'zustand';
import type { User } from '../types/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;   // JWT — 메모리에만 저장 (localStorage 사용 금지)
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ user: null, token: null }),
}));
```

**보안 규칙**:
- `token`은 Zustand 메모리에만 저장합니다.
- `localStorage.setItem('token', ...)` 는 절대 사용하지 않습니다.
- 페이지 새로고침 시 토큰이 초기화되므로 사용자는 재로그인이 필요합니다.

---

## 5. API 클라이언트

### 5.1 공통 fetch 래퍼

```typescript
// api/client.ts
import { useAuthStore } from '../stores/useAuthStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...init } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = useAuthStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json();

  if (!res.ok) {
    const err = new Error(body.message ?? '서버 오류가 발생했습니다.');
    (err as any).status = res.status;
    (err as any).code = body.error;
    throw err;
  }

  return body as T;
}
```

### 5.2 인증 API

```typescript
// api/auth.api.ts
import { apiFetch } from './client';
import type { User, LoginResponse } from '../types/auth.types';

export async function register(payload: {
  email: string;
  password: string;
  name: string;
}): Promise<User> {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    requiresAuth: false,
  });
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    requiresAuth: false,
  });
}
```

### 5.3 카테고리 API

```typescript
// api/categories.api.ts
import { apiFetch } from './client';
import type { Category } from '../types/category.types';

export async function getCategories(): Promise<{ data: Category[] }> {
  return apiFetch('/api/categories');
}
```

### 5.4 할일 API

```typescript
// api/todos.api.ts
import { apiFetch } from './client';
import type { Todo, CreateTodoPayload, UpdateTodoPayload, TodoFilters } from '../types/todo.types';

export async function getTodos(
  filters?: TodoFilters
): Promise<{ data: Todo[] }> {
  const params = new URLSearchParams();
  if (filters?.category_id !== undefined) {
    params.set('category_id', String(filters.category_id));
  }
  if (filters?.is_completed !== undefined) {
    params.set('is_completed', String(filters.is_completed));
  }
  if (filters?.overdue) {
    params.set('overdue', 'true');
  }
  const qs = params.toString();
  return apiFetch(`/api/todos${qs ? `?${qs}` : ''}`);
}

export async function getTodoById(id: number): Promise<Todo> {
  return apiFetch(`/api/todos/${id}`);
}

export async function createTodo(payload: CreateTodoPayload): Promise<Todo> {
  return apiFetch('/api/todos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTodo(
  id: number,
  payload: UpdateTodoPayload
): Promise<Todo> {
  return apiFetch(`/api/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function toggleComplete(id: number): Promise<Todo> {
  return apiFetch(`/api/todos/${id}/complete`, { method: 'PATCH' });
}

export async function deleteTodo(id: number): Promise<void> {
  return apiFetch(`/api/todos/${id}`, { method: 'DELETE' });
}
```

---

## 6. TanStack Query 훅

### 6.1 QueryClient 설정

```typescript
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,   // 1분
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
```

### 6.2 카테고리 훅

```typescript
// features/categories/hooks/useCategories.ts
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../../../api/categories.api';
import { useAuthStore } from '../../../stores/useAuthStore';

export function useCategories() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: !!token,
    select: (res) => res.data,
  });
}
```

### 6.3 할일 훅

```typescript
// features/todos/hooks/useTodos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  toggleComplete,
  deleteTodo,
} from '../../../api/todos.api';
import type { TodoFilters, CreateTodoPayload, UpdateTodoPayload } from '../../../types/todo.types';
import { useNavigate } from 'react-router-dom';

export function useTodos(filters?: TodoFilters) {
  return useQuery({
    queryKey: ['todos', filters],
    queryFn: () => getTodos(filters),
    select: (res) => res.data,
  });
}

export function useTodoById(id: number) {
  return useQuery({
    queryKey: ['todos', id],
    queryFn: () => getTodoById(id),
    enabled: !!id,
  });
}

export function useTodoMutations() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const invalidateTodos = () =>
    queryClient.invalidateQueries({ queryKey: ['todos'] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateTodoPayload) => createTodo(payload),
    onSuccess: () => {
      invalidateTodos();
      navigate('/todos');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTodoPayload }) =>
      updateTodo(id, payload),
    onSuccess: () => {
      invalidateTodos();
      navigate('/todos');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleComplete(id),
    onSuccess: () => invalidateTodos(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTodo(id),
    onSuccess: () => {
      invalidateTodos();
      navigate('/todos');
    },
  });

  return { createMutation, updateMutation, toggleMutation, deleteMutation };
}
```

### 6.4 인증 훅

```typescript
// features/auth/hooks/useAuthMutation.ts
import { useMutation } from '@tanstack/react-query';
import { register, login } from '../../../api/auth.api';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

export function useRegisterMutation() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: register,
    onSuccess: () => navigate('/login'),
  });
}

export function useLoginMutation() {
  const { setToken, setUser } = useAuthStore();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setToken(data.access_token);
      setUser(data.user);
      navigate('/todos');
    },
  });
}
```

---

## 7. 라우팅 설계

```typescript
// router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import TodoListPage from '../pages/TodoListPage';
import TodoCreatePage from '../pages/TodoCreatePage';
import TodoEditPage from '../pages/TodoEditPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <Navigate to="/todos" replace /> : <>{children}</>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/todos" replace />} />
        <Route
          path="/login"
          element={<PublicRoute><LoginPage /></PublicRoute>}
        />
        <Route
          path="/register"
          element={<PublicRoute><RegisterPage /></PublicRoute>}
        />
        <Route
          path="/todos"
          element={<PrivateRoute><TodoListPage /></PrivateRoute>}
        />
        <Route
          path="/todos/create"
          element={<PrivateRoute><TodoCreatePage /></PrivateRoute>}
        />
        <Route
          path="/todos/:id/edit"
          element={<PrivateRoute><TodoEditPage /></PrivateRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 8. API 응답 형식 및 에러 처리

### 8.1 응답 형식 일람

| 엔드포인트 | 성공 시 응답 구조 |
|-----------|-----------------|
| `POST /api/auth/register` | `User` 객체 직접 |
| `POST /api/auth/login` | `{ access_token, token_type, user }` |
| `GET /api/categories` | `{ data: Category[] }` |
| `GET /api/todos` | `{ data: Todo[] }` |
| `POST /api/todos` | `Todo` 객체 직접 |
| `GET /api/todos/:id` | `Todo` 객체 직접 |
| `PUT /api/todos/:id` | `Todo` 객체 직접 |
| `PATCH /api/todos/:id/complete` | `Todo` 객체 직접 |
| `DELETE /api/todos/:id` | 응답 바디 없음 (`204 No Content`) |

### 8.2 에러 응답 형식

모든 에러는 아래 형식으로 반환됩니다:

```json
{
  "error": "에러코드",
  "message": "사람이 읽을 수 있는 메시지"
}
```

### 8.3 HTTP 상태 코드별 처리 방침

| 상태 코드 | 의미 | 프론트엔드 처리 |
|---------|------|----------------|
| `400` | 요청 형식 오류 (필수 필드 누락, 형식 오류) | `message`를 폼 에러로 표시 |
| `401` | 인증 실패 또는 토큰 만료 | `logout()` 호출 후 `/login`으로 리다이렉트 |
| `403` | 권한 없음 (타 사용자 리소스 접근) | 에러 메시지 표시, 목록으로 복귀 |
| `404` | 리소스 없음 | 에러 메시지 표시 또는 목록으로 리다이렉트 |
| `409` | 중복 충돌 (이메일 중복 가입) | `message`를 폼 에러로 표시 |
| `500` | 서버 내부 오류 | "서버 오류가 발생했습니다." 메시지 표시 |

### 8.4 401 자동 처리 예시

```typescript
// api/client.ts (apiFetch 내 에러 처리 강화)
if (res.status === 401) {
  useAuthStore.getState().logout();
  window.location.href = '/login';
  throw new Error('인증이 필요합니다.');
}
```

---

## 9. 주요 UI 구현 시 주의사항

### 9.1 기간 초과(Overdue) 판별

백엔드는 `overdue=true` 파라미터로 필터링을 처리합니다. UI에서 기간 초과 강조 표시를 할 때는 직접 판별합니다:

```typescript
// utils/date.utils.ts
export function isOverdue(dueDate: string | null, isCompleted: boolean): boolean {
  if (!dueDate || isCompleted) return false;
  // due_date는 "YYYY-MM-DD" 문자열이므로 타임존 없이 비교
  return dueDate < new Date().toISOString().slice(0, 10);
}
```

### 9.2 종료예정일 범위 필터 (클라이언트 사이드)

`TodoFilters`의 `due_date_from` / `due_date_to`는 백엔드에 쿼리 파라미터로 전달하지 않고 **클라이언트 사이드**에서 필터링합니다. 백엔드가 해당 파라미터를 지원하지 않기 때문입니다.

```typescript
// pages/TodoListPage.tsx — 클라이언트 사이드 날짜 범위 필터
const { data: rawTodos = [] } = useTodos(filters)    // due_date_from/to는 API로 미전송
const todos = rawTodos.filter((t) => {
  if (t.due_date) {
    if (filters.due_date_from && t.due_date < filters.due_date_from) return false
    if (filters.due_date_to && t.due_date > filters.due_date_to) return false
  }
  return true    // due_date 없는 할일은 필터 통과
})
```

**기본값:** 초기 로드 시 현재일 기준 −20일 ~ +20일로 자동 설정됩니다.

### 9.2b due_date 날짜 입력 처리

`<input type="date">` 의 `value`는 `"YYYY-MM-DD"` 형식입니다. 백엔드도 동일한 형식을 기대하므로 변환 없이 그대로 전달합니다.

```typescript
// ✓ Good
const payload = { title, category_id, due_date: dateInput || null };

// ✗ Bad - new Date() 변환 금지 (타임존 오차 발생)
const payload = { due_date: new Date(dateInput).toISOString() };
```

### 9.3 TodoCard 클릭 → 수정 화면 이동

`TodoCard`는 카드 전체가 클릭 가능하며(`cursor-pointer`), 클릭 시 `onEdit(id)` 콜백을 호출합니다. 체크박스 클릭은 이벤트 전파를 막아 토글만 실행됩니다.

```typescript
// features/todos/components/TodoCard.tsx
interface TodoCardProps {
  todo: Todo
  category?: Category
  onToggle: (id: number) => void
  onEdit: (id: number) => void    // 카드 클릭 시 호출 (수정 화면 이동)
}
```

```tsx
// pages/TodoListPage.tsx — onEdit 핸들러
<TodoCard
  todo={todo}
  category={categories.find((c) => c.id === todo.category_id)}
  onToggle={(id) => toggleMutation.mutate(id)}
  onEdit={(id) => navigate(`/todos/${id}/edit`)}
/>
```

### 9.5 완료 토글 응답

`PATCH /api/todos/:id/complete` 응답은 변경된 `is_completed` 값이 포함된 `Todo` 전체 객체를 반환합니다. 별도로 목록을 재요청하지 않아도 되지만, `invalidateQueries`를 통해 캐시를 갱신하는 것이 권장됩니다.

### 9.6 빈 목록 처리

`GET /api/todos` 는 할일이 없어도 `{ data: [] }`를 반환합니다 (404 아님). 빈 배열에 대해 빈 상태 UI를 표시하세요.

### 9.7 로그아웃 처리

```typescript
// 로그아웃 버튼 핸들러
function handleLogout() {
  useAuthStore.getState().logout();
  queryClient.clear();   // TanStack Query 캐시 전체 삭제
  navigate('/login');
}
```

---

## 10. 환경 변수

```env
# frontend/.env.example
VITE_API_BASE_URL=           # 프로덕션 배포 시만 설정. 개발 시는 Vite 프록시 사용
```

개발 환경에서는 `VITE_API_BASE_URL`을 비워두고 Vite 프록시만 사용합니다.

---

## 11. 전체 연동 체크리스트

### 인증 (FE-03)

- [x] `POST /api/auth/register` 호출 후 `201` 응답 수신, `/login`으로 이동
- [x] `POST /api/auth/login` 호출 후 `access_token`을 Zustand 메모리에만 저장
- [x] `localStorage`에 토큰을 저장하는 코드 없음
- [x] 로그인 성공 후 `/todos`로 이동
- [x] `401` 응답 시 `logout()` 호출 후 `/login`으로 이동
- [x] 페이지 새로고침 시 `/login`으로 리다이렉트됨 (토큰 메모리 초기화 확인)

### 할일 목록 (FE-04)

- [x] `GET /api/todos` 에 `Authorization: Bearer <token>` 헤더 포함
- [x] `category_id`, `is_completed`, `overdue` 필터 파라미터 정상 동작
- [x] 종료예정일 범위(`due_date_from` ~ `due_date_to`) 클라이언트 사이드 필터링 동작, 기본값 현재일 ±20일
- [x] 기간 초과 할일 빨간색 강조 표시
- [x] 빈 목록 시 빈 상태 메시지 표시
- [x] `PATCH /api/todos/:id/complete` 호출 후 목록 캐시 갱신
- [x] 할일 카드 클릭 시 `/todos/:id/edit`으로 이동 (체크박스 클릭은 이벤트 전파 차단)

### 할일 등록·수정 (FE-05)

- [x] `POST /api/todos` 에 `title`과 `category_id` 필수 전송
- [x] `due_date`는 `"YYYY-MM-DD"` 형식 문자열로 전송
- [x] `PUT /api/todos/:id` 에 `title`과 `category_id` 필수 전송
- [x] `DELETE /api/todos/:id` 후 `204` 확인, 목록 캐시 갱신
- [x] 수정 폼에 기존 할일 데이터 프리필됨
- [x] 삭제 버튼은 폼 하단 버튼 영역(삭제·취소·저장)에 위치, 클릭 시 확인 모달 표시

### 카테고리 (FE-04)

- [x] `GET /api/categories` 에 `Authorization` 헤더 포함
- [x] 기본 카테고리(업무·개인·쇼핑·기타)가 드롭다운 상단에 표시됨
- [x] `is_default: true` 카테고리는 삭제 UI 미노출

### 보안

- [x] 비인증 상태에서 `/todos` 접근 시 `/login`으로 리다이렉트
- [x] 인증된 상태에서 `/login`, `/register` 접근 시 `/todos`로 리다이렉트
- [x] 모든 보호 API 호출에 토큰 포함 여부 확인
- [x] `localStorage`에 토큰 없음 확인 (브라우저 개발자 도구)

---

## 변경 이력

| 버전 | 날짜 | 변경자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2026-05-14 | Backend Developer | 초기 작성 — 백엔드 BE-01~BE-07 완료 후 FE 연동 기준으로 작성 |
| 1.1 | 2026-05-14 | Frontend Developer | §3 TodoFilters에 `due_date_from`·`due_date_to` 추가, Todo 타입 nullable → optional 변경. §9 종료예정일 범위 클라이언트 사이드 필터링·TodoCard onEdit 섹션 추가. §11 체크리스트 완료 처리 및 항목 보완 |
