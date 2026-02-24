import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import teamRoutes from "./routes/teams.routes";
import pilotRoutes from "./routes/pilot.routes";
import raceRoutes from "./routes/race.routes";
import predictionRoutes from "./routes/prediction.routes"
import trackRoutes from './routes/track.routes'
import userRoutes from './routes/users.routes'

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
app.use("/api/track", trackRoutes)
app.use("/api/user", userRoutes)

export default app;
 