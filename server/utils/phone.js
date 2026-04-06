/**
 * Normalize Kenya-style mobile numbers for comparison and storage.
 * +254712… / 0712… / 712… → 254712…
 */
function normalizePhone(p) {
  if (!p || typeof p !== 'string') return '';
  const d = p.replace(/\D/g, '');
  if (d.startsWith('254')) return d;
  if (d.startsWith('0') && d.length === 10) return `254${d.slice(1)}`;
  if (d.length === 9) return `254${d}`;
  return d;
}

module.exports = { normalizePhone };
