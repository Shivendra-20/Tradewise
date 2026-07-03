# 📈 TradeWise – Paper Trading Platform

TradeWise is a full-stack **MERN** paper trading platform that allows users to practice stock market investing with virtual money. It provides a realistic trading experience without financial risk through features like portfolio management, watchlists, order execution, and transaction tracking.

## 🚀 Features

* 🔐 JWT-based User Authentication
* 💰 Virtual Balance & Paper Trading
* 📊 Portfolio Management
* 📈 Buy & Sell Stock Orders
* 📝 Transaction History
* ⭐ Watchlist Management
* 🔍 Stock Search by Symbol or Company Name
* 📱 Responsive UI built with React & Tailwind CSS
* 📉 Interactive Stock Charts

## 🛠️ Tech Stack

### Frontend

* React.js (Vite)
* Tailwind CSS
* React Router
* Axios
* Redux Toolkit
* React Hot Toast
* TradingView Lightweight Charts
* Recharts
* Framer Motion

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* bcrypt

## 📂 Project Structure

```text
TradeWise/
│
├── client/                 # React Frontend
├── server/                 # Express Backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
│
└── README.md
```

## ⚙️ Installation

### Clone the Repository

```bash
git clone https://github.com/Shivendra-20/TradeWise.git
cd TradeWise
```

### Backend Setup

```bash
cd server
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Start the backend:

```bash
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

## ✨ Current Features

* User Registration & Login
* Secure JWT Authentication
* Portfolio Management
* Virtual Stock Trading
* Order Management
* Transaction History
* Watchlist
* Stock Search
* Responsive Dashboard

## 🔮 Future Enhancements

* Real-time Stock Prices
* AI-powered Market Insights
* Portfolio Analytics
* Market News Integration
* Stock Alerts
* Leaderboard
* Email Notifications

## 👨‍💻 Author

**Shivendra Pawaiya**

* GitHub: https://github.com/Shivendra-20
* LinkedIn: https://www.linkedin.com/in/shivendra-pawaiya/

## ⭐ Support

If you found this project useful, consider giving it a **⭐ Star** on GitHub.
