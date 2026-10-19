export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}
export function errorHandler(err, _req, res, _next) {
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation failed.', errors: Object.values(err.errors).map(e => e.message) });
  }
  if (err?.code === 11000) return res.status(409).json({ message: 'That email is already registered.' });
  if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid record ID.' });
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
}