export const formatCurrency = (amount: number): string => `R ${Number(amount).toFixed(2)}`;

export const minutesSince = (createdAt: string, now = Date.now()): number => {
  const start = new Date(createdAt).getTime();
  return Math.floor((now - start) / 60000);
};

export const severityClass = (createdAt: string, now = Date.now()): 'emerald' | 'amber' | 'red' => {
  const mins = minutesSince(createdAt, now);
  if (mins >= 20) return 'red';
  if (mins >= 10) return 'amber';
  return 'emerald';
};
