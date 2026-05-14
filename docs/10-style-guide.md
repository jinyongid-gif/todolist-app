# TodoListApp 프론트엔드 스타일 가이드

## 문서 정보

| 항목 | 내용 |
|------|------|
| 버전 | 1.0 |
| 작성일 | 2026-05-14 |
| 관련 문서 | [2-prd.md](./2-prd.md), [9-front-intergration.md](./9-front-intergration.md) |
| 디자인 레퍼런스 | docs/capture.png (Woori Bank BaaS API 스토어) |
| 목적 | FE-01~FE-07 구현 시 일관된 UI를 위한 디자인 토큰 및 컴포넌트 스펙 정의 |

---

## 1. 색상 (Color Palette)

### 1.1 Primary 색상

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--color-primary-700` | `#1D4ED8` | 주요 CTA 버튼, 활성 탭 테두리 |
| `--color-primary-600` | `#2563EB` | 버튼 기본 배경, 링크 |
| `--color-primary-500` | `#3B82F6` | 버튼 hover, 포커스 링 |
| `--color-primary-100` | `#DBEAFE` | 태그 배경, 선택된 항목 배경 |
| `--color-primary-50`  | `#EFF6FF` | 카드 hover 배경, 미묘한 강조 |

### 1.2 Neutral 색상

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--color-neutral-900` | `#111827` | 헤딩, 주요 텍스트 |
| `--color-neutral-700` | `#374151` | 본문 텍스트 |
| `--color-neutral-500` | `#6B7280` | 보조 텍스트, 플레이스홀더 |
| `--color-neutral-300` | `#D1D5DB` | 비활성 보더, 구분선 |
| `--color-neutral-100` | `#F3F4F6` | 페이지 배경 |
| `--color-neutral-50`  | `#F9FAFB` | 섹션 배경 |
| `--color-white`       | `#FFFFFF` | 카드, 모달, 입력 필드 배경 |

### 1.3 Semantic 색상

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--color-success`    | `#10B981` | 완료 상태 배지, 성공 메시지 |
| `--color-warning`    | `#F59E0B` | 기한 임박 경고 |
| `--color-danger`     | `#EF4444` | 삭제 버튼, 오류 메시지, 기한 초과 |
| `--color-danger-50`  | `#FEF2F2` | 오류 메시지 배경 |

### 1.4 Hero 카드 색상 (온보딩/랜딩 전용)

| 이름 | Hex | 용도 |
|------|-----|------|
| Hero Blue | `#3B52CC` | 일반 강조 카드 배경 |
| Hero Light Blue | `#7BBBF5` | 보조 강조 카드 배경 |
| Hero Navy | `#1B2461` | 어두운 강조 카드 배경 |

---

## 2. 타이포그래피 (Typography)

### 2.1 폰트 패밀리

```css
/* 우선순위 순서 */
font-family: 'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
```

> **선택 이유:** Pretendard는 현대적인 한국어 웹 폰트로, 레퍼런스 디자인의 깔끔한 글꼴 분위기를 가장 잘 재현한다.

### 2.2 타입 스케일

| 토큰 | Size | Weight | Line Height | 용도 |
|------|------|--------|-------------|------|
| `text-4xl` | 36px | 700 Bold | 1.2 | 페이지 메인 헤딩 |
| `text-3xl` | 30px | 700 Bold | 1.25 | 섹션 헤딩 |
| `text-2xl` | 24px | 600 Semibold | 1.3 | 카드 그룹 제목 |
| `text-xl`  | 20px | 600 Semibold | 1.4 | 카드 제목, 모달 제목 |
| `text-lg`  | 18px | 500 Medium | 1.5 | 서브 헤딩, 강조 텍스트 |
| `text-base`| 16px | 400 Regular | 1.6 | 본문, 버튼 텍스트 |
| `text-sm`  | 14px | 400 Regular | 1.5 | 보조 설명, 레이블 |
| `text-xs`  | 12px | 400 Regular | 1.4 | 태그, 메타 정보, 날짜 |

### 2.3 텍스트 색상 사용 규칙

```
헤딩          → --color-neutral-900
본문          → --color-neutral-700
보조 텍스트   → --color-neutral-500
비활성/힌트   → --color-neutral-300
링크          → --color-primary-600
```

---

## 3. 간격 시스템 (Spacing)

8px 배수 기반 간격 시스템을 사용한다.

| 토큰 | 값 | 용도 |
|------|----|------|
| `space-1` | 4px | 아이콘과 텍스트 사이 |
| `space-2` | 8px | 인라인 요소 사이, 태그 패딩 |
| `space-3` | 12px | 버튼 내부 세로 패딩 |
| `space-4` | 16px | 카드 내부 패딩, 입력 필드 |
| `space-5` | 20px | 섹션 내부 패딩 |
| `space-6` | 24px | 카드 패딩, 모달 패딩 |
| `space-8` | 32px | 섹션 사이 마진 |
| `space-10`| 40px | 페이지 섹션 상하 패딩 |
| `space-12`| 48px | 주요 섹션 구분 |

---

## 4. Border Radius

| 토큰 | 값 | 용도 |
|------|----|------|
| `rounded-sm`  | 4px  | 작은 버튼, 배지 |
| `rounded`     | 8px  | 기본 버튼, 입력 필드 |
| `rounded-lg`  | 12px | 카드, 드롭다운 |
| `rounded-xl`  | 16px | 모달, 큰 카드 |
| `rounded-full`| 9999px | 태그/칩, 아바타, 알림 뱃지 |

---

## 5. 그림자 (Shadow)

| 토큰 | 값 | 용도 |
|------|----|------|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)` | 카드 기본 상태 |
| `shadow`    | `0 4px 12px rgba(0,0,0,0.10)` | 카드 hover, 드롭다운 |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | 모달, 팝오버 |
| `shadow-focus` | `0 0 0 3px rgba(37,99,235,0.3)` | 포커스 링 (primary) |

---

## 6. 컴포넌트 스펙

### 6.1 Button

#### Variant

```
Primary   - 배경: primary-600 / 텍스트: white / hover: primary-700
Secondary - 배경: white / 보더: neutral-300 / 텍스트: neutral-700 / hover: neutral-50
Danger    - 배경: danger / 텍스트: white / hover: danger 어둡게
Ghost     - 배경: transparent / 텍스트: primary-600 / hover: primary-50
```

#### Size

| 크기 | 높이 | 패딩 | 폰트 |
|------|------|------|------|
| sm | 32px | 8px 12px | 14px |
| md | 40px | 10px 16px | 16px (기본) |
| lg | 48px | 12px 20px | 18px |

#### 상태

```
default  → 그림자 없음
hover    → 한 단계 어두운 배경색
focus    → shadow-focus 링 표시
disabled → opacity-40, cursor-not-allowed
loading  → 스피너 아이콘 + 텍스트 "처리 중..."
```

### 6.2 Input / Textarea

```
배경    : white
보더    : neutral-300 (기본), primary-500 (focus), danger (error)
패딩    : 10px 14px
높이    : 40px (Input), auto (Textarea, min-height: 80px)
폰트    : 16px regular, neutral-900
플레이스홀더: neutral-400
border-radius: 8px
transition: border-color 150ms ease
```

#### 상태별 보더 색상

```
기본    → neutral-300
포커스  → primary-500 + shadow-focus
오류    → danger
성공    → success
비활성  → neutral-200, 배경 neutral-50
```

### 6.3 Card

```
배경          : white
보더          : 없음 (shadow-sm으로 구분)
border-radius : 12px
패딩          : 20px 24px
shadow        : shadow-sm
hover         : shadow (transition 200ms ease)
cursor        : pointer (클릭 가능한 카드)
```

#### Todo 카드 구조

```
┌─────────────────────────────────────┐
│ [체크박스]  타이틀 텍스트           │  ← 상단 영역
│             설명 텍스트 (보조)       │
│                                     │
│ [카테고리 태그]       [D-day 뱃지]  │  ← 하단 영역
└─────────────────────────────────────┘
```

### 6.4 Tag / Chip

```
배경          : primary-100
텍스트 색상   : primary-700
폰트          : 12px, medium
패딩          : 4px 10px
border-radius : 9999px (full)
```

#### 특수 태그 색상

```
완료      → success 계열  (배경: #D1FAE5, 텍스트: #065F46)
기한 초과 → danger 계열  (배경: #FEE2E2, 텍스트: #991B1B)
기한 임박 → warning 계열 (배경: #FEF3C7, 텍스트: #92400E)
카테고리  → primary 계열 (배경: primary-100, 텍스트: primary-700)
```

### 6.5 Checkbox

```
크기          : 18px × 18px
보더          : 2px solid neutral-300
border-radius : 4px
체크 상태     : 배경 primary-600, 흰색 체크마크
hover         : 보더 primary-500
focus         : shadow-focus
애니메이션    : 체크마크 scale 0 → 1 (150ms ease)
```

### 6.6 Modal

```
오버레이      : rgba(0,0,0,0.5), backdrop-blur(4px)
컨테이너      : white, border-radius: 16px, shadow-lg
최대 너비     : 480px (sm: 360px)
패딩          : 24px
헤더          : 제목(text-xl bold) + 닫기 버튼 (×)
푸터          : Secondary + Primary 버튼 우측 정렬
애니메이션    : opacity + scale (0.95→1), 200ms ease
```

### 6.7 Navigation Bar (Top)

```
배경          : white
높이          : 60px
보더 하단     : 1px solid neutral-100
shadow        : shadow-sm
로고 영역     : 좌측, text-xl bold, primary-700
메뉴 영역     : 중앙, text-base
사용자 영역   : 우측 (로그인 전: 로그인/회원가입 버튼, 후: 이름 + 로그아웃)
z-index       : 50
```

#### 활성 탭 스타일

```
텍스트        : primary-600, semibold
하단 보더     : 2px solid primary-600
배경          : 없음
```

### 6.8 Dropdown / Select

```
배경          : white
보더          : 1px solid neutral-300
border-radius : 8px
패딩          : 10px 14px
높이          : 40px
화살표 아이콘 : neutral-400, 우측 14px
열린 상태     : shadow, border primary-500
옵션 목록     : white, border-radius: 8px, shadow, z-index: 100
옵션 hover    : primary-50
옵션 선택됨   : primary-600 텍스트, primary-50 배경
```

### 6.9 Empty State

```
아이콘        : 64px, neutral-300
제목          : text-lg, neutral-500
설명          : text-sm, neutral-400
CTA 버튼      : Primary md (선택적)
정렬          : 가운데, 세로 중앙
최소 높이     : 240px
```

### 6.10 Loading Spinner

```
크기          : 20px (inline), 40px (페이지)
색상          : primary-500
애니메이션    : rotate 0.8s linear infinite
```

---

## 7. 레이아웃

### 7.1 페이지 최대 너비

```
컨텐츠 영역 최대 너비: 1200px
좌우 패딩:
  - 모바일 (< 640px)  : 16px
  - 태블릿 (640~1024px): 24px
  - 데스크톱 (> 1024px): 40px
```

### 7.2 그리드 시스템

```
Todo 목록       : 1열 (max-width: 720px, 중앙 정렬)
카테고리 필터   : 가로 스크롤 가능한 탭 형태
모달            : 오버레이 중앙 고정
```

### 7.3 페이지별 레이아웃

#### 로그인/회원가입 페이지 (SCR-01, SCR-02)

```
배경            : neutral-50
카드            : white, border-radius: 16px, shadow-lg
카드 너비       : 400px (모바일: 100% - 32px)
카드 위치       : 화면 중앙 (수직 + 수평)
로고/타이틀     : 카드 상단 중앙
폼 요소 간격    : 16px
```

#### 할일 목록 페이지 (SCR-03)

```
상단 NavBar     : 고정 (sticky top-0)
페이지 패딩 상단: 60px (NavBar 높이만큼)
필터 영역       : 카테고리 탭 + 완료 상태 필터 + 정렬
할일 목록       : 1열, 카드 사이 간격 12px
FAB 버튼        : 우측 하단 고정 (+새 할일 추가)
```

---

## 8. 아이콘

- **라이브러리:** `lucide-react` (React 19와 호환)
- **기본 크기:** 20px (inline 18px, 헤더 24px)
- **기본 색상:** currentColor (부모 텍스트 색상 상속)
- **Stroke width:** 1.5px

### 주요 아이콘 매핑

| 기능 | 아이콘 이름 |
|------|------------|
| 새 항목 추가 | `Plus`, `PlusCircle` |
| 수정 | `Pencil`, `Edit2` |
| 삭제 | `Trash2` |
| 완료 체크 | `Check`, `CheckCircle2` |
| 카테고리 | `Tag`, `Folder` |
| 날짜 | `Calendar` |
| 검색 | `Search` |
| 필터 | `Filter`, `SlidersHorizontal` |
| 닫기 | `X` |
| 로그아웃 | `LogOut` |
| 사용자 | `User`, `UserCircle` |
| 로딩 | `Loader2` (애니메이션) |
| 빈 상태 | `ClipboardList` |

---

## 9. 애니메이션 / 트랜지션

```css
/* 기본 전환 - 버튼, 링크, 호버 효과 */
transition: all 150ms ease;

/* 카드 hover 전환 */
transition: box-shadow 200ms ease, transform 200ms ease;

/* 모달 등장 */
transition: opacity 200ms ease, transform 200ms ease;
transform: scale(0.95) → scale(1);

/* 체크박스 체크 애니메이션 */
transition: background-color 150ms ease, transform 150ms ease;
```

> hover 시 `transform: translateY(-1px)` 를 카드에 적용해 가벼운 부상 효과 제공

---

## 10. Tailwind CSS 설정 가이드

프로젝트에서 Tailwind CSS를 사용하는 경우 `tailwind.config.js`에 커스텀 토큰을 정의한다.

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        neutral: {
          50:  '#F9FAFB',
          100: '#F3F4F6',
          300: '#D1D5DB',
          500: '#6B7280',
          700: '#374151',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'focus': '0 0 0 3px rgba(37, 99, 235, 0.3)',
        'card':  '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
};
```

---

## 11. 반응형 브레이크포인트

| 이름 | 너비 | 설명 |
|------|------|------|
| `sm` | 640px | 모바일 (기본 스타일) |
| `md` | 768px | 태블릿 |
| `lg` | 1024px | 데스크톱 |
| `xl` | 1280px | 와이드 |

> **모바일 퍼스트 원칙:** 기본 스타일은 모바일 기준으로 작성하고 `md:`, `lg:` 로 확장한다.

---

## 12. 접근성 (Accessibility)

- 모든 인터랙티브 요소에 `focus-visible` 스타일 적용 (`shadow-focus`)
- 색상만으로 상태를 전달하지 않음 — 아이콘 또는 텍스트 병행 사용
- `aria-label` 필수 요소: 아이콘만 있는 버튼 (삭제, 북마크, 닫기)
- 색상 대비비: WCAG AA 기준 (4.5:1 이상) 준수
- `disabled` 상태는 `aria-disabled="true"` + `tabIndex={-1}` 병행 적용

---

## 변경 이력

| 버전 | 날짜 | 변경자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2026-05-14 | Documentation Engineer | 최초 작성 — capture.png 레퍼런스 기반 |
