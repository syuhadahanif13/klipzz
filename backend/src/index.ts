import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

// Hanya load .env saat development — di production, env var di-inject langsung oleh platform (Coolify/Railway)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin/server-to-server requests have no Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS.'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })
);

app.use(express.json({ limit: '100kb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Daftarkan semua rute API
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'klipzz.vid Backend API',
    version: '1.0.0',
    status: 'online',
    description: 'Campaign Clipping & Metric Scraping Engine with Apify & Supabase',
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);

  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }

  if (err?.message === 'Origin not allowed by CORS.') {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  console.error('[klipzz API] Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`[klipzz.vid] API server listening on http://localhost:${PORT}`);
  console.log(
    `[klipzz.vid] CORS origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'all (development)'}`
  );
});
