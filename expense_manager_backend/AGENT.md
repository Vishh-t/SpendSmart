# Expenzo (Expense Manager) — Agent Context

## Project Overview
Full-stack personal finance manager with **AI-powered bank statement import**, **spending insights**, and **budget management**. Production-grade backend architecture demonstrating data isolation, async job processing, and performance engineering.

**Tech Stack**
- **Backend**: Java 21, Spring Boot 4, Spring Data JPA, Spring Security + JJWT, MySQL (Aiven/Azure)
- **Frontend**: React 19, Vite, React Router 7, Tailwind CSS 4, Recharts, Axios
- **AI**: Google Gemini API (5-model fallback chain) via RestTemplate
- **PDF**: Apache PDFBox for text extraction
- **Auth**: Stateless JWT, BCrypt password hashing
- **Caching**: Caffeine (2-min TTL)
- **Rate Limiting**: Bucket4j (5 req/min per IP on auth endpoints)

---

## Backend Structure (`expense_manager_backend`)

### Package: `org.example.expense_manager`

### Entities (5)
| Entity | Table | Key Fields |
|--------|-------|------------|
| `User` | `users` | `userId`, `username`, `email`, `password`, `monthlyBudget` (default 5000), `googleId`, `importCountToday`, `importCountMonth`, `lastImportDate` |
| `Category` | `categories` | `categoryId`, `categoryName`, `user` (FK), `monthlyBudget` |
| `Expense` | `expenses` | `expenseId`, `user` (FK), `category` (FK), `amount`, `description`, `keyword`, `expenseTimestamp` |
| `UserCategoryMapping` | `user_category_mappings` | `id`, `user` (FK), `keyword`, `category` (FK) |
| `DismissedSubscription` | `dismissed_subscriptions` | `id`, `user` (FK), `keyword` |

**ID Generation**: Sequence-based with `allocationSize=50` (Category: 20, Expense: 50, Mapping: 50) + Hibernate JDBC batching (`batch_size=50`, `order_inserts/updates=true`)

### Repositories (5) — All extend `JpaRepository`
- `UserRepo` — `findByUsername`, `findByEmail`, `findByGoogleId`, exists checks
- `CategoryRepo` — `findAllByUser`, `findByCategoryNameAndUser`, `findByCategoryIdAndUser`
- `ExpenseRepo` — user-scoped queries, pagination, date ranges, keyword search, filtered search with custom `@Query`
- `UserCategoryMappingRepo` — `findAllByUser`, `existsByKeywordAndUser`
- `DismissedSubscriptionRepo` — `findAllByUser`, `findByUserAndKeyword`, `existsByUserAndKeyword`

### Services (8)
| Service | Key Responsibilities |
|---------|---------------------|
| `UserService` | Signup, login (BCrypt + JWT), budget update, user info, delete |
| `CategoryService` | CRUD categories, budget setting, category budget status (current month) |
| `ExpenseService` | CRUD expenses, bulk add, monthly/annual/financial summaries, pagination, keyword rename, dashboard summary |
| `SummaryService` | **@Cached** heavy aggregations: `financialSummary`, `budgetStatus`, `annualSummary`, `dashboardSummary` + `evictUserCaches(userId)` |
| `ImportService` | **Core AI feature** — PDF → text (PDFBox) → Gemini API (5-model fallback + exponential backoff retry) → parse JSON → apply user mappings → dedupe → async job via virtual threads (`Thread.ofVirtual()`) |
| `ImportJobStore` | In-memory `ConcurrentHashMap<String, ImportJobStatusDTO>` for job status (PROCESSING/DONE/FAILED) |
| `InsightsService` | Anomaly detection (2σ), merchant leaderboard, subscription tracker (gap analysis 25-35 days + CV < 10%), weekly DNA, burn rate (EWMA α=0.3), monthly delta |
| `GoogleAuthService` | OAuth2 code exchange, link/create user, generate JWT |

### Controllers (5)
| Controller | Base Path | Key Endpoints |
|------------|-----------|---------------|
| `UserController` | `/users` | `POST /signUp`, `POST /login`, `PUT /budget`, `GET /`, `DELETE /`, `POST /auth/google` |
| `CategoryController` | `/category` | `POST /add`, `GET /`, `GET /{id}`, `DELETE /{id}`, `PATCH /{id}/budget`, `GET /categoryBudgetSummary` |
| `ExpenseController` | `/expense` | CRUD, `GET /summary`, `GET /annualSummary`, `GET /budgetStatus`, `GET /financialSummary`, `POST /bulk`, `PATCH /renameKeyword`, `GET /byKeyword`, paginated/filtered, `GET /dashboardSummary` |
| `ImportController` | `/import` | `POST /parse` (returns jobId, 202), `GET /status/{jobId}`, `POST /saveMapping`, `POST /saveMappingsBulk` |
| `InsightsController` | `/insights` | `GET /anomalyDetector`, `GET /merchantLeaderboard`, `GET /subscriptionTracker`, `POST/DELETE /dismissSubscription`, `GET /weeklyDNA`, `GET /dailyBurnRate`, `GET /monthlyDelta`, `GET /summary` |

### DTOs
**ControllerDTOs (7)**: `AddExpenseDTO`, `BulkExpenseItemDTO`, `KeywordMappingDTO`, `LoginAndSignUpResponseDTO`, `LoginDTO`, `SignUpDTO`, `UpdateExpenseDTO`

**ServiceDTOs (16)**: `AnnualSummaryDTO`, `AnomalyDTO`, `BudgetStatusDTO`, `BurnRateDTO`, `CategoryBudgetStatusDTO`, `CategorySummaryDTO`, `DashboardSummaryDTO`, `ExpenseResponseDTO`, `FinancialSummaryDTO`, `ImportJobStatusDTO`, `InsightsSummaryDTO`, `MerchantDTO`, `MonthlyDeltaDTO`, `MonthlySummaryDTO`, `ParsedTransactionDTO`, `RecurringExpenseDTO`, `WeeklyDNADTO`

### Exceptions
Custom exceptions extending `AppException` (RuntimeException): `AlreadyExistsException`, `InvalidCredentialsException`, `InvalidFieldNameException`, `NotFoundException`, `UnauthorizedUserException`
- `GlobalExceptionHandler` — maps to HTTP 400/401/403/404/409/500

### Security
- `SecurityConfig` — permitAll for `/users/signUp`, `/users/login`, `/users/auth/google`; JWT filter + RateLimitFilter
- `JwtFilter` — OncePerRequestFilter, extracts Bearer token, validates via `JwtUtil`, sets `UsernamePasswordAuthenticationToken`
- `JwtUtil` — HS256, 7-day expiry, secret from env
- `RateLimitFilter` — Bucket4j, 5 req/min per IP on `/users/login` and `/users/signUp`

### Config
- `AppConfig` — BCryptPasswordEncoder, CORS (frontend URL from env), RestTemplate beans
- `CacheConfig` — CaffeineCacheManager for `financialSummary`, `budgetStatus`, `dashboardSummary` (2-min TTL, max 500)

---

## Frontend Structure (`expense_manager_frontend`)

### Routes (`App.jsx`)
- Lazy-loaded pages with `Suspense` + spinner
- Protected via `ProtectedRoute` (checks AuthContext)
- Routes: `/login`, `/dashboard`, `/expenses`, `/categories`, `/insights`, `/profile`

### Pages (6)
- `LoginPage.jsx` — Email/password + Google OAuth
- `DashBoard.jsx` — Financial summary, budget status, recent expenses, charts
- `ExpensesPage.jsx` — CRUD, pagination, filtering, sorting, bulk import
- `CategoriesPage.jsx` — CRUD categories, budget per category
- `InsightsPage.jsx` — Anomalies, merchant leaderboard, subscriptions, weekly DNA, burn rate, monthly delta
- `ProfilePage.jsx` — User info, budget settings, account deletion

### Context
- `AuthContext` — JWT token, user, login/logout, token persistence
- `DataContext` — Shared categories, expenses
- `ThemeContext` — Dark/light mode

### Services (axios wrappers)
- `api.js` — Base axios instance with interceptor for auth header
- `authService.js` — signup, login, googleAuth, getUserInfo, updateBudget, deleteUser
- `categoryService.js` — CRUD categories, budget status
- `expenseService.js` — CRUD expenses, summaries, bulk, pagination, keywords
- `importService.js` — parse (polling), saveMapping, saveMappingsBulk
- `insightsService.js` — All insights endpoints
- `userService.js` — User profile operations

---

## Key Architectural Patterns

### 1. Async Import Pipeline
```
POST /import/parse (multipart PDF + includeCredits)
  → Returns jobId immediately (HTTP 202)
  → Background: Virtual thread → PDFBox text extraction → Strip sensitive data → Gemini API (5-model fallback + retry) → Parse JSON → Apply user keyword mappings → Dedupe against existing expenses → Store result in ImportJobStore
GET /import/status/{jobId} (polling)
  → Returns PROCESSING/DONE/FAILED + parsed transactions
POST /import/saveMappingsBulk (user confirms mappings)
  → Bulk creates UserCategoryMapping entries
```
**Why**: Avoids platform HTTP timeout limits (Azure ~230s)

### 2. Bulk-Optimized Writes
- Sequence-based ID generation (`allocationSize=50`)
- Hibernate JDBC batching (`spring.jpa.properties.hibernate.jdbc.batch_size=50`, `order_inserts/updates=true`)
- `repo.saveAll(list)` for bulk expenses/mappings

### 3. User-Scoped Everything
- Every entity has `User` FK
- All repository queries filtered by authenticated user
- No cross-user data leakage possible

### 4. Consolidated Read Endpoints
- `GET /expense/dashboardSummary` → FinancialSummary + BudgetStatus + AnnualSummary + Recent 5 expenses (1 call)
- `GET /insights/summary` → BurnRate + Anomalies + MerchantLeaderboard + Subscriptions + WeeklyDNA + MonthlyDelta (1 call)

### 5. AI Prompt Engineering (ImportService)
- Detailed system prompt with vendor normalization rules (lowercase, remove bank names/IDs/locations/suffixes)
- Category mapping: Gemini given user's exact category list (ID + name)
- Confidence scoring (90+ for known merchants, <60 for unknown)
- Debit/credit filtering via `includeCredits` param
- Handles fragmented PDF text (PhonePe, AU Bank formats)
- Verification step: scan for all ₹ amounts, ensure each has JSON entry

### 6. Security Hygiene
- Secrets via env vars (`application.properties` uses `${VAR:default}`)
- JWT stateless, 7-day expiry
- BCrypt password encoding
- Response DTOs strip sensitive fields (password, internal IDs)
- Rate limiting on auth endpoints (per IP)
- CORS restricted to frontend URL

---

## Configuration (Backend)

**Required Environment Variables** (set in `application.properties` or env):
```
DB_URL=jdbc:mysql://host:3306/db
DB_USERNAME=root
DB_PASSWORD=***
JWT_SECRET=*** (min 256-bit for HS256)
GEMINI_API_KEY=***
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent
GEMINI_API_FALLBACK1_URL=... (4 fallback models configured)
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***
```

**application.properties** — gitignored, copy from `application.properties.example`

---

## Running the Project

### Backend
```bash
cd expense_manager_backend
cp src/main/resources/application.properties.example src/main/resources/application.properties
# Edit application.properties with your values OR set env vars
mvn spring-boot:run
# Runs on http://localhost:8080
```

### Frontend
```bash
cd expense_manager_frontend
# Create .env with:
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your_google_client_id
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Common Agent Tasks

### Add New Endpoint
1. Add DTO in `DTO/ControllerDTOs/` or `DTO/ServiceDTOs/`
2. Add repository method in relevant `Repository/`
3. Add business logic in `Service/`
4. Add endpoint in `Controller/`
5. Add frontend service call in `src/services/`
6. Use in page/component

### Add New Entity
1. Create Entity class in `Entity/` with JPA annotations
2. Create Repository extending `JpaRepository`
3. Add to `User` if user-scoped (FK + `@OnDelete(action = OnDeleteAction.CASCADE)`)
4. Run migration (ddl-auto=update handles schema)

### Modify Auth
- JWT: `JwtUtil` (token generation/validation), `JwtFilter` (filter chain)
- Rate limiting: `RateLimitFilter` (adjust `MAX_ATTEMPTS`, `WINDOW`)
- Permissions: `SecurityConfig` (modify `authorizeHttpRequests`)

### Add Caching
- Annotate service method with `@Cacheable(value="cacheName", key="#user.userId")`
- Add cache name to `CacheConfig` CaffeineCacheManager
- Evict via `@CacheEvict` in mutating operations (see `SummaryService.evictUserCaches`)

### Modify Import Pipeline
- Prompt: `ImportService.GEMINI_PROMPT` (lines 72-272)
- Fallback models: `ImportService.callGeminiWithFallback` (lines 352-387)
- Retry config: `MAX_RETRIES=3`, `INITIAL_DELAY=3000L`
- Rate limits: `ImportService.parseStatement` (lines 589-627) — daily 3, monthly 10

---

## File Map (Key Files)

```
expense_manager_backend/
├── src/main/java/org/example/expense_manager/
│   ├── ExpenseManagerApplication.java
│   ├── config/
│   │   ├── AppConfig.java
│   │   └── CacheConfig.java
│   ├── Controller/
│   │   ├── CategoryController.java
│   │   ├── ExpenseController.java
│   │   ├── ImportController.java
│   │   ├── InsightsController.java
│   │   └── UserController.java
│   ├── DTO/
│   │   ├── ControllerDTOs/ (7 files)
│   │   └── ServiceDTOs/ (16 files)
│   ├── Entity/
│   │   ├── Category.java
│   │   ├── DismissedSubscription.java
│   │   ├── Expense.java
│   │   ├── User.java
│   │   └── UserCategoryMapping.java
│   ├── Exceptions/ (7 files + GlobalExceptionHandler)
│   ├── Repository/ (5 files)
│   ├── Security/
│   │   ├── JwtFilter.java
│   │   ├── JwtUtil.java
│   │   ├── RateLimitFilter.java
│   │   └── SecurityConfig.java
│   └── Service/ (8 files)
├── src/main/resources/
│   └── application.properties
└── pom.xml

expense_manager_frontend/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── pages/ (6 files)
│   ├── components/
│   │   ├── layout/ (Layout, ProtectedRoute)
│   │   ├── categories/, dashboard/, expenses/, modals/, ui/
│   ├── context/ (AuthContext, DataContext, ThemeContext)
│   ├── services/ (7 axios wrappers)
│   └── utils/ (formatCurrency, formatDate)
├── package.json
├── vite.config.js
└── .env (gitignored)
```

---

## Notes for Agents
- **Never commit secrets** — all sensitive values via env vars
- **User-scoping is mandatory** — every new query must filter by authenticated user
- **Use consolidated endpoints** — prefer `/expense/dashboardSummary` over multiple calls
- **Async for long operations** — use virtual threads (`Thread.ofVirtual()`) for background jobs
- **Batch writes** — use `saveAll` + sequence ID generation for bulk inserts
- **Cache invalidation** — call `summaryService.evictUserCaches(userId)` after any expense/category mutation
- **DTO pattern** — ControllerDTOs for requests/responses, ServiceDTOs for internal service returns
- **Exception handling** — throw custom exceptions, let `GlobalExceptionHandler` map to HTTP codes