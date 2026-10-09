/**
 * Dates without a time (like "ready by") are stored as UTC midnight, so they
 * are written and read in UTC. Otherwise Argentina (UTC-3) shows the day before.
 */

/** @description YYYY-MM-DD, the format the API and `<input type="date">` use */
export function toDateOnly(date: Date) {
	return date.toISOString().slice(0, 10);
}
