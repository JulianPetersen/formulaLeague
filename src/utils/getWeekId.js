export const getWeekId = (date = new Date()) => {
  const year = date.getFullYear();

  const firstDay = new Date(year, 0, 1);
  const days = Math.floor((date - firstDay) / (24 * 60 * 60 * 1000));

  const week = Math.ceil((days + firstDay.getDay() + 1) / 7);

  return `${year}-W${week}`;
};

export const getPreviousWeekId = () => {
  const now = new Date();

  now.setDate(now.getDate() - 7);

  return getWeekId(now);
};