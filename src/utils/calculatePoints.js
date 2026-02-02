const calculatePoints = (predictionPositions, raceResult) => {
  let points = 0;

  const resultMap = new Map();
  raceResult.forEach(r =>
    resultMap.set(String(r.pilot), r.position)
  );

  for (const p of predictionPositions) {
    const realPosition = resultMap.get(String(p.pilot));
    if (realPosition === p.position) {
      points += 1;
    }
  }

  return points;
};

export default calculatePoints;