import mongoose from "mongoose";
import "dotenv/config";
import Stock from "../models/Stock.js";
import { getInstruments } from "../services/upstoxInstruments.js";

const BATCH_SIZE = 500;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const instruments = await getInstruments(true);

  const equities = instruments.filter(
    (i) => i.segment === "NSE_EQ" && i.instrument_type === "EQ"
  );

  console.log(`Found ${equities.length} NSE equities`);

  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < equities.length; i += BATCH_SIZE) {
    const batch = equities.slice(i, i + BATCH_SIZE);

    const ops = batch.map((instrument) => ({
      updateOne: {
        filter: { symbol: instrument.trading_symbol },
        update: {
          $set: {
            name: instrument.short_name || instrument.name || instrument.trading_symbol,
            exchange: "NSE",
            instrumentKey: instrument.instrument_key,
            isActive: true,
          },
          $setOnInsert: {
            currentPrice: 0,
            previousClose: 0,
            change: 0,
            changePercent: 0,
            sector: "Other",
          },
        },
        upsert: true,
      },
    }));

    const result = await Stock.bulkWrite(ops, { ordered: false });
    inserted += result.upsertedCount || 0;
    updated += result.modifiedCount || 0;

    console.log(
      `batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(equities.length / BATCH_SIZE)} done ` +
        `(upserted so far: ${inserted})`
    );
  }

  const total = await Stock.countDocuments({ isActive: true });
  console.log(`Done. Total active stocks in DB: ${total} (inserted ${inserted}, updated ${updated})`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (error) => {
  console.error("Import failed:", error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
