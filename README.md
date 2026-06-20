# Expenzo — Personal Finance Manager

A full-stack expense tracking application with AI-powered bank statement import, spending insights, and budget management. Built as a portfolio project to demonstrate production-grade backend architecture, data isolation, and performance engineering.

---

## Features

### Core Expense Management
- JWT-authenticated, multi-user expense tracking with full data isolation (every user sees only their own data)
- Add, edit, delete, search, filter, and sort expenses with server-side pagination
- User-scoped categories — each user manages their own category list independently
- Per-category and overall monthly budgets with status tracking (on track / warning / over budget)

### AI-Powered Statement Import
- Upload a PDF bank statement; Google Gemini extracts transactions automatically
- Handles UPI, NEFT, IMPS, RTGS, POS, ECOM, ATM, and other Indian bank transaction formats
- Vendor name normalization for consistent merchant categorization (e.g. "SWIGGY LIMITED", "ECOM/RAZORPAY/SWIGGY" → `swiggy`)
- Multi-model fallback chain (5 Gemini models) with exponential backoff retry on overload
- **Asynchronous job/polling architecture** — long-running Gemini calls don't block the HTTP request, avoiding platform request-timeout limits (e.g. Azure App Service's ~230s cap)
- Duplicate detection against existing expenses before import
- Per-user daily (3/day) and monthly (10/month) import rate limits
- Keyword → category mapping system that learns from user corrections, applied automatically to future imports
- Sensitive data (account numbers, IFSC codes) stripped from statement text before it ever reaches the AI provider

### Insights & Analytics
- Daily burn rate and exponentially-weighted average spending velocity
- Statistical anomaly detection (mean ± 2σ) on transactions
- Subscription/recurring payment detection via gap analysis, with dismiss/restore
- Merchant leaderboard (top spending destinations)
- Weekly "spending DNA" pattern analysis
- Month-over-month category spending delta with trend classification
- Combined summary endpoints — dashboard and insights pages each load in a single API call instead of 4–6 separate requests

### Security & Data Hygiene
- Stateless JWT authentication; BCrypt password hashing
- Response DTOs strip sensitive fields (password hashes, internal user data) from every API response
- All user-facing data queries are scoped by authenticated user — no cross-user data leakage
- Secrets (DB credentials, JWT secret, AI API key) externalized via environment variables, never committed

---

## Tech Stack

**Backend**
- Java 21, Spring Boot 4
- Spring Data JPA / Hibernate (MySQL dialect, JDBC batch inserts via sequence-based ID generation)
- Spring Security + JJWT for stateless authentication
- Apache PDFBox for PDF text extraction
- Google Gemini API (REST, via `RestTemplate`) for transaction extraction
- Virtual threads for async background job processing

**Frontend**
- React 19, Vite, React Router 7
- Tailwind CSS 4
- Recharts for data visualization
- Axios with interceptor-based auth token injection

**Database**
- MySQL (Aiven Cloud / Azure Database for MySQL)

---

## Architecture Highlights

- **Async import pipeline**: `POST /import/parse` returns a job ID immediately (HTTP 202); the actual PDF parsing and Gemini calls run on a virtual thread in the background. The frontend polls `GET /import/status/{jobId}` until the job completes. This avoids platform-imposed HTTP timeout limits on long-running AI calls.
- **Bulk-optimized writes**: Bulk expense import and keyword-mapping save use `SEQUENCE`-based ID generation (`allocationSize=50`) plus Hibernate JDBC batching, collapsing hundreds of individual inserts into a handful of batched round trips.
- **User-scoped everything**: Categories, expenses, and keyword mappings all carry a `User` foreign key and are filtered at the repository level — there is no global/shared data between accounts.
- **Consolidated read endpoints**: Dashboard and Insights pages are each backed by a single combined endpoint (`/expense/dashboardSummary`, `/insights/summary`) that internally composes multiple smaller queries, rather than requiring the frontend to make several round trips.

---

## Project Structure

```
Expense_Manager/
├── expense_manager_backend/    # Spring Boot API
│   └── src/main/java/org/example/expense_manager/
│       ├── Controller/         # REST endpoints
│       ├── Service/            # Business logic
│       ├── Repository/         # Spring Data JPA repositories
│       ├── Entity/             # JPA entities
│       ├── DTO/                # Request/response/service DTOs
│       ├── Security/           # JWT filter, JWT util, security config
│       ├── Exceptions/         # Custom exceptions + global handler
│       └── config/             # CORS, beans
└── expense_manager_frontend/   # React + Vite SPA
    └── src/
        ├── pages/              # Top-level routed views
        ├── components/         # Reusable UI (layout, modals, dashboard widgets)
        ├── context/            # Auth, theme, and shared data context
        ├── services/           # API call wrappers (axios)
        └── utils/              # Formatters
```

---

## Setup

### Prerequisites
- Java 21+, Maven
- Node.js 18+
- A MySQL database (local or cloud)
- A Google Gemini API key

### Backend

1. Copy the example properties file and fill in your own values:
   ```bash
   cp expense_manager_backend/src/main/resources/application.properties.example \
      expense_manager_backend/src/main/resources/application.properties
   ```
2. Set the following (as environment variables in production, or directly in `application.properties` for local dev — this file is gitignored):
   - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
   - `JWT_SECRET`
   - `GEMINI_API_KEY` and the Gemini model URLs
   - `FRONTEND_URL` (for CORS)
3. Run:
   ```bash
   cd expense_manager_backend
   mvn spring-boot:run
   ```

### Frontend

1. Set `VITE_API_BASE_URL` in a `.env` file pointing to your backend (e.g. `http://localhost:8080`)
2. Run:
   ```bash
   cd expense_manager_frontend
   npm install
   npm run dev
   ```

---

## Notes

- This project was built incrementally with a deliberate focus on understanding *why* each backend decision was made (ID generation strategy, batching, async job design, data isolation) rather than just shipping working code.
- Categories must be created before importing a bank statement — Gemini is given the user's exact category list to choose from rather than inventing categories.
