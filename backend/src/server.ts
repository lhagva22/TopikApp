import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import authRoutes from './routes/authRoutes';
import examRoutes from './routes/examRoutes';
import progressRoutes from './routes/progressRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', examRoutes);
app.use('/api', progressRoutes);

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

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('Endpoints:');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/auth/profile');
  console.log('   GET  /api/exams');
  console.log('   POST /api/exam/:id/start');
  console.log('   POST /api/exam/submit');
  console.log('   POST /api/level-test/start');
  console.log('   POST /api/level-test/submit');
  console.log('   GET  /api/progress');
});
