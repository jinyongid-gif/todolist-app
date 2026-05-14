# TodoListApp 기술 아키텍처 다이어그램

## 문서 정보

| 항목 | 내용 |
|------|------|
| 버전 | 1.0 |
| 작성일 | 2026-05-13 |
| 작성자 | Documentation Engineer |
| 관련 문서 | [2-prd.md](./2-prd.md), [4-project-principles.md](./4-project-principles.md) |

---

## 1. 전체 시스템 구성

### 3-Tier 아키텍처

```mermaid
flowchart LR
    Browser["🌐 Browser<br/>React 19"]
    Frontend["Frontend Layer<br/>React + TypeScript"]
    API["REST API<br/>Express"]
    Database["Database<br/>PostgreSQL 17"]
    
    Browser -->|JWT Token| Frontend
    Frontend -->|HTTP + JWT| API
    API -->|SQL| Database
    Database -->|Rows| API
    API -->|JSON| Frontend
    Frontend -->|UI| Browser
    
    style Browser fill:#e1f5ff
    style Frontend fill:#f3e5f5
    style API fill:#fff3e0
    style Database fill:#e8f5e9
```

**핵심 포인트:**
- 프론트엔드는 REST API를 통해 백엔드와 통신
- JWT 토큰을 Authorization 헤더로 전달하여 인증
- 모든 데이터는 PostgreSQL에서 관리

---

## 2. 백엔드 레이어 구조

### 요청-응답 흐름

```mermaid
flowchart TD
    Route["Router<br/>엔드포인트 정의"]
    Controller["Controller<br/>요청/응답 처리"]
    Service["Service<br/>비즈니스 로직"]
    Repository["Repository<br/>데이터 접근"]
    DB["PostgreSQL"]
    
    Route -->|라우트 매핑| Controller
    Controller -->|DTO| Service
    Service -->|비즈니스 규칙| Repository
    Repository -->|파라미터화 쿼리| DB
    
    DB -->|결과| Repository
    Repository -->|데이터| Service
    Service -->|응답 객체| Controller
    Controller -->|JSON| Route
    
    style Route fill:#fff3e0
    style Controller fill:#ffe0b2
    style Service fill:#ffcc80
    style Repository fill:#ffb74d
    style DB fill:#ffa726
```

**레이어별 책임:**
- **Router:** HTTP 엔드포인트 정의, 미들웨어 연결
- **Controller:** 입력 검증, 비즈니스 로직 호출, 응답 포맷
- **Service:** 도메인 규칙 구현, 트랜잭션, 의사결정
- **Repository:** SQL 쿼리 실행, 파라미터화 쿼리로 SQL Injection 방지
- **DB:** 데이터 영속성, 제약 조건 관리

---

## 3. 인증 흐름

### 로그인 및 토큰 기반 요청

```mermaid
sequenceDiagram
    participant Client as 클라이언트
    participant Server as 서버
    participant DB as PostgreSQL
    
    Client->>Server: POST /api/auth/login<br/>{ email, password }
    
    Server->>DB: SELECT * FROM users<br/>WHERE email = $1
    DB-->>Server: User 레코드
    
    Server->>Server: bcrypt.compare<br/>비밀번호 검증
    
    alt 검증 성공
        Server->>Server: jwt.sign<br/>Access Token 발급
        Server-->>Client: 200 OK<br/>{ accessToken }
        
        Client->>Client: 토큰 저장<br/>(Zustand 메모리)
        
        Client->>Server: GET /api/todos<br/>Authorization: Bearer {token}
        Server->>Server: jwt.verify<br/>토큰 검증
        Server->>DB: SELECT * FROM todos<br/>WHERE user_id = $1
        DB-->>Server: Todo 배열
        Server-->>Client: 200 OK<br/>{ data: todos }
    else 검증 실패
        Server-->>Client: 401 Unauthorized
    end
```

**핵심 포인트:**
- 비밀번호는 bcrypt로 해시되어 저장 (최소 10 라운드)
- JWT 토큰은 로그인 성공 시 발급
- 모든 인증 필요 API는 Authorization 헤더에서 토큰 검증
- 토큰 검증 실패 시 401 Unauthorized 반환

---

## 4. 프론트엔드 상태 관리

### TanStack Query vs Zustand 역할 분리

```mermaid
flowchart LR
    Page["페이지<br/>TodoListPage"]
    
    subgraph Server["서버 상태 관리<br/>TanStack Query"]
        Query["useQuery<br/>useInfiniteQuery"]
        Cache["자동 캐싱<br/>& 동기화"]
        Invalidate["자동 재검증"]
        Query --> Cache --> Invalidate
    end
    
    subgraph Client["클라이언트 상태<br/>Zustand"]
        Auth["useAuthStore<br/>로그인 사용자"]
        UI["UI 상태<br/>모달, 테마"]
        Auth --> UI
    end
    
    subgraph API["API 호출"]
        Fetch["fetch"]
    end
    
    Page -->|서버 데이터| Server
    Page -->|클라이언트 상태| Client
    Server -->|HTTP 요청| API
    API -->|응답| Server
    
    style Page fill:#f3e5f5
    style Server fill:#e3f2fd
    style Client fill:#f1f8e9
    style API fill:#fff3e0
```

**상태 관리 전략:**
- **TanStack Query (서버 상태):** API 응답 캐싱, 자동 동기화, 백그라운드 재검증
- **Zustand (클라이언트 상태):** 로그인 사용자, UI 전역 상태 (다크모드, 모달)
- **컴포넌트:** 순수 렌더링, Props 기반 동작 (상태 관리 최소화)

---

## 5. 데이터 모델 관계도

### 테이블 및 FK 관계

```mermaid
erDiagram
    USERS ||--o{ CATEGORIES : "1:N"
    USERS ||--o{ TODOS : "1:N"
    CATEGORIES ||--o{ TODOS : "1:N"
    
    USERS {
        int id PK
        string email UNIQUE
        string password "bcrypt 해시"
        string name
        timestamp created_at
    }
    
    CATEGORIES {
        int id PK
        string name
        boolean is_default "기본 카테고리 여부"
        int user_id FK "NULL = 시스템 기본"
    }
    
    TODOS {
        int id PK
        int user_id FK
        int category_id FK
        string title
        string description
        date due_date "NULL 허용"
        boolean is_completed
        timestamp created_at
        timestamp updated_at
    }
```

**주요 특징:**
- `users` 삭제 시 `ON DELETE CASCADE` → 사용자의 모든 할일 및 카테고리 자동 삭제
- 기본 카테고리: `is_default = TRUE`, `user_id = NULL`
- 사용자 정의 카테고리: `is_default = FALSE`, `user_id = 특정 사용자`

---

## 기술 스택 요약

| 계층 | 기술 |
|-----|------|
| **프론트엔드** | React 19 + TypeScript |
| **상태 관리** | Zustand (클라이언트), TanStack Query v5 (서버) |
| **백엔드** | Node.js + Express (JavaScript/CommonJS) |
| **DB 클라이언트** | pg (node-postgres) |
| **데이터베이스** | PostgreSQL 17 |
| **인증** | JWT (jsonwebtoken) |
| **HTTP 로깅** | morgan |
| **애플리케이션 로깅** | winston |
| **API 문서** | swagger-ui-express (`/api-docs`) |
| **백엔드 테스트** | Jest + supertest |

---

## 변경 이력

| 버전 | 날짜 | 변경자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2026-05-13 | Documentation Engineer | 최초 작성 - 4개 다이어그램 포함 |
| 1.1 | 2026-05-14 | Backend Developer | 기술 스택 요약 표에 morgan·winston·swagger-ui-express·Jest+supertest 추가 |
