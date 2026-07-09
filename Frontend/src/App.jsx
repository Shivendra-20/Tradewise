import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Markets from "./pages/Market.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Profile from "./pages/Profile.jsx";
import Watchlist from "./pages/Watchlist.jsx";
import Stock from "./pages/Stock.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Orders from "./pages/Orders.jsx"
import Transactions from "./pages/Transactions.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/markets"
        element={
          <ProtectedRoute>
            <Markets />
          </ProtectedRoute>
        }
      />

      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <Portfolio />
          </ProtectedRoute>
        }
      />

      <Route
        path="/watchlist"
        element={
          <ProtectedRoute>
            <Watchlist />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/stock/:symbol"
        element={
          <ProtectedRoute>
            <Stock />
          </ProtectedRoute>
        }
      />
      <Route path="/orders" element={<Orders />} />
      <Route path="/transactions" element={<Transactions />} />
    </Routes>
  );
}

export default App;