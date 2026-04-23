// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import examRoutes from './routes/examRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', examRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Хүсэлтийн зам олдсонгүй' });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Серверийн алдаа гарлаа' });
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`   POST /api/auth/register - Бүртгүүлэх`);
  console.log(`   POST /api/auth/login - Нэвтрэх`);
  console.log(`   GET  /api/auth/profile - Профайл`);
  console.log(`   GET  /api/exams - Бүх шалгалт`);
  console.log(`   POST /api/exam/:id/start - Шалгалт эхлүүлэх`);
  console.log(`   POST /api/exam/submit - Шалгалт дуусгах`);
  console.log(`   POST /api/level-test/start - Түвшин тогтоох (random exam)`);
  console.log(`   POST /api/level-test/submit - Түвшин тогтоох дуусгах`);
});