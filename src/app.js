import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import teamRoutes from "./routes/teams.routes";
import pilotRoutes from "./routes/pilot.routes";
import raceRoutes from "./routes/race.routes";
import predictionRoutes from "./routes/prediction.routes"

const app = express();
var path = require('path')
app.use(cors());
app.use(express.json());

app.use('/public', express.static(path.join(__dirname, 'storage/imgs')))


app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/pilot", pilotRoutes);
app.use("/api/race", raceRoutes);
app.use("/api/prediction", predictionRoutes);

export default app;
 