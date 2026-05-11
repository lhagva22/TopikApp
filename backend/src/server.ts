import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';

import authRoutes from './routes/authRoutes';
import dictionaryRoutes from './routes/dictionaryRoutes';
import examRoutes from './routes/examRoutes';
import lessonRoutes from './routes/lessonRoutes';
import paymentRoutes from './routes/paymentRoutes';
import progressRoutes from './routes/progressRoutes';

dotenv.config({ override: true });

const app = express();
const portValue = process.env.PORT ?? process.env.port ?? '5000';
const PORT = Number(portValue);

app.use(cors());
app.use(express.json());
app.use('/media', express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api', examRoutes);
app.use('/api', lessonRoutes);
app.use('/api', progressRoutes);
app.use('/api', dictionaryRoutes);
app.use('/api', paymentRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Хүсэлтийн зам олдсонгүй' });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Серверийн алдаа гарлаа' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('Endpoints:');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/auth/profile');
  console.log('   GET  /api/exams');
  console.log('   GET  /api/lessons');
  console.log('   GET  /api/dictionary/search');
  console.log('   POST /api/payments/qpay/create');
  console.log('   POST /api/payments/:paymentId/check');
  console.log('   GET  /api/payments/webhook');
  console.log('   POST /api/exam/:id/start');
  console.log('   POST /api/exam/submit');
  console.log('   POST /api/level-test/start');
  console.log('   POST /api/level-test/submit');
  console.log('   GET  /api/progress');
});

server.on('error', err => {
  console.error('Server failed to start:', err);
});
