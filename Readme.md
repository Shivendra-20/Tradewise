# 📈 TradeWise — Paper Trading Platform

**TradeWise** is a full-stack **MERN** paper-trading application that lets users practice stock investing with virtual money — realistic order execution, live market data, portfolio tracking, and watchlists, without any financial risk.

A production-style monorepo with a **React + Vite** frontend, an **Express + MongoDB** REST API, and a **WebSocket (Socket.IO)** real-time market-data feed backed by a resilient multi-provider data layer (Upstox → Yahoo Finance fallback).

---

## ✨ Features

### Trading & Accounts
- JWT-authenticated **register / login / logout** with bcrypt password hashing and a protected-route guard
- Virtual ₹1,00,000 starting balance; **buy / sell market & limit orders** with balance and holdings validation
- **Pending orders** with cancel support; full **transaction ledger** (buy/sell with P&L per trade)
- **Portfolio engine**: live net worth, unrealized P&L, per-holding average price & market value

### Market Data
- **Live market feed** via Upstox WebSocket (protobuf), auto-fallback to Yahoo Finance chart API when Upstox is blocked
- **NIFTY 50, SENSEX, BANK NIFTY, FIN NIFTY** index quotes with real-time refresh
- Per-stock **intraday / daily / weekly / monthly charts** (lightweight-charts + recharts)
- **Fundamentals** (Market Cap, P/E, P/B, EPS, Dividend Yield, ROE, Book Value) from Yahoo quoteSummary with cookie+crumb auth
- 2,400+ NSE equities browsable with **server-side search, sector/exchange filters, and sorting**
- Market open/closed status computed from **IST trading hours**

### UI / UX
- Responsive **React 19** SPA with dark/light theme
- Landing page, searchable dashboard, stock detail pages, watchlist, orders, transactions, portfolio
- Interactive charts, animated transitions (Framer Motion), toast notifications

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, Redux Toolkit, React Router 7, lightweight-charts, Recharts, Framer Motion, Lucide, socket.io-client, Axios |
| Backend | Node.js, Express 5, MongoDB (Mongoose 9), JSON Web Tokens, bcryptjs, Socket.IO, protobufjs |
| Market data | Upstox REST + WebSocket (protobuf v3 feed), Yahoo Finance v8 chart API + v10 quoteSummary (cookie+crumb auth) |
| Tooling | ESLint 10 (React Hooks / Refresh rules), Nodemon, Vite |

---

## 🧠 Architecture

```text
                        ┌──────────────────────────────────────────────┐
                        │                 React SPA (Vite)             │
                        │   Dashboard · Markets · Stock · Portfolio    │
                        │   Watchlist · Orders · Transactions          │
                        └───────┬──────────────────────────┬───────────┘
                                │ REST (Axios, JWT)        │ WebSocket
                                ▼                          ▼
                        ┌──────────────────────────────────────────────┐
                        │               Express 5 + Socket.IO          │
                        │   auth · orders · portfolio · watchlist      │
                        │   transactions · stocks · health             │
                        └───────┬──────────────────────────┬───────────┘
                                │                          │
                    ┌───────────▼──────────┐    ┌──────────▼───────────┐
                    │    MongoDB / Mongoose │    │    Market Data Feed  │
                    │  User · Stock · Order │    │  Upstox WebSocket    │
                    │  Portfolio · Tx · WL  │    │  (protobuf)          │
                    └───────────────────────┘    │        │             │
                                                 │  fallback            │
                                                 ▼        ▼             │
                                        ┌───────────────────────────┐   │
                                        │  Yahoo Finance API         │  │
                                        │  v8 chart (quotes/history) │  │
                                        │  v10 quoteSummary (funds)  │  │
                                        └───────────────────────────┘   │
                                                 │                      │
                                                 └── in-memory caches ──┘
```

**Resilience pattern:** every upstream call (Upstox quote/history, WebSocket feed) is wrapped with a **Yahoo Finance fallback** plus layered in-memory caches (index quotes 15s, stock detail 2 min, fundamentals 6 h) and MongoDB write-back of latest prices, so the app keeps working even when the primary broker API is unreachable.

---

## 📁 Project Structure

```text
TradeWise/
├── Frontend/                      # React 19 + Vite SPA
│   ├── public/                    # static assets
│   └── src/
│       ├── api/                   # axios client + API modules (stock, auth, watchlist)
│       ├── components/
│       │   ├── auth/              # login/register layouts
│       │   ├── common/            # Card, Sidebar, SearchModal, ProfileDropdown…
│       │   ├── Dashboard/         # MarketIndices, MarketMovers, PortfolioCard, LiveMarketChart…
│       │   ├── Market/            # StockCard, MarketFilter, MarketHeader…
│       │   ├── Stock/             # StockChart, OrderPanel, StockFundamentals…
│       │   ├── Landing/           # Hero, Feature, FAQ, HowItWorks…
│       │   └── Layout/            # DashboardLayout, Footer
│       ├── context/               # ThemeContext (dark/light)
│       ├── lib/                   # marketTime (IST hours), realtime (useLiveQuote), formatters
│       ├── pages/                 # Landing, Login, Register, Dashboard, Market, Stock,
│       │                          # Portfolio, Watchlist, Orders, Transactions, Profile
│       ├── redux/                 # authSlice + store
│       ├── routes/                # ProtectedRoute
│       ├── App.jsx · main.jsx · index.css
│       └── package.json · vite.config.js · eslint.config.js
│
├── Backend/                       # Express 5 + MongoDB API
│   ├── config/db.js               # Mongoose connection
│   ├── controllers/               # auth, order, portfolio, stock, transaction, watchlist
│   ├── middleware/auth.middleware.js  # JWT verification
│   ├── models/                    # User, Stock, Order, Portfolio, Transaction, Watchlist, StockHistory
│   ├── routes/                    # auth, order, portfolio, stock, transaction, watchlist, health
│   ├── services/
│   │   ├── marketDataFeed.js      # Upstox WebSocket feed (protobuf) → Socket.IO
│   │   ├── upstox.service.js      # Upstox REST (quote/history) + token refresh
│   │   ├── upstoxInstruments.js   # instrument master list + index keys
│   │   ├── yahoo.service.js       # Yahoo chart + quoteSummary fallback (cookie+crumb auth)
│   │   └── MarketDataFeedV3.proto # Upstox feed schema
│   ├── seed/stockSeeder.js        # sample-stock seeder (npm run seed)
│   ├── scripts/importAllStocks.js # bulk import of full NSE master
│   ├── server.js                  # Express + Socket.IO entrypoint
│   └── package.json · .env.example
│
└── Readme.md
```

---

## 🔌 API Reference

Base URL: `http://localhost:5000` — protected routes require `Authorization: Bearer <JWT>`.

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create account (name, email, password) |
| POST | `/login` | Login → JWT token |
| POST | `/logout` | Invalidate session |
| GET | `/profile` | Get logged-in user profile *(protected)* |

### Stocks (`/api/stocks`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List stocks — `search`, `exchange`, `sector`, `symbols`, `sort`, `page`, `limit`, `live` |
| GET | `/search?q=` | Search by symbol or name |
| GET | `/indices` | NIFTY 50 / SENSEX / BANK NIFTY / FIN NIFTY quotes (15 s cache) |
| GET | `/sectors` | Distinct sectors |
| GET | `/live/:symbol` | Real-time quote for one symbol |
| GET | `/history/:symbol?tf=` | OHLCV candles (`1minute`…`month`) |
| GET | `/:symbol` | Stock detail + Yahoo-enriched quote & fundamentals (2 min / 6 h caches) |
| POST | `/import` | Import from Upstox instrument master |

### Trading (`/api/orders`, `/api/portfolio`, `/api/transaction`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orders` | Place buy/sell order (market/limit) *(protected)* |
| GET | `/api/orders` | List my orders *(protected)* |
| PATCH | `/api/orders/cancel/:id` | Cancel a pending order *(protected)* |
| GET | `/api/portfolio` | Net worth, holdings, unrealized P&L *(protected)* |
| GET | `/api/transaction` | Paginated transaction ledger *(protected)* |

### Watchlist (`/api/watchlist`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | My watchlist *(protected)* |
| POST | `/add` | Add stock *(protected)* |
| PATCH | `/note/:id` | Update note *(protected)* |
| DELETE | `/remove/:id` | Remove stock *(protected)* |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Service health check |
| GET | `/` | API root banner |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local `mongod` or MongoDB Atlas)

### 1. Backend
```bash
cd Backend
npm install
cp .env.example .env     # then fill in your values
npm run seed             # optional: seed ~30 sample stocks
npm run dev              # nodemon → http://localhost:5000
```

`.env` configuration (see `.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/tradewise
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Upstox (optional — the app falls back to Yahoo Finance automatically)
UPSTOX_ACCESS_TOKEN=            # Analytics token (valid ~1 year)
UPSTOX_REFRESH_TOKEN=           # optional OAuth auto-refresh
UPSTOX_CLIENT_ID=
UPSTOX_CLIENT_SECRET=
UPSTOX_REDIRECT_URI=
UPSTOX_API_BASE_URL=https://api.upstox.com
```

### 2. Frontend
```bash
cd Frontend
npm install
echo "VITE_API_URI=http://localhost:5000" > .env
npm run dev             # Vite → http://localhost:5173
```

### 3. Use it
Open `http://localhost:5173`, create an account, and you get ₹1,00,000 in virtual cash to start trading.

---

## 🧪 Scripts

| Where | Command | Purpose |
|---|---|---|
| Frontend | `npm run dev` | Start Vite dev server |
| Frontend | `npm run build` | Production build |
| Frontend | `npm run lint` | ESLint across the codebase |
| Backend | `npm run dev` | Start API with nodemon |
| Backend | `npm start` | Start API |
| Backend | `npm run seed` | Seed sample stocks |
| Backend | `node scripts/importAllStocks.js` | Bulk-import full NSE master list |

---

## 🗺️ Roadmap

- [x] Authentication & virtual account
- [x] Paper trading (market/limit orders, cancel)
- [x] Portfolio & P&L tracking
- [x] Watchlist & transaction history
- [x] Live market data with Yahoo fallback
- [x] Index quotes, sectors, fundamentals
- [ ] AI-powered market insights
- [ ] Leaderboard & social trading
- [ ] Email notifications & price alerts
- [ ] Deployment (CI/CD + hosting)

---

## 👨‍💻 Author

**Shivendra Pawaiya**

- GitHub: [https://github.com/Shivendra-20](https://github.com/Shivendra-20)
- LinkedIn: [https://www.linkedin.com/in/shivendra-pawaiya/](https://www.linkedin.com/in/shivendra-pawaiya-879708323/)

---

> ⚠️ **Disclaimer:** This is an educational project. No real money is involved and market data may be delayed or simulated.
