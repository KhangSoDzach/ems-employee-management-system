/**
 * Helper function to calculate working days (excluding Sat/Sun)
 */
export const calculateWorkingDays = (start: Date, end: Date): number => {
  if (!start || !end || start > end) {
    return 0;
  }
  let count = 0;
  const current = new Date(start);
  // Ensure we are working with just dates, no time-zone shift issues if possible
  // but for simple day counting, current iteration is fine.
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};
