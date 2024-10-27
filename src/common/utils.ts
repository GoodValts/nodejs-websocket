export const generateId = () => {
  const chars = '123456789';

  const arr = Array.from({ length: 8 }).map(
    () => chars[Math.floor(Math.random() * chars.length)],
  );

  return parseInt(arr.join(''));
};
