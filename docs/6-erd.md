# Entity Relationship Diagram (ERD)

## 문서 정보

| 항목 | 내용 |
|------|------|
| 버전 | 1.0 |
| 작성일 | 2026-05-13 |
| 관련 문서 | [2-prd.md](./2-prd.md) |

---

## ERD (Mermaid erDiagram)

```mermaid
erDiagram
    USERS ||--o{ CATEGORIES : "owns"
    USERS ||--o{ TODOS : "owns"
    CATEGORIES ||--o{ TODOS : "classifies"

    USERS {
        int id PK "Primary Key"
        string email UK,NN "UNIQUE, NOT NULL - 로그인 ID"
        string password NN "NOT NULL - bcrypt 해시"
        string name NN "NOT NULL - 표시 이름"
        timestamp created_at NN "NOT NULL, DEFAULT NOW() - 가입일시"
    }

    CATEGORIES {
        int id PK "Primary Key"
        string name NN "NOT NULL - 카테고리명"
        boolean is_default NN "NOT NULL, DEFAULT FALSE - 기본 카테고리 여부"
        int user_id FK "FK → users.id, NULL 허용 - NULL이면 기본 카테고리"
    }

    TODOS {
        int id PK "Primary Key"
        int user_id FK,NN "NOT NULL, FK → users.id - 소유 사용자"
        int category_id FK,NN "NOT NULL, FK → categories.id - 소속 카테고리"
        string title NN "NOT NULL - 할일 제목"
        text description "NULL 허용 - 상세 설명"
        date due_date "NULL 허용 - 종료예정일"
        boolean is_completed NN "NOT NULL, DEFAULT FALSE - 완료 여부"
        timestamp created_at NN "NOT NULL, DEFAULT NOW() - 등록일시"
        timestamp updated_at NN "NOT NULL, DEFAULT NOW() - 최종 수정일시"
    }
```

---

## 테이블 정의

### users 테이블

**목적**: 애플리케이션에 가입한 사용자 정보를 관리하는 기본 엔티티

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | SERIAL | PK | 사용자 고유 식별자 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 로그인 ID. 이메일 주소는 시스템 내 유일해야 함 |
| password | VARCHAR(255) | NOT NULL | bcrypt 단방향 해시로 암호화되어 저장 |
| name | VARCHAR(100) | NOT NULL | 프로필에 표시되는 사용자명 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 회원가입 일시. 자동으로 현재 시각 입력 |

**비즈니스 규칙**:
- 이메일은 시스템 내 유일하며, 중복 가입 불가
- 비밀번호는 반드시 bcrypt 해시로 저장되어야 함 (평문 저장 금지)
- 회원 탈퇴 시 CASCADE 정책에 의해 해당 사용자의 모든 카테고리와 할일이 함께 삭제됨

**향후 확장**:
- 2차 OAuth 구현 시 `oauth_provider VARCHAR(50)`, `oauth_id VARCHAR(255)` 컬럼 추가 예정

---

### categories 테이블

**목적**: 기본 카테고리 및 사용자 정의 카테고리를 관리하는 엔티티

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | SERIAL | PK | 카테고리 고유 식별자 |
| name | VARCHAR(100) | NOT NULL | 카테고리명. 동일 사용자 범위 내에서 중복 불가 |
| is_default | BOOLEAN | NOT NULL, DEFAULT FALSE | 기본 카테고리 여부. TRUE이면 모든 사용자가 사용 가능한 시스템 카테고리 |
| user_id | INTEGER | FK → users.id, NULL 허용 | 카테고리 소유자 사용자 ID. NULL이면 모든 사용자가 사용하는 기본 카테고리 |

**비즈니스 규칙**:
- 동일 user_id 범위 내에서 name은 중복될 수 없음 (NULL인 기본 카테고리끼리도 name 중복 불가)
- is_default가 TRUE인 기본 카테고리는 사용자가 삭제할 수 없음
- user_id 컬럼에 ON DELETE CASCADE 적용 → 사용자 삭제 시 해당 사용자 정의 카테고리 자동 삭제
- 기본 카테고리(user_id = NULL, is_default = TRUE)는 개발 초기에 seed 스크립트로 삽입

---

### todos 테이블

**목적**: 사용자가 등록한 할일 정보를 관리하는 핵심 엔티티

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | SERIAL | PK | 할일 고유 식별자 |
| user_id | INTEGER | FK → users.id, NOT NULL | 할일 소유자 사용자 ID. 반드시 존재하는 사용자여야 함 |
| category_id | INTEGER | FK → categories.id, NOT NULL | 할일이 속한 카테고리 ID. 반드시 존재하는 카테고리여야 함 |
| title | VARCHAR(255) | NOT NULL | 할일의 제목. 사용자에게 표시되는 주요 정보 |
| description | TEXT | NULL 허용 | 할일의 상세 설명. 선택사항 |
| due_date | DATE | NULL 허용 | 예정된 완료 날짜. 선택사항 |
| is_completed | BOOLEAN | NOT NULL, DEFAULT FALSE | 완료 여부. 할일 목록 필터링에 사용 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 할일 등록 일시. 자동으로 현재 시각 입력 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 할일 최종 수정 일시. UPDATE 발생 시마다 갱신 |

**비즈니스 규칙**:
- user_id 컬럼에 ON DELETE CASCADE 적용 → 사용자 삭제 시 해당 사용자의 모든 할일 자동 삭제
- 기간 초과(Overdue) 판별: `due_date < CURRENT_DATE AND is_completed = FALSE`
- 할일 목록은 다음 기준으로 필터링 가능:
  - category_id: 특정 카테고리로 필터링
  - is_completed: 완료/미완료 여부로 필터링
  - 기간 초과 여부: due_date와 is_completed 조합으로 판별

---

## 관계 및 제약 요약

### 관계 목록

| 관계 | 방향 | 카디널리티 | DELETE 정책 | 설명 |
|------|------|-----------|-----------|------|
| users - categories | 1:N | 1 사용자 : 다 카테고리 | ON DELETE CASCADE | 사용자는 여러 사용자 정의 카테고리 보유. 사용자 삭제 시 카테고리도 삭제 |
| users - todos | 1:N | 1 사용자 : 다 할일 | ON DELETE CASCADE | 사용자는 여러 할일 보유. 사용자 삭제 시 할일도 삭제 |
| categories - todos | 1:N | 1 카테고리 : 다 할일 | RESTRICT | 할일은 반드시 카테고리에 속함. 카테고리 삭제 시 해당 할일은 기본 카테고리로 재할당하거나 함께 삭제 (비즈니스 규칙으로 결정 필요) |

### 주요 제약 조건

**UNIQUE 제약**:
- users.email — 이메일 중복 가입 방지

**NOT NULL 제약**:
- users.email, password, name
- categories.name, is_default
- todos.user_id, category_id, title, is_completed, created_at, updated_at

**DEFAULT 제약**:
- categories.is_default = FALSE
- todos.is_completed = FALSE
- users.created_at = NOW()
- categories.user_id 또는 todos.created_at, updated_at = NOW()

**FOREIGN KEY 제약**:
- categories.user_id → users.id (ON DELETE CASCADE)
- todos.user_id → users.id (ON DELETE CASCADE)
- todos.category_id → categories.id (RESTRICT 권장)

---

## 변경 이력

| 버전 | 날짜 | 변경자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2026-05-13 | Documentation Engineer | ERD 문서 최초 작성. Mermaid 포맷으로 3개 테이블(users, categories, todos) 관계 및 컬럼 정의 기록. PRD §7 데이터 모델을 기반으로 작성 |
