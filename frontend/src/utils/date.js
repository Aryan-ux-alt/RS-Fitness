export function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }

export function addMonthsToDate(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return d;
}

export function getSubscriptionDays(subscription) {
  if (!subscription?.expiryDate) return 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const expiry = new Date(subscription.expiryDate);
  expiry.setHours(23, 59, 59, 999);
  return Math.max(0, Math.ceil((expiry - todayStart) / 86400000));
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}
