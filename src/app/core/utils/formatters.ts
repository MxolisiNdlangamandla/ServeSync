export const formatCurrency = (amount: number): string => `R ${Number(amount).toFixed(2)}`;

export const minutesSince = (createdAt: string): number => {
  const start = new Date(createdAt).getTime();
  return Math.floor((Date.now() - start) / 60000);
};

export const severityClass = (createdAt: string): 'emerald' | 'amber' | 'red' => {
  const mins = minutesSince(createdAt);
  if (mins >= 20) return 'red';
  if (mins >= 10) return 'amber';
  return 'emerald';
};
