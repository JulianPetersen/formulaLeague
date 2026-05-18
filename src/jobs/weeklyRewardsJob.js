// cron.js
import cron from "node-cron";
import { processWeeklyRewards } from "../controllers/traficLigth.controller";

// Lunes 00:00
cron.schedule("0 0 * * 1", async () => {
  console.log("Ejecutando premios semanales...");
  await processWeeklyRewards();
});