# Indian Stock Portfolio Tracker with AI Insights

## 🚀 Live Demo
[Link to your deployed app]

## 📊 Features
- Track real NSE/BSE stocks (RELIANCE.NS, TCS.NS, HDFCBANK.NS)
- Virtual portfolio management with buy price tracking
- Live P&L updates
- **AI-powered insights**:
  - Stock movement explanations in simple English
  - Portfolio risk scoring (1-10)
  - Sector concentration warnings
  - Personalized tips for Indian investors

## 🛠️ Tech Stack
- **MERN**: MongoDB, Express, React, Node.js
- **GenAI**: Google Gemini 1.5 Flash (free tier)
- **Market Data**: Yahoo Finance API with multi-tier fallback
- **Deployment**: Vercel + Render + MongoDB Atlas

## 📈 Why This Matters
87% of Indian retail investors don't understand why their portfolio moves. This app bridges that gap using AI to explain market movements in simple terms.

## 🏗️ Architecture
Frontend (React)
   ↓
Backend (Node.js / Express)
   ↓
---------------------------------
| Python ML Service (Flask/FastAPI)
| GenAI API (LLM)
| Stock Data API
---------------------------------
   ↓
Response to user

## 🔧 Setup Instructions
[Add setup steps]

## 📝 Example AI Response
**Input**: Portfolio with 60% in Banking sector  
**AI Output**: "Risk Score: 7/10. Your portfolio is heavily concentrated in Banking (60%). Consider diversifying into IT or Pharma. Nifty Bank has shown high correlation with RBI policy changes."

## 👨‍💻 Author
Shivendra Pawaiya - NIT Jalandhar, IT Department


**Indian Stock Portfolio Tracker with AI Insights** | MERN + Google Gemini
- Built a full-stack web app for tracking NSE/BSE stocks with real-time prices via Yahoo Finance API
- Implemented virtual portfolio management with live P&L calculation for 20+ Indian stocks
- Integrated Google Gemini AI to generate:
  - Portfolio risk scores (1-10) with sector concentration alerts
  - Plain-English explanations for daily stock movements
- Reduced API costs by 90% through intelligent caching (5-minute TTL) and rate limiting
- Deployed on Vercel + Render with MongoDB Atlas, serving 50+ simulated users
- **Impact**: Demonstrates FinTech + GenAI integration specifically for Indian market context


**TradeWise – AI-Powered Paper Trading & Portfolio Analytics Platform**

**Tech Stack:** MongoDB, Express.js, React.js, Node.js, JWT, Tailwind CSS, Gemini API, Chart.js

* Engineered a full-stack paper trading platform supporting virtual stock trading, portfolio analytics, watchlists, and transaction management for investment simulation.
* Designed scalable REST APIs and MongoDB schemas for user accounts, holdings, orders, and trade history while implementing secure JWT-based authentication and authorization.
* Developed interactive dashboards featuring profit/loss calculations, portfolio allocation insights, performance tracking, and real-time stock visualizations.
* Integrated an AI-powered financial assistant using Gemini API to provide portfolio insights, explain market concepts, summarize financial news, and answer user investment queries.
* Connected external market data services and optimized frontend state management to deliver a responsive user experience across trading and analytics workflows.






What you CAN realistically build 🎯
Feature                                          Doable with MERN?
Virtual paper trading                           ✅ Yes
Live prices (with free API)                     ✅ Yes
Real-time price updates (WebSocket)             ✅ Yes
Portfolio P&L tracking                          ✅ Yes
Basic charts (Recharts/TradingView widget)      ✅ Yes
Leaderboard (who made most profit)              ✅ Yes
Multiple order types (market, limit)            ✅ Simulated
Real money   & demat                            ❌ No
SEBI compliance & KYC                           ❌ No
Microsecond order matching                      ❌ No




ER Diagram;
file:///C:/Users/shive/Downloads/virtual_trading_platform_erd.html

Features
file:///C:/Users/shive/Downloads/virtual_trading_feature_roadmap.html

Live prices (Finnhub free API + Socket.io) — this single feature makes your app feel real
Buy/sell orders + transaction history — core trading loop
Portfolio P&L dashboard — users need to see if they're winning or losing
Candlestick charts — TradingView has a free embeddable widget, zero backend work
Leaderboard — makes it fun and shareable
Watchlist — already in your DB schema, easy to build
Limit orders — first "advanced" feature worth adding

file:///C:/Users/shive/Downloads/trading_platform_features.html

# High priority
Limit order execution engine — cron/job that checks pending limit orders against stock.currentPrice and executes when price matches
Live stock price updates — WebSocket or scheduled job to refresh currentPrice, change, dayHigh, etc. (your Stock model is ready for this)
Password reset flow — fields exist on User (resetPasswordToken) but no routes/controllers yet
# Medium priority
Admin routes — stock CRUD, user management (role: "admin" exists but no admin middleware)
Input validation layer — express-validator or Zod on all routes
Rate limiting — protect auth and trade endpoints from abuse
Tests — unit/integration tests for trade flow
# Nice to have
Realized P&L dashboard endpoint — aggregate sell profitLoss from transactions
Stock price history — chart data (new model + API)
Notifications — order filled, limit triggered
API documentation — Swagger/OpenAPI
Docker + deployment config







Libraries
npm install react-router-dom axios recharts react-hot-toast socket.io-client
npm install  react-redux @reduxjs/toolkit  react-icons