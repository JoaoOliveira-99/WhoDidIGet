/** Dates (pure). */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * "2026-12-24" → "24 de dezembro de 2026" (optionally with the weekday).
 * Builds the date in local time so there are no time-zone shifts.
 * Anything that is not an ISO date is returned unchanged.
 */
export function formatDate(iso, { weekday = false } = {}) {
  const match = ISO_DATE.exec(iso ?? '');
  if (!match) return iso ?? '';
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return iso;

  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  if (weekday) options.weekday = 'long';
  try {
    return date.toLocaleDateString('pt-PT', options);
  } catch {
    return `${day}/${month}/${year}`;
  }
}
