// // features/auth/services/authService.ts
// import { Platform } from 'react-native';

// const getApiUrl = () => {
//   if (Platform.OS === 'android') {
//     // Emulator
//     if (__DEV__ && !global.__fbBatchedBridgeConfig) {
//       return 'http://10.0.2.2:5000/api/auth';
//     }
//     // Физик төхөөрөмж (компьютерийн IP)
//     return 'http://192.168.1.100:5000/api/auth'; // ✅ ӨӨРИЙН IP-ЭЭР СОЛЬ
//   }
//   // iOS
//   return 'http://localhost:5000/api/auth';
// };

// const API_URL = getApiUrl();