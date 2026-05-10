import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// 기본 URL 설정 (명세서의 공통 뒷부분)
const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청을 보내기 직전에 가로채서 토큰을 무조건 넣어주는 로직
apiClient.interceptors.request.use(
  async (config) => {
    // 웹과 앱을 구분하여 토큰을 꺼내옴
    let token = null;
    if (Platform.OS === 'web') {
      token = await AsyncStorage.getItem('userToken');
    } else {
      token = await SecureStore.getItemAsync('userToken');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // 헤더에 토큰 장착
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;