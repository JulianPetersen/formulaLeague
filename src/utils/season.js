import SeasonResult from '../models/seasonResult.model';
import User from '../models/user.model';
import { saveLog } from './logs';

export const closeSeasonForPrize = async (prize) => {
  if (!prize || prize.status !== 'cerrado' || !prize.winner) {
    return null;
  }

  const existingResult = await SeasonResult.findOne({ prize: prize._id });

  if (existingResult) {
    if (!existingResult.pointsResetAt) {
      await User.updateMany({}, { $set: { points: 0 } });

      existingResult.pointsResetAt = new Date();
      await existingResult.save();

      await saveLog({
        type: 'SEASON-POINTS-RESET',
        message: `Puntos reiniciados para temporada ya cerrada del premio ${prize._id}`,
        user: prize.winner,
        status: 'INFO'
      });
    }

    return existingResult;
  }

  const ranking = await User.find()
    .sort({ points: -1, createdAt: 1 })
    .select('_id username email points');

  const winnerSnapshot = ranking.find(
    (user) => String(user._id) === String(prize.winner)
  );

  const result = await SeasonResult.create({
    prize: prize._id,
    winner: prize.winner,
    winnerPoints: winnerSnapshot?.points || 0,
    rankingSnapshot: ranking.map((user, index) => ({
      user: user._id,
      username: user.username,
      email: user.email,
      points: user.points || 0,
      position: index + 1
    })),
    closedAt: new Date()
  });

  await User.updateMany({}, { $set: { points: 0 } });

  result.pointsResetAt = new Date();
  await result.save();

  await saveLog({
    type: 'SEASON-CLOSED',
    message: `Temporada cerrada para premio ${prize._id}. Puntos reiniciados para ${ranking.length} usuarios`,
    user: prize.winner,
    status: 'INFO'
  });

  return result;
};
