import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(currentDir, '..');

// Load environment variables
dotenv.config({ path: path.join(backendDir, '.env') });
dotenv.config({ path: path.join(backendDir, '.env.local') });

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration supporting local dev (port 3000) and production (Vercel)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  process.env.APP_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check against allowed origins or any vercel.app preview URL
    const isAllowed = allowedOrigins.includes(origin) || 
      origin.endsWith('.vercel.app') || 
      origin.includes('localhost:') ||
      origin.includes('127.0.0.1:');

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in demo/dev mode while still honoring credentials
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded product photos and KYC verification documents
const uploadsDir = path.join(backendDir, 'uploads');
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

// Top-level health check (useful for Render service health checks)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'AgriMarket Backend',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Central API Router mounted at /api
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` AgriMarket Express Backend Service`);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` API base: http://localhost:${PORT}/api`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===============================================`);
});

export default app;

