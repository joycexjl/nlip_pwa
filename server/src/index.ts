import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import express from 'express';

import transcribeRouter from './api/transcribe.js';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Environment variables loaded');
console.log(
  'GOOGLE_APPLICATION_CREDENTIALS:',
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);
console.log('Current working directory:', process.cwd());

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Middleware
app.use(express.json());

// Serve static files from the client build directory
app.use(express.static(path.join(__dirname, '../../dist')));

// API routes
app.use('/api', transcribeRouter);

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
