const getWeekId = () => {
  const now = new Date();
  const year = now.getFullYear();

  const firstDay = new Date(year, 0, 1);
  const days = Math.floor((now - firstDay) / (24 * 60 * 60 * 1000));

  const week = Math.ceil((days + firstDay.getDay() + 1) / 7);

  return `${year}-W${week}`;
};

export default getWeekId;