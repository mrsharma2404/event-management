export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export function inrShort(n: number) {
  if (n >= 10000000) return `₹${+(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${+(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${Math.round(n / 1000)}K`;
  return `₹${n}`;
}

export function formatDate(iso?: string | null, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '—';
  return new Date(iso.length === 10 ? iso + 'T00:00:00' : iso).toLocaleDateString('en-IN', opts);
}

export const discountPercent = (price: number, mrp: number) => Math.round((1 - price / mrp) * 100);

export const isoDate = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

/** Earliest bookable date: 7 days from today. */
export const minEventDate = () => isoDate(new Date(Date.now() + 7 * 864e5));

export const guestLabel = (g: { min: number; max: number }) =>
  g.min === 2 && g.max === 2 ? 'For couples' : `${g.min}–${g.max.toLocaleString('en-IN')} guests`;
