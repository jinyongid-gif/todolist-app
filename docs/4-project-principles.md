# TodoListApp 아키텍처 설계 원칙

## 문서 정보

| 항목 | 내용 |
|------|------|
| 버전 | 1.0 |
| 작성일 | 2026-05-13 |
| 작성자 | Architecture Engineer |
| 관련 문서 | [1-domain-definition.md](./1-domain-definition.md), [2-prd.md](./2-prd.md), [3-user-scenario.md](./3-user-scenario.md), [99-uc.md](./99-uc.md) |

---

## 1. 최상위 공통 원칙

모든 레이어·스택에 적용되는 근본 원칙입니다.

### 1.1 단일 책임 원칙 (SRP: Single Responsibility Principle)

**정의:** 각 모듈, 함수, 클래스는 변경의 이유가 정확히 하나여야 합니다.

**적용 예시:**

- **백엔드 컨트롤러:** HTTP 요청/응답 처리만 담당. 비즈니스 로직은 서비스 계층으로 위임
  ```typescript
  // ✓ Good: 컨트롤러는 요청 검증과 응답만 담당
  async createTodo(req: Request, res: Response) {
    const { title, category_id } = req.body;
    const userId = req.user.id;
    try {
      const todo = await todoService.create({ title, category_id, userId });
      res.status(201).json({ data: todo });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // ✗ Bad: 컨트롤러가 데이터베이스 접근과 비즈니스 로직 담당
  async createTodo(req: Request, res: Response) {
    const { title } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const todo = await pool.query('INSERT INTO todos ...', [title]);
    res.json({ data: todo });
  }
  ```

- **프론트엔드 컴포넌트:** UI 렌더링만 담당. API 호출은 커스텀 훅으로 위임
  ```typescript
  // ✓ Good: TodoCard는 UI만 관심
  function TodoCard({ todo, onComplete, onEdit }) {
    return (
      <div>
        <h3>{todo.title}</h3>
        <button onClick={onComplete}>완료</button>
        <button onClick={onEdit}>수정</button>
      </div>
    );
  }

  // ✗ Bad: TodoCard가 API 호출 담당
  function TodoCard({ todoId }) {
    const [todo, setTodo] = useState(null);
    useEffect(() => {
      fetch(`/api/todos/${todoId}`)
        .then(r => r.json())
        .then(setTodo);
    }, [todoId]);
    // ...
  }
  ```

---

### 1.2 관심사 분리 (SoC: Separation of Concerns)

**정의:** 서로 다른 관심사를 물리적으로 분리하여 독립적으로 관리합니다.

**적용 예시:**

- **백엔드:** DB 계층, 서비스 계층, 라우팅 계층을 분리하여 각각 DB, 비즈니스로직, HTTP처리만 담당
- **프론트엔드:** 
  - TanStack Query: 서버 상태 (백엔드 동기화)
  - Zustand: 클라이언트 상태 (UI 전역 상태, 예: 로그인 사용자)
  - 컴포넌트: UI 렌더링

```typescript
// 프론트엔드 분리 예시
// 1. API 호출 (서버 상태) - useTodos.ts
export function useTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: () => fetchTodos()
  });
}

// 2. 전역 상태 (클라이언트 상태) - useAuthStore.ts
export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user })
}));

// 3. 컴포넌트 (UI) - TodoPage.tsx
export function TodoPage() {
  const { data: todos } = useTodos();
  const { user } = useAuthStore();
  return <div>...</div>;
}
```

---

### 1.3 DRY (Don't Repeat Yourself)

**정의:** 같은 로직을 반복하지 않습니다. 반복되는 패턴은 함수·컴포넌트·훅으로 추상화합니다.

**적용 예시:**

```typescript
// ✗ Bad: 유효성 검사를 여러 곳에서 반복
async createTodo(req, res) {
  if (!req.body.title || req.body.title.trim() === '') {
    return res.status(400).json({ message: "제목 필수" });
  }
  if (!req.body.category_id) {
    return res.status(400).json({ message: "카테고리 필수" });
  }
  // ...
}

async updateTodo(req, res) {
  if (!req.body.title || req.body.title.trim() === '') {
    return res.status(400).json({ message: "제목 필수" });
  }
  if (!req.body.category_id) {
    return res.status(400).json({ message: "카테고리 필수" });
  }
  // ...
}

// ✓ Good: 검증 로직 추출
function validateTodoInput(data) {
  if (!data.title || data.title.trim() === '') {
    throw new Error("제목 필수");
  }
  if (!data.category_id) {
    throw new Error("카테고리 필수");
  }
}

async createTodo(req, res) {
  try {
    validateTodoInput(req.body);
    const todo = await todoService.create(req.body);
    res.status(201).json({ data: todo });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async updateTodo(req, res) {
  try {
    validateTodoInput(req.body);
    const todo = await todoService.update(req.params.id, req.body);
    res.json({ data: todo });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
```

---

### 1.4 명시적 의존성 (Explicit Dependencies)

**정의:** 모듈이 필요한 의존성을 명시적으로 선언합니다. 숨겨진 전역 상태나 암묵적 의존성은 피합니다.

**적용 예시:**

```typescript
// ✗ Bad: 숨겨진 전역 의존성
let dbConnection; // 전역
const todoService = {
  async create(data) {
    const result = await dbConnection.query(...); // dbConnection은 어디서 오는가?
    return result;
  }
};

// ✓ Good: 의존성을 명시적으로 주입
class TodoService {
  constructor(private db: Database) {}
  
  async create(data: CreateTodoDto) {
    const result = await this.db.query(...);
    return result;
  }
}

// 사용처에서 명시적으로 주입
const db = new Database(config);
const todoService = new TodoService(db);
```

---

### 1.5 실패 우선 반환 (Fail Fast / Early Return)

**정의:** 조건을 만족하지 않으면 즉시 반환하여 중첩을 최소화합니다.

**적용 예시:**

```typescript
// ✗ Bad: 깊은 중첩 구조
async updateTodo(req, res) {
  if (req.user) {
    const todo = await todoService.getTodo(req.params.id);
    if (todo) {
      if (todo.user_id === req.user.id) {
        const updated = await todoService.update(req.params.id, req.body);
        res.json({ data: updated });
      } else {
        res.status(403).json({ message: "권한 없음" });
      }
    } else {
      res.status(404).json({ message: "할일 없음" });
    }
  } else {
    res.status(401).json({ message: "인증 필요" });
  }
}

// ✓ Good: Early return으로 깊이 최소화
async updateTodo(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: "인증 필요" });
  }

  const todo = await todoService.getTodo(req.params.id);
  if (!todo) {
    return res.status(404).json({ message: "할일 없음" });
  }

  if (todo.user_id !== req.user.id) {
    return res.status(403).json({ message: "권한 없음" });
  }

  const updated = await todoService.update(req.params.id, req.body);
  res.json({ data: updated });
}
```

---

### 1.6 불변성 선호 (Prefer Immutability)

**정의:** 데이터를 생성한 후 수정하지 않습니다. 새 객체를 반환합니다.

**적용 예시:**

```typescript
// ✗ Bad: 기존 객체 수정
function addTodoToList(todos: Todo[], newTodo: Todo) {
  todos.push(newTodo); // 원본 배열 변경
  return todos;
}

// ✓ Good: 새 배열 반환
function addTodoToList(todos: Todo[], newTodo: Todo) {
  return [...todos, newTodo]; // 새 배열 생성
}

// 프론트엔드 (Zustand 상태 관리)
// ✗ Bad: 상태 직접 수정
const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => {
    // ...
    user.name = "changed"; // 직접 수정
    set({ user });
  }
}));

// ✓ Good: 새 객체로 교체
const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user: { ...user } }) // 새 객체 생성
}));
```

---

### 1.7 보안 기본값 (Secure by Default)

**정의:** 모든 리소스는 기본적으로 보호되어 있으며, 명시적으로 허용할 때만 접근 가능합니다.

**적용 예시:**

```typescript
// ✗ Bad: 기본적으로 모두 접근 가능
app.get('/api/todos/:id', (req, res) => {
  const todo = await getTodo(req.params.id);
  res.json(todo);
});

// ✓ Good: JWT 검증 필수, 그 다음 소유권 확인
app.get(
  '/api/todos/:id',
  authenticate, // JWT 검증 (명시적)
  async (req, res) => {
    const todo = await getTodo(req.params.id);
    if (todo.user_id !== req.user.id) { // 소유권 확인 (명시적)
      return res.status(403).json({ message: "접근 불가" });
    }
    res.json(todo);
  }
);

// 환경 변수도 보안 기본값 적용
// .env에는 민감한 정보 저장
// .env.example에는 키만 노출 (값 없음)
```

---

## 2. 의존성 / 레이어 원칙

### 2.1 백엔드 레이어 구조

```
Route → Controller → Service → Repository → DB
```

#### 2.1.1 각 레이어의 역할과 책임

| 레이어 | 역할 | 책임 | 예외 처리 |
|-------|------|------|----------|
| **Route** | HTTP 엔드포인트 정의 | 요청 경로 매핑, 미들웨어 연결 | 라우팅 404 |
| **Controller** | 요청/응답 처리 | HTTP 메서드 실행, 입력 검증, 응답 포맷 | 비즈니스 로직 예외 catch |
| **Service** | 비즈니스 로직 | 도메인 규칙 구현, 트랜잭션, 의사결정 | 도메인 예외 throw |
| **Repository** | 데이터 접근 | SQL 쿼리 실행, 파라미터화 쿼리 | DB 예외 throw |
| **DB** | 데이터 저장소 | 데이터 영속성 | DB 제약 위반 |

#### 2.1.2 레이어 간 의존성 방향 규칙

```
상위 계층 → 하위 계층 (일방향)

Controller ↓ (의존)
  ↓
Service ↓ (의존)
  ↓
Repository ↓ (의존)
  ↓
DB
```

**규칙:**
- 상위 계층에서 하위 계층으로만 의존성을 가집니다
- 하위 계층에서 상위 계층을 호출하면 안 됩니다
- 같은 계층끼리의 의존성은 최소화합니다

**위반 예시:**
```typescript
// ✗ Bad: Repository가 Controller에 의존 (순환 의존성)
class TodoRepository {
  constructor(private controller: TodoController) {}
  async create(data) {
    this.controller.validateInput(data); // 순환 의존성!
  }
}

// ✓ Good: Repository는 독립적, Controller에서 검증 후 호출
class TodoRepository {
  async create(data: CreateTodoDto) {
    // DB 쿼리만 실행
    return await this.db.query(...);
  }
}

class TodoController {
  async create(req, res) {
    // Controller에서 검증
    validateTodoInput(req.body);
    // Repository 호출
    const todo = await this.repository.create(req.body);
    res.json({ data: todo });
  }
}
```

#### 2.1.3 레이어 간 데이터 전달 형식

- **Route ↔ Controller:** 원본 HTTP 요청/응답 객체
- **Controller ↔ Service:** DTO (Data Transfer Object) 또는 Plain Object
- **Service ↔ Repository:** DTO 또는 Plain Object
- **Repository ↔ DB:** SQL 파라미터

```typescript
// 예시: DTO 정의
interface CreateTodoDto {
  title: string;
  description?: string;
  due_date?: string;
  category_id: number;
  user_id: number; // Controller에서 JWT로부터 주입
}

// Controller
async create(req: Request, res: Response) {
  const dto: CreateTodoDto = {
    title: req.body.title,
    category_id: req.body.category_id,
    user_id: req.user.id, // JWT로부터
    description: req.body.description,
    due_date: req.body.due_date
  };
  const todo = await this.todoService.create(dto);
  res.json({ data: todo });
}

// Service
async create(dto: CreateTodoDto) {
  // 비즈니스 로직: 카테고리 유효성 확인
  const category = await this.categoryRepository.getById(dto.category_id);
  if (!category || (category.user_id !== dto.user_id && !category.is_default)) {
    throw new Error("유효하지 않은 카테고리");
  }
  
  // Repository 호출
  return await this.todoRepository.create(dto);
}

// Repository
async create(data: CreateTodoDto) {
  const query = `
    INSERT INTO todos (user_id, category_id, title, description, due_date, is_completed, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, FALSE, NOW(), NOW())
    RETURNING *
  `;
  const result = await this.db.query(query, [
    data.user_id,
    data.category_id,
    data.title,
    data.description || null,
    data.due_date || null
  ]);
  return result.rows[0];
}
```

#### 2.1.4 순환 의존성 금지

```typescript
// ✗ Bad: Service A가 Service B에, Service B가 Service A에 의존
class TodoService {
  constructor(private categoryService: CategoryService) {}
  async create(dto) {
    await this.categoryService.validate(dto.category_id); // 순환!
  }
}

class CategoryService {
  constructor(private todoService: TodoService) {}
  async delete(categoryId) {
    const todos = await this.todoService.getTodosByCategory(categoryId);
  }
}

// ✓ Good: 서로 다른 레포지토리로 접근하거나 공통 유틸로 추상화
class TodoService {
  constructor(
    private todoRepository: TodoRepository,
    private categoryRepository: CategoryRepository
  ) {}
  async create(dto) {
    const category = await this.categoryRepository.getById(dto.category_id);
    if (!category) throw new Error("유효하지 않은 카테고리");
    return await this.todoRepository.create(dto);
  }
}

class CategoryService {
  constructor(
    private categoryRepository: CategoryRepository,
    private todoRepository: TodoRepository
  ) {}
  async delete(categoryId) {
    // 삭제 전 할일 확인 (순환 없음, 직접 리포지토리 접근)
    const todos = await this.todoRepository.findByCategory(categoryId);
    if (todos.length > 0) throw new Error("할일이 있으면 삭제 불가");
    return await this.categoryRepository.delete(categoryId);
  }
}
```

---

### 2.2 프론트엔드 레이어 구조

```
Page → Component → Hook → API Client → Server
```

#### 2.2.1 각 레이어의 역할

| 레이어 | 역할 | 책임 | 예시 |
|-------|------|------|------|
| **Page** | 라우트 진입점 | 페이지 레이아웃, 다중 컴포넌트 조합 | `TodoListPage.tsx` |
| **Component** | 재사용 UI 단위 | 순수 렌더링, Props 기반 동작 | `TodoCard.tsx`, `Button.tsx` |
| **Hook** | 상태/로직 추상화 | 상태 관리, API 호출, 사이드 이펙트 | `useTodos.ts`, `useAuthMutation.ts` |
| **API Client** | HTTP 통신 | fetch 호출, TanStack Query 또는 Zustand 활용 | `todosApi.ts`, `authApi.ts` |
| **Server** | 백엔드 | REST API 제공 | POST /api/todos |

#### 2.2.2 TanStack Query vs Zustand 역할 분리

**TanStack Query (서버 상태):**
- 목적: 서버와의 데이터 동기화
- 사용: API 응답 캐싱, 자동 재요청, 백그라운드 재검증
- 예시: `todos` 목록, `currentUser` 프로필

```typescript
// ✓ Good: TanStack Query로 서버 상태 관리
export function useTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    staleTime: 5 * 60 * 1000 // 5분 후 stale
  });
}

export function useTodoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });
}
```

**Zustand (클라이언트 상태):**
- 목적: UI 전역 상태 관리 (서버와 무관)
- 사용: 로그인 사용자 정보, 테마, 모달 열기/닫기
- 예시: `isLoggedIn`, `currentUser`, `isDarkMode`

```typescript
// ✓ Good: Zustand로 클라이언트 상태 관리
export const useAuthStore = create((set) => ({
  user: null as User | null,
  isLoading: false,
  setUser: (user: User | null) => set({ user }),
  setLoading: (loading: boolean) => set({ isLoading: loading })
}));

// 컴포넌트에서 사용
function Header() {
  const { user } = useAuthStore();
  return <div>{user?.name}</div>;
}
```

#### 2.2.3 컴포넌트에서 직접 fetch 금지

```typescript
// ✗ Bad: 컴포넌트에서 직접 fetch
function TodoList() {
  const [todos, setTodos] = useState([]);
  
  useEffect(() => {
    fetch('/api/todos')
      .then(r => r.json())
      .then(setTodos);
  }, []);
  
  return <div>{todos.map(t => <div key={t.id}>{t.title}</div>)}</div>;
}

// ✓ Good: 훅으로 추상화
function TodoList() {
  const { data: todos } = useTodos(); // 훅이 데이터 관리
  return <div>{todos?.map(t => <div key={t.id}>{t.title}</div>)}</div>;
}

// useTodos.ts
export function useTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/todos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });
}
```

---

## 3. 코드 / 네이밍 원칙

### 3.1 공통 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| **파일명** | kebab-case | `todo-form.tsx`, `auth.middleware.ts` |
| **상수** | UPPER_SNAKE_CASE | `MAX_TITLE_LENGTH = 255` |
| **변수/함수** | camelCase | `getUserTodos()`, `isCompleted` |
| **클래스/인터페이스/타입** | PascalCase | `TodoService`, `CreateTodoDto` |
| **Boolean 변수** | is/has/can 접두사 | `isCompleted`, `hasError`, `canDelete` |

### 3.2 백엔드 네이밍 규칙

| 파일 타입 | 규칙 | 예시 |
|----------|------|------|
| **라우터** | `{resource}.router.ts` | `todos.router.ts` |
| **컨트롤러** | `{resource}.controller.ts` | `todos.controller.ts` |
| **서비스** | `{resource}.service.ts` | `todos.service.ts` |
| **레포지토리** | `{resource}.repository.ts` | `todos.repository.ts` |
| **미들웨어** | `{name}.middleware.ts` | `auth.middleware.ts`, `error.middleware.ts` |

#### 3.2.1 HTTP 메서드별 함수명 규칙

| HTTP 메서드 | 함수명 규칙 | 예시 |
|-----------|-----------|------|
| **GET** | `get{Entity}`, `get{Entity}ById` | `getTodos()`, `getTodoById()` |
| **POST** | `create{Entity}` | `createTodo()` |
| **PUT/PATCH** | `update{Entity}` | `updateTodo()` |
| **DELETE** | `delete{Entity}` | `deleteTodo()` |
| **PATCH /complete** | `toggle{Entity}` 또는 `complete{Entity}` | `completeTodo()` |

```typescript
// Repository 예시
class TodoRepository {
  async getTodos(userId: number) { /* ... */ }
  async getTodoById(id: number) { /* ... */ }
  async createTodo(data: CreateTodoDto) { /* ... */ }
  async updateTodo(id: number, data: UpdateTodoDto) { /* ... */ }
  async deleteTodo(id: number) { /* ... */ }
  async completeTodo(id: number) { /* ... */ }
}

// Service 예시
class TodoService {
  async getTodos(userId: number, filters?: Filters) { /* ... */ }
  async getTodoById(id: number, userId: number) { /* ... */ }
  async createTodo(dto: CreateTodoDto) { /* ... */ }
  async updateTodo(id: number, dto: UpdateTodoDto, userId: number) { /* ... */ }
  async deleteTodo(id: number, userId: number) { /* ... */ }
  async completeTodo(id: number, userId: number) { /* ... */ }
}

// Controller 예시
class TodoController {
  async getTodos(req: Request, res: Response) {
    const todos = await this.todoService.getTodos(req.user.id, req.query);
    res.json({ data: todos });
  }

  async createTodo(req: Request, res: Response) {
    const todo = await this.todoService.createTodo({ ...req.body, userId: req.user.id });
    res.status(201).json({ data: todo });
  }

  async updateTodo(req: Request, res: Response) {
    const todo = await this.todoService.updateTodo(req.params.id, req.body, req.user.id);
    res.json({ data: todo });
  }

  async completeTodo(req: Request, res: Response) {
    const todo = await this.todoService.completeTodo(req.params.id, req.user.id);
    res.json({ data: todo });
  }
}
```

### 3.3 프론트엔드 네이밍 규칙

| 파일 타입 | 규칙 | 예시 |
|----------|------|------|
| **컴포넌트** | PascalCase `.tsx` | `TodoCard.tsx`, `Button.tsx` |
| **커스텀 훅** | `use{Name}.ts` | `useTodos.ts`, `useAuthMutation.ts` |
| **API 함수** | `{resource}Api.ts` 또는 `{resource}Client.ts` | `todosApi.ts`, `authApi.ts` |
| **Zustand 스토어** | `use{Name}Store.ts` | `useAuthStore.ts` |
| **페이지 컴포넌트** | `{Name}Page.tsx` | `TodoListPage.tsx`, `LoginPage.tsx` |

```typescript
// API 파일 (todosApi.ts)
export async function fetchTodos(filters?: Filters) {
  const res = await fetch('/api/todos?...');
  return res.json();
}

export async function createTodo(data: CreateTodoDto) {
  const res = await fetch('/api/todos', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
}

// 커스텀 훅 (useTodos.ts)
export function useTodos(filters?: Filters) {
  return useQuery({
    queryKey: ['todos', filters],
    queryFn: () => fetchTodos(filters)
  });
}

export function useTodoMutation() {
  return useMutation({
    mutationFn: createTodo,
    onSuccess: (data) => {
      // 백그라운드 재검증
    }
  });
}

// 컴포넌트 (TodoCard.tsx)
export function TodoCard({ todo, onComplete, onEdit }) {
  return (
    <div>
      <h3>{todo.title}</h3>
    </div>
  );
}

// 페이지 (TodoListPage.tsx)
export default function TodoListPage() {
  const { data: todos } = useTodos();
  return <div>{todos?.map(t => <TodoCard key={t.id} todo={t} />)}</div>;
}
```

### 3.4 함수 크기 제한

**원칙:** 단일 함수는 50줄 이내 권장, 100줄 초과 금지

**이유:** 함수가 작을수록 테스트·수정·이해가 쉽습니다.

```typescript
// ✗ Bad: 150줄 이상의 거대 함수
async function processTodo(req, res) {
  // 인증 확인
  // 할일 조회
  // 권한 확인
  // 카테고리 유효성 확인
  // 상태 업데이트
  // 응답 생성
  // ... 150줄 이상
}

// ✓ Good: 작은 함수로 분리 (각 30줄 이하)
async function processTodo(req, res) {
  try {
    const userId = authenticateUser(req);
    const todo = await todoService.getTodoById(req.params.id);
    validateOwnership(todo, userId);
    const updated = await todoService.updateTodo(req.params.id, req.body, userId);
    res.json({ data: updated });
  } catch (error) {
    handleError(res, error);
  }
}

function authenticateUser(req) {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

function validateOwnership(todo, userId) {
  if (todo.user_id !== userId) throw new ForbiddenError();
}

function handleError(res, error) {
  const status = error instanceof ForbiddenError ? 403 : 400;
  res.status(status).json({ message: error.message });
}
```

---

## 4. 테스트 / 품질 원칙

### 4.1 테스트 작성 대상 및 우선순위

| 우선순위 | 레이어 | 이유 | 커버리지 목표 |
|---------|--------|------|-------------|
| **1순위** | Service | 핵심 비즈니스 로직 | 80% 이상 |
| **2순위** | Repository | 데이터 접근 로직 | 70% 이상 |
| **3순위** | Controller | HTTP 처리 | 60% 이상 |
| **4순위** | Component | UI 렌더링 | 40% 이상 |

### 4.2 단위 테스트 vs 통합 테스트 범위 정의

**단위 테스트 (Unit Test):**
- 대상: Service, 유틸리티 함수
- 범위: 의존성 mock 처리, 함수 하나만 테스트
- 예: TodoService.createTodo()의 유효성 검사, 카테고리 확인

```typescript
describe('TodoService', () => {
  let service: TodoService;
  let categoryRepo: jest.Mocked<CategoryRepository>;
  
  beforeEach(() => {
    categoryRepo = {
      getById: jest.fn()
    } as any;
    service = new TodoService(categoryRepo);
  });

  it('should throw when category does not exist', async () => {
    categoryRepo.getById.mockResolvedValue(null);
    
    await expect(
      service.createTodo({ category_id: 1, title: 'test' })
    ).rejects.toThrow('유효하지 않은 카테고리');
  });
});
```

**통합 테스트 (Integration Test):**
- 대상: Repository (실제 DB), Controller (실제 서비스)
- 범위: 전체 흐름 테스트, 실제 DB 사용
- 예: POST /api/todos → 할일 생성 → GET /api/todos → 목록에 표시

```typescript
describe('TodoController E2E', () => {
  let app: Express;
  let db: Pool;

  beforeEach(async () => {
    db = new Pool(testDbConfig);
    await setupDatabase(db); // 테스트 DB 초기화
    app = createApp(db);
  });

  it('should create and retrieve todo', async () => {
    const createRes = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test', category_id: 1 });
    
    expect(createRes.status).toBe(201);
    
    const listRes = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`);
    
    expect(listRes.body.data).toContainEqual(
      expect.objectContaining({ title: 'Test' })
    );
  });
});
```

### 4.3 백엔드 Repository 테스트 규칙

**원칙:** Repository 테스트는 실제 데이터베이스 사용 (mock 금지)

**이유:** 
- SQL 쿼리가 실제로 동작하는지 확인 필수
- 파라미터화 쿼리, 트랜잭션 테스트 가능
- DB 제약 조건 검증

```typescript
// ✗ Bad: Repository를 mock 처리 (의미 없음)
describe('TodoRepository', () => {
  it('should create todo', () => {
    const mockDb = { query: jest.fn() };
    const repo = new TodoRepository(mockDb);
    
    // 실제 동작을 검증하지 못함
  });
});

// ✓ Good: 실제 DB 사용
describe('TodoRepository Integration', () => {
  let db: Pool;
  let repo: TodoRepository;

  beforeEach(async () => {
    db = new Pool(testDbConfig);
    await setupTestDatabase(db);
    repo = new TodoRepository(db);
  });

  it('should create todo with all fields', async () => {
    const result = await repo.createTodo({
      user_id: 1,
      category_id: 1,
      title: 'Test',
      description: 'Desc',
      due_date: '2026-05-20'
    });

    expect(result.id).toBeDefined();
    expect(result.title).toBe('Test');
    
    // 실제 DB에서 조회 확인
    const check = await db.query('SELECT * FROM todos WHERE id = $1', [result.id]);
    expect(check.rows[0].title).toBe('Test');
  });
});
```

### 4.4 테스트 파일 위치 및 네이밍

```
src/
├── modules/
│   ├── todos/
│   │   ├── todos.service.ts
│   │   ├── todos.service.test.ts      ← 같은 디렉토리, .test.ts 접미사
│   │   ├── todos.repository.ts
│   │   └── todos.repository.test.ts
│   └── auth/
│       ├── auth.service.ts
│       └── auth.service.test.ts
└── utils/
    ├── jwt.utils.ts
    └── jwt.utils.test.ts

tests/
├── integration/
│   ├── todos.e2e.test.ts
│   └── auth.e2e.test.ts
└── fixtures/
    └── testDatabase.ts
```

### 4.5 테스트 함수명 규칙

**규칙:** `should {expected behavior} when {condition}`

```typescript
describe('TodoService', () => {
  describe('createTodo', () => {
    it('should create todo with all fields when valid input', async () => {
      // ...
    });

    it('should throw error when title is empty', async () => {
      // ...
    });

    it('should throw error when category does not exist', async () => {
      // ...
    });

    it('should set is_completed to false when creating', async () => {
      // ...
    });
  });

  describe('updateTodo', () => {
    it('should update title when provided', async () => {
      // ...
    });

    it('should throw error when user does not own todo', async () => {
      // ...
    });

    it('should throw error when todo does not exist', async () => {
      // ...
    });
  });
});
```

### 4.6 TypeScript strict mode 필수

`tsconfig.json`에서 `"strict": true` 설정 필수:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**효과:**
- 타입 안정성 향상
- 런타임 에러 감소
- IDE 자동완성 개선

### 4.7 ESLint 규칙 준수 및 CI 검증

**원칙:** ESLint 규칙 위반 시 머지 차단

**설정 예시:**
```json
{
  "eslint": {
    "rules": {
      "no-console": ["error"],
      "no-any": ["warn"],
      "prefer-const": ["error"],
      "no-var": ["error"],
      "eqeqeq": ["error"]
    }
  }
}
```

**GitHub Actions 또는 CI/CD에서:**
```yaml
- name: Lint
  run: npm run lint
  
- name: Exit if lint fails
  if: failure()
  run: exit 1
```

---

## 5. 설정 / 보안 / 운영 원칙

### 5.1 설정 관리

**원칙:** 모든 환경 변수는 `.env` 파일로 관리, 코드 내 하드코딩 금지

**파일 구조:**

```
backend/
├── .env              ← 실제 값 (로컬 개발 환경)
├── .env.example      ← 템플릿 (값 없음, 리포지토리에 커밋)
└── src/
    └── config/
        ├── db.ts     ← DB 인스턴스 생성
        └── env.ts    ← 환경 변수 파싱 및 검증

frontend/
├── .env              ← 실제 값 (로컬 개발 환경)
├── .env.example      ← 템플릿
└── src/
    └── config/
        └── api.ts    ← API 엔드포인트
```

**.env.example 예시:**

```env
# Database
DATABASE_URL=
POSTGRES_USER=
POSTGRES_PASSWORD=

# JWT
JWT_SECRET=
JWT_EXPIRY=1h

# Server
SERVER_PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=
```

**.env (실제 파일, 리포지토리에 커밋 금지):**

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/todolist
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mypassword

JWT_SECRET=super-secret-key-12345
JWT_EXPIRY=24h

SERVER_PORT=3000
NODE_ENV=development

CORS_ORIGIN=http://localhost:5173
```

**코드에서 로드:**

```typescript
// ✗ Bad: 하드코딩
const dbUrl = "postgresql://user:pass@localhost:5432/todolist";
const jwtSecret = "super-secret-key";

// ✓ Good: 환경 변수
const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;

if (!dbUrl || !jwtSecret) {
  throw new Error("필수 환경 변수 누락: DATABASE_URL, JWT_SECRET");
}
```

### 5.2 보안 원칙

#### 5.2.1 SQL Injection 방지 (파라미터화 쿼리 필수)

```typescript
// ✗ Bad: 문자열 결합 (SQL Injection 위험)
const query = `SELECT * FROM users WHERE email = '${req.body.email}'`;
const result = await db.query(query);

// ✓ Good: 파라미터화 쿼리
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(query, [req.body.email]);

// Repository에서도 파라미터화 쿼리 필수
class UserRepository {
  async getByEmail(email: string) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.db.query(query, [email]);
    return result.rows[0];
  }

  async create(data: CreateUserDto) {
    const query = `
      INSERT INTO users (email, password, name, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const result = await this.db.query(query, [
      data.email,
      data.password, // bcrypt 해시된 값
      data.name
    ]);
    return result.rows[0];
  }
}
```

#### 5.2.2 JWT 검증 미들웨어 필수 적용

```typescript
// ✗ Bad: 보호 필요한 라우트에 미들웨어 미적용
app.get('/api/todos', (req, res) => {
  // JWT 검증 없음!
  const todos = await getTodos(req.user.id);
  res.json(todos);
});

// ✓ Good: 보호 라우트에 authenticate 미들웨어 필수
app.get('/api/todos', authenticate, (req, res) => {
  const todos = await getTodos(req.user.id);
  res.json(todos);
});

// authenticate 미들웨어
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "인증이 필요합니다" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as JwtPayload;
    next();
  } catch (error) {
    res.status(401).json({ message: "유효하지 않은 토큰입니다" });
  }
}
```

#### 5.2.3 bcrypt 해시 라운드 (최소 10 이상)

```typescript
import bcrypt from 'bcrypt';

// ✗ Bad: 라운드 수 부족
const hash = await bcrypt.hash(password, 5); // 너무 약함

// ✓ Good: 라운드 수 10 이상
const SALT_ROUNDS = 10; // 또는 그 이상
const hash = await bcrypt.hash(password, SALT_ROUNDS);

// 로그인 시 검증
async login(email: string, password: string) {
  const user = await this.userRepository.getByEmail(email);
  if (!user) throw new Error("이메일 또는 비밀번호 오류");
  
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error("이메일 또는 비밀번호 오류");
  
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET!
  );
  return token;
}
```

#### 5.2.4 사용자 입력 검증 (컨트롤러 진입점에서 즉시)

```typescript
// ✓ Good: 컨트롤러에서 즉시 검증
async createTodo(req: Request, res: Response) {
  // 1. 입력 유효성 검사
  if (!req.body.title || typeof req.body.title !== 'string') {
    return res.status(400).json({ message: "제목 필수" });
  }
  
  if (req.body.title.trim().length === 0) {
    return res.status(400).json({ message: "제목 공란 불가" });
  }

  if (req.body.title.length > 255) {
    return res.status(400).json({ message: "제목은 255자 이내" });
  }

  if (!Number.isInteger(req.body.category_id)) {
    return res.status(400).json({ message: "유효한 카테고리 선택" });
  }

  // 2. 비즈니스 로직 실행
  try {
    const todo = await this.todoService.createTodo({
      title: req.body.title.trim(),
      category_id: req.body.category_id,
      user_id: req.user.id,
      description: req.body.description,
      due_date: req.body.due_date
    });
    res.status(201).json({ data: todo });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
```

#### 5.2.5 에러 응답에 스택 트레이스 노출 금지

```typescript
// ✗ Bad: 프로덕션에서 스택 트레이스 노출
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    message: err.message,
    stack: err.stack // 위험!
  });
});

// ✓ Good: 환경에 따른 처리
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err); // 서버 로그에만 기록
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    message: "서버 오류가 발생했습니다",
    ...(isDevelopment && { stack: err.stack }) // 개발환경에만 포함
  });
});
```

#### 5.2.6 CORS 허용 오리진 환경 변수로 관리

```typescript
// ✗ Bad: 하드코딩된 CORS 설정
app.use(cors({ origin: '*' })); // 모든 오리진 허용 (위험)

// ✓ Good: 환경 변수로 관리
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

// .env
CORS_ORIGIN=http://localhost:5173

// .env.production
CORS_ORIGIN=https://www.mytodoapp.com
```

### 5.3 운영 원칙

#### 5.3.1 모든 API 요청/응답 로깅

```typescript
import morgan from 'morgan';
import winston from 'winston';

// HTTP 요청 로깅
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    }
  }
}));

// 또는 커스텀 미들웨어
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      method: req.method,
      url: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });
  });
  
  next();
});
```

#### 5.3.2 에러 로그에 userId, endpoint, timestamp 포함

```typescript
// ✓ Good: 구조화된 에러 로깅
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    userId: req.user?.id,
    endpoint: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };
  
  logger.error(errorLog);
  
  res.status(500).json({
    message: "서버 오류가 발생했습니다",
    errorId: errorLog.timestamp // 추후 추적용
  });
});
```

#### 5.3.3 DB 연결 Pool 사용

```typescript
// ✓ Good: pg.Pool 사용
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000, // 유휴 타임아웃
  connectionTimeoutMillis: 2000 // 연결 타임아웃
});

// 연결 상태 모니터링
pool.on('error', (err) => {
  logger.error('DB 연결 풀 에러:', err);
});

export default pool;
```

---

## 6. 프론트엔드 디렉토리 구조

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/                      # TanStack Query hooks + API 함수
│   │   ├── auth.api.ts           # 인증 API
│   │   ├── todos.api.ts          # 할일 API
│   │   └── categories.api.ts     # 카테고리 API
│   │
│   ├── components/               # 재사용 UI 컴포넌트 (도메인 무관)
│   │   ├── common/               # 공통 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Select.tsx
│   │   └── layout/               # 레이아웃 컴포넌트
│   │       ├── AppLayout.tsx
│   │       └── Header.tsx
│   │
│   ├── features/                 # 도메인별 기능 단위 (컴포넌트 + 훅)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   └── hooks/
│   │   │       └── useAuthMutation.ts
│   │   │
│   │   ├── todos/
│   │   │   ├── components/
│   │   │   │   ├── TodoCard.tsx
│   │   │   │   ├── TodoForm.tsx
│   │   │   │   └── TodoFilter.tsx
│   │   │   └── hooks/
│   │   │       ├── useTodos.ts         # TanStack Query hook
│   │   │       └── useTodoMutations.ts # useMutation hooks
│   │   │
│   │   └── categories/
│   │       └── hooks/
│   │           └── useCategories.ts
│   │
│   ├── pages/                    # 라우트 진입점 (페이지 컴포넌트)
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── TodoListPage.tsx
│   │   ├── TodoCreatePage.tsx
│   │   └── TodoEditPage.tsx
│   │
│   ├── stores/                   # Zustand 전역 상태
│   │   └── useAuthStore.ts       # 로그인 사용자 정보
│   │
│   ├── types/                    # TypeScript 타입 정의 (공유)
│   │   ├── auth.types.ts
│   │   ├── todo.types.ts
│   │   └── category.types.ts
│   │
│   ├── utils/                    # 순수 유틸리티 함수
│   │   ├── date.utils.ts
│   │   └── validation.utils.ts
│   │
│   ├── constants/                # 상수
│   │   ├── filter.constants.ts
│   │   └── api.constants.ts
│   │
│   ├── router/                   # React Router 설정
│   │   └── AppRouter.tsx
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── .env.example
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

### 디렉토리별 역할 및 규칙

#### `api/` 디렉토리

**역할:** HTTP API 호출 함수 및 TanStack Query 훅

**포함:**
- fetch를 사용한 API 호출 함수
- useQuery, useMutation 훅 (TanStack Query)

**제외:**
- 컴포넌트
- 비즈니스 로직

```typescript
// todos.api.ts
export async function fetchTodos(filters?: Filters) {
  const params = new URLSearchParams();
  if (filters?.category_id) params.append('category_id', String(filters.category_id));
  if (filters?.is_completed !== undefined) params.append('is_completed', String(filters.is_completed));
  if (filters?.overdue !== undefined) params.append('overdue', String(filters.overdue));

  const token = useAuthStore.getState().token;
  const res = await fetch(`/api/todos?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.json();
}

export function useTodos(filters?: Filters) {
  return useQuery({
    queryKey: ['todos', filters],
    queryFn: () => fetchTodos(filters),
    staleTime: 5 * 60 * 1000 // 5분
  });
}
```

#### `components/` 디렉토리

**역할:** 재사용 가능한 순수 UI 컴포넌트

**규칙:**
- Props 기반으로만 동작
- 도메인 무관 (여러 페이지에서 재사용 가능)
- API 호출 금지
- 상태 관리 최소화

**포함:**
- 버튼, 입력, 모달, 카드 같은 기본 컴포넌트
- 레이아웃 컴포넌트

**제외:**
- 도메인 특화 로직
- API 호출
- useQuery 사용

```typescript
// components/common/Button.tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onClick, isLoading, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled || isLoading}>
      {isLoading ? '로딩 중...' : label}
    </button>
  );
}
```

#### `features/` 디렉토리

**역할:** 도메인별 기능 단위 (컴포넌트 + 훅 묶음)

**구조:**
```
features/
├── todos/
│   ├── components/        # 할일 도메인에 특화된 컴포넌트
│   ├── hooks/             # 할일 관련 훅
│   └── types.ts           # 할일 타입 (선택)
├── auth/
│   ├── components/
│   └── hooks/
```

**규칙:**
- 도메인 특화 컴포넌트만 포함
- 같은 도메인 내에서 재사용 가능
- 다른 도메인 features 참조 금지

```typescript
// features/todos/components/TodoCard.tsx
interface TodoCardProps {
  todo: Todo;
  onComplete: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function TodoCard({ todo, onComplete, onEdit, onDelete }: TodoCardProps) {
  return (
    <div className={todo.is_completed ? 'completed' : ''}>
      <h3>{todo.title}</h3>
      <p>{todo.description}</p>
      <span className="category">{todo.category?.name}</span>
      <span className={todo.is_completed ? 'complete' : 'pending'}>
        {todo.is_completed ? '완료' : '미완료'}
      </span>
      <button onClick={() => onComplete(todo.id)}>상태변경</button>
      <button onClick={() => onEdit(todo.id)}>수정</button>
      <button onClick={() => onDelete(todo.id)}>삭제</button>
    </div>
  );
}

// features/todos/hooks/useTodos.ts
export function useTodos(filters?: Filters) {
  return useQuery({
    queryKey: ['todos', filters],
    queryFn: () => fetchTodos(filters)
  });
}

export function useTodoMutations() {
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTodoDto }) =>
      updateTodo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });

  return { createMutation, updateMutation };
}
```

#### `pages/` 디렉토리

**역할:** 라우트 진입점 (페이지 컴포넌트)

**규칙:**
- 라우터에 직접 연결
- 여러 컴포넌트/훅 조합
- 페이지 로직 담당

```typescript
// pages/TodoListPage.tsx
import { useTodos } from '../features/todos/hooks/useTodos';
import { TodoCard } from '../features/todos/components/TodoCard';
import { TodoFilter } from '../features/todos/components/TodoFilter';

export default function TodoListPage() {
  const [filters, setFilters] = useState<Filters>({});
  const { data: todos, isLoading, error } = useTodos(filters);
  const { createMutation, updateMutation, deleteMutation } = useTodoMutations();

  return (
    <AppLayout>
      <TodoFilter onFilterChange={setFilters} />
      {isLoading && <div>로딩 중...</div>}
      {error && <div>에러 발생</div>}
      {todos?.map(todo => (
        <TodoCard
          key={todo.id}
          todo={todo}
          onComplete={(id) => updateMutation.mutate({ id, data: { is_completed: !todo.is_completed } })}
          onEdit={(id) => navigate(`/todos/${id}/edit`)}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      ))}
    </AppLayout>
  );
}
```

#### `stores/` 디렉토리

**역할:** Zustand 전역 상태 (클라이언트 상태만)

**포함:**
- 로그인 사용자 정보
- UI 전역 상태 (다크 모드, 모달 열기/닫기)

**제외:**
- 서버 상태 (TanStack Query 사용)

```typescript
// stores/useAuthStore.ts
interface AuthState {
  user: User | null;
  token: string | null;  // JWT를 메모리에 저장 (페이지 새로고침 시 초기화)
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
  logout: () => set({ user: null, token: null })
}));
```

#### `types/` 디렉토리

**역할:** TypeScript 타입 정의 (공유)

```typescript
// types/todo.types.ts
export interface Todo {
  id: number;
  user_id: number;
  category_id: number;
  title: string;
  description?: string;
  due_date?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
  due_date?: string;
  category_id: number;
}

export interface UpdateTodoDto extends Partial<CreateTodoDto> {}
```

#### `utils/` 디렉토리

**역할:** 순수 유틸리티 함수

```typescript
// utils/date.utils.ts
export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ko-KR');
}
```

---

## 7. 백엔드 디렉토리 구조

```
backend/
├── src/
│   ├── config/                   # 환경 변수 로드 및 설정
│   │   ├── db.ts                 # pg.Pool 인스턴스
│   │   └── env.ts                # 환경 변수 파싱
│   │
│   ├── middleware/               # Express 미들웨어
│   │   ├── auth.middleware.ts    # JWT 검증
│   │   ├── error.middleware.ts   # 전역 에러 핸들러
│   │   └── validation.middleware.ts
│   │
│   ├── modules/                  # 도메인별 모듈 (라우터/컨트롤러/서비스/레포지토리)
│   │   ├── auth/
│   │   │   ├── auth.router.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.service.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.router.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.repository.ts
│   │   │
│   │   ├── todos/
│   │   │   ├── todos.router.ts
│   │   │   ├── todos.controller.ts
│   │   │   ├── todos.service.ts
│   │   │   ├── todos.repository.ts
│   │   │   └── todos.types.ts     # 도메인 특화 타입 (선택)
│   │   │
│   │   └── categories/
│   │       ├── categories.router.ts
│   │       ├── categories.controller.ts
│   │       ├── categories.service.ts
│   │       └── categories.repository.ts
│   │
│   ├── types/                    # 공유 TypeScript 타입
│   │   ├── express.d.ts          # req.user 타입 확장
│   │   └── common.types.ts       # 공통 타입
│   │
│   ├── utils/                    # 순수 유틸리티 함수
│   │   ├── jwt.utils.ts
│   │   └── password.utils.ts
│   │
│   ├── app.ts                    # Express 앱 인스턴스
│   └── server.ts                 # 서버 실행
│
├── tests/
│   ├── unit/                     # 단위 테스트
│   │   └── services/
│   └── integration/              # 통합 테스트
│       └── api.e2e.test.ts
│
├── db/
│   ├── migrations/               # DDL SQL 파일
│   │   ├── 001-create-users.sql
│   │   ├── 002-create-categories.sql
│   │   └── 003-create-todos.sql
│   └── seeds/                    # 시드 데이터
│       └── seed-categories.ts
│
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

### 디렉토리별 역할 및 규칙

#### `config/` 디렉토리

**역할:** 환경 변수 로드 및 설정 관리

```typescript
// config/env.ts
export const config = {
  database: {
    url: process.env.DATABASE_URL!,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME!
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRY || '24h'
  },
  server: {
    port: parseInt(process.env.SERVER_PORT || '3000'),
    env: process.env.NODE_ENV || 'development'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  }
};

// config/db.ts
import { Pool } from 'pg';
import { config } from './env';

export const db = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

db.on('error', (err) => {
  console.error('DB connection error:', err);
});

export default db;
```

#### `middleware/` 디렉토리

**역할:** Express 미들웨어

```typescript
// middleware/auth.middleware.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '인증이 필요합니다' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { id: number; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: '유효하지 않은 토큰입니다' });
  }
}

// middleware/error.middleware.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);

  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    message: '서버 오류가 발생했습니다',
    ...(isDevelopment && { error: err.message })
  });
}
```

#### `modules/` 디렉토리 - 레이어별 코드 예시

```typescript
// modules/todos/todos.router.ts
import { Router } from 'express';
import { TodoController } from './todos.controller';
import { authenticate } from '../../middleware/auth.middleware';

export const todosRouter = Router();
const controller = new TodoController();

todosRouter.get('/', authenticate, (req, res) => controller.getTodos(req, res));
todosRouter.post('/', authenticate, (req, res) => controller.createTodo(req, res));
todosRouter.get('/:id', authenticate, (req, res) => controller.getTodoById(req, res));
todosRouter.put('/:id', authenticate, (req, res) => controller.updateTodo(req, res));
todosRouter.patch('/:id/complete', authenticate, (req, res) => controller.completeTodo(req, res));
todosRouter.delete('/:id', authenticate, (req, res) => controller.deleteTodo(req, res));

// modules/todos/todos.controller.ts
import { Request, Response } from 'express';
import { TodoService } from './todos.service';

export class TodoController {
  private todoService = new TodoService();

  async getTodos(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const filters = {
        category_id: req.query.category_id ? Number(req.query.category_id) : undefined,
        is_completed: req.query.is_completed ? req.query.is_completed === 'true' : undefined,
        overdue: req.query.overdue ? req.query.overdue === 'true' : undefined
      };

      const todos = await this.todoService.getTodos(userId, filters);
      res.json({ data: todos });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  async createTodo(req: Request, res: Response) {
    try {
      const { title, description, due_date, category_id } = req.body;
      const userId = req.user!.id;

      // 입력 검증 (컨트롤러에서 즉시)
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ message: '제목 필수' });
      }

      const todo = await this.todoService.createTodo({
        title: title.trim(),
        description,
        due_date,
        category_id,
        user_id: userId
      });

      res.status(201).json({ data: todo });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  async completeTodo(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const todoId = Number(req.params.id);

      const todo = await this.todoService.completeTodo(todoId, userId);
      res.json({ data: todo });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

// modules/todos/todos.service.ts
import { TodoRepository } from './todos.repository';
import { CategoryRepository } from '../categories/categories.repository';

export interface CreateTodoDto {
  title: string;
  description?: string;
  due_date?: string;
  category_id: number;
  user_id: number;
}

export class TodoService {
  private todoRepository = new TodoRepository();
  private categoryRepository = new CategoryRepository();

  async getTodos(userId: number, filters?: any) {
    return await this.todoRepository.getTodos(userId, filters);
  }

  async createTodo(dto: CreateTodoDto) {
    // 비즈니스 로직: 카테고리 유효성 확인
    const category = await this.categoryRepository.getById(dto.category_id);
    
    if (!category) {
      throw new Error('유효하지 않은 카테고리');
    }

    // 사용자가 접근 가능한 카테고리인지 확인 (기본 또는 본인 카테고리)
    if (!category.is_default && category.user_id !== dto.user_id) {
      throw new Error('해당 카테고리에 접근할 권한이 없습니다');
    }

    return await this.todoRepository.createTodo(dto);
  }

  async completeTodo(todoId: number, userId: number) {
    // 소유권 확인 (서비스에서)
    const todo = await this.todoRepository.getTodoById(todoId);
    
    if (!todo) {
      throw new Error('할일을 찾을 수 없습니다');
    }

    if (todo.user_id !== userId) {
      throw new Error('이 할일에 접근할 권한이 없습니다');
    }

    // 토글 처리
    return await this.todoRepository.updateTodo(todoId, {
      is_completed: !todo.is_completed
    });
  }
}

// modules/todos/todos.repository.ts
import db from '../../config/db';

export class TodoRepository {
  async getTodos(userId: number, filters?: any) {
    let query = 'SELECT * FROM todos WHERE user_id = $1';
    const params: any[] = [userId];

    if (filters?.category_id) {
      query += ` AND category_id = $${params.length + 1}`;
      params.push(filters.category_id);
    }

    if (filters?.is_completed !== undefined) {
      query += ` AND is_completed = $${params.length + 1}`;
      params.push(filters.is_completed);
    }

    if (filters?.overdue) {
      query += ` AND due_date < CURRENT_DATE AND is_completed = FALSE`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  async getTodoById(id: number) {
    const query = 'SELECT * FROM todos WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async createTodo(data: CreateTodoDto) {
    const query = `
      INSERT INTO todos (user_id, category_id, title, description, due_date, is_completed, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, FALSE, NOW(), NOW())
      RETURNING *
    `;
    const result = await db.query(query, [
      data.user_id,
      data.category_id,
      data.title,
      data.description || null,
      data.due_date || null
    ]);
    return result.rows[0];
  }

  async updateTodo(id: number, data: Partial<CreateTodoDto>) {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.due_date !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      params.push(data.due_date);
    }
    if (data.category_id !== undefined) {
      updates.push(`category_id = $${paramIndex++}`);
      params.push(data.category_id);
    }
    if ((data as any).is_completed !== undefined) {
      updates.push(`is_completed = $${paramIndex++}`);
      params.push((data as any).is_completed);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE todos
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await db.query(query, params);
    return result.rows[0];
  }

  async deleteTodo(id: number) {
    const query = 'DELETE FROM todos WHERE id = $1';
    await db.query(query, [id]);
  }
}
```

---

## 8. 모노레포 루트 구조

```
todolist-app/
├── frontend/              # React 19 + TypeScript 프로젝트
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
│
├── backend/               # Node.js + Express 프로젝트
│   ├── src/
│   ├── tests/
│   ├── db/
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── docs/                  # 문서
│   ├── 1-domain-definition.md
│   ├── 2-prd.md
│   ├── 3-user-scenario.md
│   ├── 4-architecture-principles.md
│   └── 99-uc.md
│
├── .gitignore
├── README.md              # 프로젝트 전체 개요
└── package.json           # 모노레포 루트 (선택사항)
```

**모노레포 루트 package.json 예시:**

```json
{
  "name": "todolist-app",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "dev": "yarn workspace frontend dev & yarn workspace backend dev",
    "build": "yarn workspace frontend build && yarn workspace backend build",
    "test": "yarn workspace backend test && yarn workspace frontend test"
  }
}
```

---

## 9. 변경 이력

| 버전 | 날짜 | 변경자 | 변경 내용 | 변경 사유 |
|------|------|--------|-----------|----------|
| 1.0 | 2026-05-13 | Architecture Engineer | 최초 작성 | 프로젝트 아키텍처 설계 원칙 문서화 |
| 1.1 | 2026-05-13 | Architecture Engineer | JWT 토큰 저장 방식 변경: localStorage → Zustand 메모리. useAuthStore에 token/setToken 필드 추가, API 함수 내 getToken() → useAuthStore.getState().token으로 교체 | XSS 취약점 노출 최소화 및 보안 기본값 원칙 적용 |

---

## 부록: 빠른 참조

### 공통 원칙 요약

| 원칙 | 핵심 규칙 |
|------|---------|
| **SRP** | 각 모듈은 변경의 이유가 하나여야 함 |
| **SoC** | 관심사를 물리적으로 분리 (DB/로직/HTTP) |
| **DRY** | 반복되는 패턴은 함수/컴포넌트로 추상화 |
| **명시적 의존성** | 의존성을 명시적으로 선언 (주입) |
| **Fail Fast** | 조건 불만족 시 즉시 반환 (Early Return) |
| **불변성** | 데이터 수정 대신 새 객체 생성 |
| **보안 기본값** | 모든 리소스 기본 보호, 명시적 허용 |

### 백엔드 체크리스트

- ✓ 모든 SQL 쿼리 파라미터화 ($1, $2 사용)
- ✓ JWT 검증 미들웨어 보호 라우트 적용
- ✓ 입력 검증 컨트롤러에서 즉시 수행
- ✓ 서비스 계층에서 비즈니스 로직 구현
- ✓ Repository에서 데이터 접근
- ✓ bcrypt 해시 라운드 10 이상
- ✓ 환경 변수 .env 사용 (코드 내 하드코딩 금지)
- ✓ 에러 로그에 userId, endpoint, timestamp 포함

### 프론트엔드 체크리스트

- ✓ 컴포넌트에서 직접 fetch 금지 (훅 사용)
- ✓ TanStack Query로 서버 상태 관리
- ✓ Zustand로 클라이언트 전역 상태 관리
- ✓ API 함수는 api/ 디렉토리에 위치
- ✓ 도메인 특화 컴포넌트는 features/ 디렉토리에
- ✓ 타입 정의는 types/ 디렉토리에 집중
- ✓ 환경 변수 .env 사용
