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
