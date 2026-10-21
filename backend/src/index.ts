import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Main API mount
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'klipzz.vid Backend API',
    version: '1.0.0',
    status: 'online',
    description: 'Campaign Clipping & Metric Scraping Engine with Apify & Supabase',
  });
});

app.listen(PORT, () => {
  console.log(`[klipzz.vid] API server listening on http://localhost:${PORT}`);
});
