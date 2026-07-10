import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import teamRoutes from "./routes/teams.routes";
import pilotRoutes from "./routes/pilot.routes";
import raceRoutes from "./routes/race.routes";
import predictionRoutes from "./routes/prediction.routes"
import trackRoutes from './routes/track.routes'
import userRoutes from './routes/users.routes'
import prizeRoutes from './routes/prize.routes'
import blogRoutes from './routes/blog.routes'
import pushRoutes from './routes/pushRoutes.routes'
import trafficLightGameRoutes from "./routes/traficLigthGame.routes";
import versionAppRoutes from './routes/versionApp.routes.js'
import pushNotificaion from './routes/pushNotification.routes.js'
import rewardedAdd from './routes/rewards.routes.js'
import visitsPageRoutes from './routes/visitsPage.routes.js'
import walletRoutes from './routes/wallet.routes.js'
import reflexGameRoutes from './routes/reflexGame.routes.js'


import "./jobs/weeklyRewardsJob.js"


import admin from 'firebase-admin';
import serviceAccount from './firebase-key.json';

const app = express();
var path = require('path')
app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'storage/imgs')))


app.get('/', (req,res)=> {
  res.json({
      name: 'formulaLeague',
      version: '0.0.1'
  })
})


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/pilot", pilotRoutes);
app.use("/api/race", raceRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/track", trackRoutes)
app.use("/api/user", userRoutes)
app.use("/api/prize", prizeRoutes)
app.use("/api/blog", blogRoutes)
app.use("/api/push-notification", pushRoutes)
app.use("/api/trafficLightGameRoutes", trafficLightGameRoutes)
app.use("/api/versionApp", versionAppRoutes)
app.use("/api/pushnotification", pushNotificaion)
app.use("/api/reward-ad", rewardedAdd)
app.use("/api/visitspage", visitsPageRoutes)
app.use("/api/wallet", walletRoutes)
app.use("/api/reflexGame", reflexGameRoutes)

export default app;
 
