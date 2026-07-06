import { marketIndices } from "../constants/Marketdata.js";
import MiniChart from "./MiniChart.jsx";

export default function MarketTiles() {

return (

<section>

<div className="flex justify-between items-center mb-6">

<div>

<h2 className="text-3xl font-bold">

Market Overview

</h2>

<p className="text-gray-500">

Indian Indices

</p>

</div>

</div>

<div className="grid lg:grid-cols-5 gap-5">

{marketIndices.map((market)=>(

<div

key={market.id}

className="group rounded-3xl border border-zinc-800 bg-[#111111] p-6 hover:border-green-500 transition-all duration-300 hover:-translate-y-1"

>

<div className="flex justify-between">

<h3 className="text-gray-400">

{market.symbol}

</h3>

<span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">

{market.status}

</span>

</div>

<h1 className="text-3xl font-bold mt-4">

{market.value}

</h1>

<p

className={`mt-2 font-semibold ${

market.positive

?

"text-green-400"

:

"text-red-400"

}`}

>

{market.change}

({market.percent})

</p>

<MiniChart

positive={market.positive}

/>

</div>

))}

</div>

</section>

);

}