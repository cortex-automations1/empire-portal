/**
 * Empire Portal API
 * Express backend for financial data aggregation
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from '@empire/database';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: 'down',
      },
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Empire Portal API',
    version: '0.1.0',
    endpoints: ['/api/health'],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Empire Portal API running on http://localhost:${PORT}`);
});
