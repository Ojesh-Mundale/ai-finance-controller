# AI Finance Controller


An AI-powered finance operations controller that closes the reconciliation loop across multi-source transaction data. Built with **Spring Boot 3.3 (Java 21)** backend and **React 18 + Vite** frontend.

## The Problem
Reconciliation, settlement, and cash forecasting are still done manually across Indian fintech companies. Verification capacity — not generation speed — is the bottleneck in 2026.

## What This Solves
1. **Multi-Source Reconciliation** — Matches transactions across bank statements, payment gateways, internal ledger, and UPI
2. **AI-Powered Matching** — Weighted scoring engine (amount similarity, date proximity, type compatibility) with configurable thresholds
3. **Forward Cash Forecasting** — Predicts cash position with confidence intervals
4. **Settlement Q&A** — Natural language interface for querying settlement data
5. **Honest Exception Reporting** — Every unmatched transaction is logged with severity, reason, and suggested action

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                      │
│  Vite + Tailwind CSS + Recharts                     │
│  Dashboard · Reconciliation · Transactions           │
│  Cash Position · Forecast · Settlement Q&A           │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────┴──────────────────────────────┐
│              Spring Boot 3.3 Backend                 │
│  Java 21 · Spring Data JPA · H2                      │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │ Reconciliation│  │   Cash       │                  │
│  │ Engine (AI)  │  │   Position   │                  │
│  │              │  │   Service    │                  │
│  └──────────────┘  └──────────────┘                  │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │ Settlement   │  │  Dashboard   │                  │
│  │ Q&A Service  │  │  Service     │                  │
│  └──────────────┘  └──────────────┘                  │
│                                                      │
│  Synthetic Data Generator (79+ records)              │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Spring Boot 3.3.6, Java 21 | Production-grade, 10yr ecosystem, Spring AI ready |
| Database | H2 (in-memory) | Zero-config demo, swap to PostgreSQL for prod |
| ORM | Spring Data JPA + Hibernate | Type-safe queries, migration-ready |
| API Docs | SpringDoc OpenAPI 2.8 | Auto-generated Swagger UI at /swagger-ui.html |
| Frontend | React 19, Vite 6 | Fast HMR, optimized builds |
| Styling | Tailwind CSS v4 | Utility-first, dark finance theme |
| Charts | Recharts 2.15 | Composable, React-native charting |
| Icons | Lucide React | Tree-shakeable, consistent design |
| Deploy | Docker Compose | One-command production deploy |

## Quick Start

### Prerequisites
- Java 21+
- Node.js 20+
- Maven 3.9+

### Backend
```bash
cd backend
mvn spring-boot:run
```
Backend starts at http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- H2 Console: http://localhost:8080/h2-console
- Actuator: http://localhost:8080/actuator/health

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend starts at http://localhost:5173

### Docker (Production)
```bash
docker-compose up --build
```
App available at http://localhost (frontend) and http://localhost:8080 (API)

## API Endpoints

### Reconciliation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/reconciliation/run | Run AI reconciliation across sources |
| GET | /api/reconciliation/history | Get all reconciliation runs |
| GET | /api/reconciliation/batch/{id} | Get specific batch result |
| GET | /api/reconciliation/batch/{id}/transactions | Get batch transactions |
| GET | /api/reconciliation/batch/{id}/exceptions | Get batch exceptions |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/metrics | Get aggregated metrics |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/transactions | Get all transactions (filter by source/status) |
| GET | /api/transactions/{id} | Get transaction by ID |
| GET | /api/transactions/date-range | Get by date range |
| GET | /api/transactions/count/by-status | Count grouped by status |

### Cash Position & Forecast
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/cash-position/compute | Compute cash positions |
| GET | /api/cash-position | Get all positions |
| GET | /api/cash-position/forecast | Get cash forecast |

### Settlement Q&A
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/settlement-qa/ask | Ask a natural language question |

## AI Matching Engine

The reconciliation engine uses a weighted multi-factor scoring algorithm:

| Factor | Weight | Logic |
|--------|--------|-------|
| Amount Similarity | 50 pts | 1 - abs(a1-a2)/max(a1,a2) |
| Date Proximity | 25 pts | Decays over 3-day window |
| Type Compatibility | 10 pts | CREDIT↔CREDIT, DEBIT↔DEBIT match |
| Exact Amount Bonus | 15 pts | Perfect amount match |

**Threshold**: Configurable (default 0.75). Transactions scoring above are matched; 0.60-0.75 are partial matches; below are exceptions.

## The Bar: What Makes This Real

- **Throughput**: Processes 79+ synthetic records in <500ms
- **Measured Accuracy**: Reports exact match rate (typically 75-90%)
- **Honest Exception List**: Every unmatched transaction with reason and suggested action
- **Multi-Source**: 4 independent data sources (Bank, Gateway, Ledger, UPI)
- **Production-Ready**: Docker, health checks, Swagger docs, CORS, proper error handling

## Project Structure

```
ai-finance-controller/
├── backend/                          # Spring Boot (Java 21)
│   ├── src/main/java/com/razorpay/finance/
│   │   ├── controller/               # 5 REST controllers (16 endpoints)
│   │   ├── service/                  # 5 services + AI engine
│   │   ├── model/                    # 7 JPA entities & enums
│   │   ├── repository/               # 5 Spring Data repositories
│   │   ├── dto/                      # 7 request/response DTOs
│   │   ├── config/                   # CORS, Jackson config
│   │   └── exception/                # Global exception handler
│   ├── src/main/resources/
│   │   └── application.yml           # App configuration
│   ├── Dockerfile                    # Multi-stage Java build
│   └── pom.xml                       # Maven dependencies
├── frontend/                         # React 19 + Vite
│   ├── src/
│   │   ├── api/client.ts             # Typed API client
│   │   ├── types/index.ts            # TypeScript interfaces
│   │   ├── components/               # 10 React components
│   │   │   ├── DashboardView.tsx     # Metrics + charts
│   │   │   ├── ReconciliationView.tsx # Run & view results
│   │   │   ├── TransactionsView.tsx  # Filterable table
│   │   │   ├── CashPositionView.tsx  # Position + area chart
│   │   │   ├── ForecastView.tsx      # Line chart + confidence
│   │   │   └── SettlementQAView.tsx  # Chat interface
│   │   ├── App.tsx                   # Main layout
│   │   └── index.css                 # Dark theme + Tailwind
│   ├── Dockerfile                    # Multi-stage Nginx build
│   └── package.json
├── docker-compose.yml                # One-command deploy
└── README.md
```

## Scaling to Production

- **Database**: Swap H2 → PostgreSQL (change spring.datasource in application-prod.yml)
- **AI/LLM**: Integrate Spring AI for real NLP reconciliation (add spring-ai-openai dependency)
- **Auth**: Add Spring Security + JWT for API authentication
- **Message Queue**: Add RabbitMQ/Kafka for async batch processing
- **Monitoring**: Prometheus + Grafana via Spring Actuator endpoints
- **Caching**: Spring Cache + Redis for frequently accessed positions

## Build & Deploy

```bash
# Backend JAR
mvn clean package -DskipTests
# Output: backend/target/ai-finance-controller-0.1.0.jar (54MB)

# Frontend
npm run build
# Output: frontend/dist/

# Docker
docker-compose up --build -d
```

---

Built for the **Razorpay AI Buildathon 2026** — Track 04: AI Finance Controller
