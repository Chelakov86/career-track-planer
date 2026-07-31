export const formatLocalDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getMillisecondsUntilNextLocalMidnight = (date: Date = new Date()): number => {
  const nextMidnight = new Date(date);
  nextMidnight.setHours(24, 0, 0, 0);
  return nextMidnight.getTime() - date.getTime();
};
