// // src/features/exam/services/examService.ts
// import { Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {
//   ExamBank,
//   StartExamResponse,
//   SubmitExamResponse,
//   GetExamBankResponse
// } from '../types';

// const getApiUrl = () => {
//   if (Platform.OS === 'android') {
//     return 'http://10.0.2.2:5000/api';
//   }
//   return 'http://localhost:5000/api';
// };

// const API_URL = getApiUrl();

// const getToken = async () => {
//   return await AsyncStorage.getItem('token');
// };

// export const examService = {
//   // Бүх шалгалтын жагсаалт авах
//   getExamBank: async (): Promise<GetExamBankResponse> => {
//     try {
//       const token = await getToken();
//       const response = await fetch(`${API_URL}/exams`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       });
//       return await response.json();
//     } catch (error) {
//       return { success: false, error: 'Network error' };
//     }
//   },
  
//   // Шалгалт эхлүүлэх
//   startExam: async (examId: string): Promise<StartExamResponse> => {
//     try {
//       const token = await getToken();
//       console.log('📤 Starting exam with ID:', examId);
//       console.log('📤 API URL:', `${API_URL}/exam/${examId}/start`);
      
//       const response = await fetch(`${API_URL}/exam/${examId}/start`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       const data = await response.json();
//       console.log('📥 Start exam response:', data);
//       return data;
//     } catch (error) {
//       console.error('Start exam error:', error);
//       return { success: false, error: 'Network error' };
//     }
//   },
  
//   // Шалгалт дуусгах
//   submitExam: async (sessionId: string, answers: any[], timeSpent: number): Promise<SubmitExamResponse> => {
//     try {
//       const token = await getToken();
//       const response = await fetch(`${API_URL}/exam/submit`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           sessionId,
//           answers,
//           timeSpent,
//         }),
//       });
//       return await response.json();
//     } catch (error) {
//       console.error('Submit exam error:', error);
//       return { success: false, error: 'Network error' };
//     }
//   },
// };