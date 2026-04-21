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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', examRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Хүсэлтийн зам олдсонгүй' });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Серверийн алдаа гарлаа' });
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`   GET  /api/exams - Бүх шалгалт`);
  console.log(`   GET  /api/exams/:examId - Шалгалтын дэлгэрэнгүй`);
  console.log(`   POST /api/exam/:examId/start - Шалгалт эхлүүлэх (Premium)`);
  console.log(`   POST /api/exam/submit - Шалгалт дуусгах (Premium)`);
  console.log(`   GET  /api/exam-results - Хэрэглэгчийн түүх (Premium)`);
});