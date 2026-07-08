import DashboardLayout from "../components/Layout/DashboardLayout.jsx";
import MarketIndices from "../components/Dashboard/MarketIndices.jsx";
import LiveMarketChart from "../components/Dashboard/LiveMarketChart.jsx";
import PortfolioCard from "../components/Dashboard/PortfolioCard.jsx";
import TopMovers from "../components/Dashboard/MarketMovers.jsx";
import PopularStocks from "../components/Dashboard/PopularStocks.jsx";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">

        <MarketIndices />

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_380px]">
          <LiveMarketChart />

          <div className="xl:pt-6">
            <PortfolioCard />
          </div>
        </section>

        <TopMovers />

        <PopularStocks />

      </div>
    </DashboardLayout>
  );
}