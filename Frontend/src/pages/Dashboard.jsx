import React from 'react'
import { useDispatch } from "react-redux";
import { logout } from "../redux/authSlice.js";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/Layout/DashboardLayout.jsx";
import MarketIndices from '../components/Dashboard/MarketIndices.jsx';
import MarketTiles from '../components/Dashboard/Markettiles.jsx';
import LiveMarketChart from '../components/Dashboard/LiveMarketChart.jsx';
import PortfolioCard from '../components/Dashboard/PortfolioCard.jsx';
import MarketMovers from '../components/Dashboard/MarketMovers.jsx';

export default function Dashboard() {

const dispatch = useDispatch();
const navigate = useNavigate();

const handleLogout = () => {
  dispatch(logout());
  navigate("/login");
};

return (
   <DashboardLayout>

  <MarketTiles />

  <div className="grid grid-cols-12 gap-6 mt-8">

    <div className="col-span-8">

      <LiveMarketChart />

    </div>

    <div className="col-span-4">

      <PortfolioCard />

    </div>

  </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <MarketMovers type="gainers" />
      < MarketMovers type="losers" />
    </div>
</DashboardLayout>
  );
}