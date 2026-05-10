import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// 기본 URL 설정
const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. [요청 가로채기] API를 보낼 때마다 토큰을 챙겨서 보냄
apiClient.interceptors.request.use(
  async (config) => {
    let token = null;
    if (Platform.OS === 'web') {
      token = await AsyncStorage.getItem('userToken');
    } else {
      token = await SecureStore.getItemAsync('userToken');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. [응답 가로채기] 401 에러(토큰 만료)가 나면 몰래 새 토큰을 받아옴
apiClient.interceptors.response.use(
  (response) => response, // 성공한 요청은 그대로 통과
  async (error) => {
    const originalRequest = error.config; // 원래 하려던 요청 정보

    // 만약 에러가 401(권한 없음)이고, 아직 재시도한 적이 없다면
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 무한 루프 방지용 꼬리표

      try {
        // 1) 보관해둔 Refresh Token을 꺼냄
        let refreshToken = null;
        if (Platform.OS === 'web') {
          refreshToken = await AsyncStorage.getItem('refreshToken');
        } else {
          refreshToken = await SecureStore.getItemAsync('refreshToken');
        }

        // Refresh Token이 아예 없다면 어쩔 수 없이 실패 처리 (로그아웃됨)
        if (!refreshToken) {
          return Promise.reject(error);
        }

        // 2) 토큰 갱신 API 호출  (이때는 무한 루프 방지를 위해 apiClient 대신 기본 axios 사용)
        const refreshResponse = await axios.post('https://refreshtoken-3dgekfmjca-uc.a.run.app', {
          refreshToken: refreshToken // 
        });

        const newToken = refreshResponse.data.token; // 
        const newRefreshToken = refreshResponse.data.refreshToken; // 

        // 3) 새로 발급받은 토큰들을 다시 금고에 저장
        if (Platform.OS === 'web') {
          await AsyncStorage.setItem('userToken', newToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
        } else {
          await SecureStore.setItemAsync('userToken', newToken);
          await SecureStore.setItemAsync('refreshToken', newRefreshToken);
        }

        // 4) 아까 실패했던 원래 요청의 헤더를 '새 토큰'으로 교체해서 다시 보냄 (사용자는 에러 났던 걸 모름)
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        // Refresh Token마저도 만료되었거나 에러가 나면 진짜로 로그인이 풀린 것임
        console.log("토큰 갱신 실패! 다시 로그인해야 합니다.", refreshError);
        return Promise.reject(refreshError);
      }
    }

    // 401 에러가 아니거나, 이미 재시도를 한 경우 에러 그대로 반환
    return Promise.reject(error);
  }
);

export default apiClient;