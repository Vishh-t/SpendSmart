# Expenzo (Expense Manager)

Full-stack personal finance app: JWT auth, expenses/categories/budgets, AI bank-statement import (Gemini), insights.
**Detailed architecture, endpoints, entities and agent recipes: `expense_manager_backend/AGENT.md`** — read it before structural changes.

## Layout
- `expense_manager_backend/` — Spring Boot 4.0, Java 21, Data JPA (**MySQL**), Security + JJWT, Bucket4j, Caffeine cache, PDFBox. Package `org.example.expense_manager` (`Controller`, `Service`, `Repository`, `Entity`, `DTO/ControllerDTOs|ServiceDTOs`, `Security`, `Exceptions`, `config`).
- `expense_manager_frontend/` — React 19 + Vite, React Router, Tailwind 4, Recharts, axios (`src/services/api.js` adds the Bearer token and redirects to `/login` on 401).
- `website_designs/DESIGN.md` — UI design reference.
- `.github/workflows/deploy.yml` — CI/CD.

## Commands
- Backend (in `expense_manager_backend/`): compile `./mvnw -q compile`, test `./mvnw -q test` (PowerShell: `.\mvnw.cmd ...`).
- Frontend (in `expense_manager_frontend/`): `npm run build`, `npm run lint`. No frontend tests exist.

## Rules
- **User-scoping is mandatory**: every query filters by the authenticated `User`; take the user from `SecurityContextHolder`, never from the request.
- After any expense/category mutation call `summaryService.evictUserCaches(userId)`.
- Throw custom exceptions (`NotFoundException`, …); `GlobalExceptionHandler` maps them. Error bodies are **plain strings**, not JSON — the frontend reads `err.response.data.message`, so keep both sides consistent when touching errors.
- Keep frontend validation in sync with backend DTO constraints (e.g. `AddExpenseDTO.amount` is `@Min(1)`).
- Schema is managed by `ddl-auto=update` (no migrations) — be careful renaming/removing entity fields.

## Gotchas
- ⚠️ **Pushing to `main` auto-deploys the backend to EC2** (`deploy.yml`, built with `-DskipTests`). Work on a branch; never push to `main` without explicit approval.
- Frontend deploys on Vercel (`vercel.json`).
- Secrets: `application.properties` values and `expense_manager_frontend/.env` must never be printed or committed; use env vars.
- Only one backend test (`ExpenseManagerApplicationTests`) — add service/controller tests with changes.
