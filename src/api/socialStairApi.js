import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import apiClient from './client';

/* --- 1. 인증 관련 API --- */

// 로그인 API
export const login = async (email, password) => {
  const response = await apiClient.post('https://login-3dgekfmjca-uc.a.run.app', { email, password });
  
  if (response.data.token) {
    // 웹과 앱을 구분하여 로그인 정보 저장
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      if(response.data.nickname) {
        await AsyncStorage.setItem('userNickname', response.data.nickname);
      }
      // 로그인 시 userId도 함께 기기에 저장
      if(response.data.userId) {
        await AsyncStorage.setItem('userId', response.data.userId);
      }
    } else {
      await SecureStore.setItemAsync('userToken', response.data.token);
      await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
      if(response.data.nickname) {
        await SecureStore.setItemAsync('userNickname', response.data.nickname);
      }
      // 로그인 시 userId도 함께 기기에 저장
      if(response.data.userId) {
        await SecureStore.setItemAsync('userId', response.data.userId);
      }
    }
  }
  return response.data;
};

/* --- 2. 계단 기록 관련 API --- */

// 계단 기록 입력 API
export const recordStairs = async (records) => {
  const response = await apiClient.post('https://recordstairs-3dgekfmjca-uc.a.run.app', {
    records
  });
  return response.data; 
};

// 계단 기록 목록 조회 API
export const getRecords = async (weekKey = '') => {
    const response = await apiClient.get('https://getrecords-3dgekfmjca-uc.a.run.app', {
      params: { weekKey }
    });
    return response.data;
};

// 주간 목표 가져오기
export const getGoal = async (weekKey = '') => {
    const response = await apiClient.get('https://getgoal-3dgekfmjca-uc.a.run.app', {
      params: { weekKey }
    });
    return response.data; 
};

// 성찰 일지 작성 API
export const createJournal = async (content, satisfaction) => {
  const response = await apiClient.post('https://createjournal-3dgekfmjca-uc.a.run.app', {
    content, 
    satisfaction 
  });
  return response.data; 
};

// 회원가입 API 
export const registerUser = async (email, password, nickname, floor) => {
  const response = await apiClient.post('https://register-3dgekfmjca-uc.a.run.app', {
    email,
    password,
    nickname,
    floor: Number(floor) 
  });
  
  // API 명세서에 맞춰 회원가입 직후에도 토큰과 userId를 저장하여 자동 로그인 처리
  if (response.data.token) {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      if(response.data.nickname) {
        await AsyncStorage.setItem('userNickname', response.data.nickname);
      }
      if(response.data.userId) {
        await AsyncStorage.setItem('userId', response.data.userId);
      }
    } else {
      await SecureStore.setItemAsync('userToken', response.data.token);
      await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
      if(response.data.nickname) {
        await SecureStore.setItemAsync('userNickname', response.data.nickname);
      }
      if(response.data.userId) {
        await SecureStore.setItemAsync('userId', response.data.userId);
      }
    }
  }
  
  return response.data; 
};

export const getHomeStats = async (weekKey = '') => {
    const response = await apiClient.get('https://gethomestats-3dgekfmjca-uc.a.run.app', {
      params: { weekKey }
    });
    return response.data;
};

export const setGoal = async (goalFloors) => {
    const response = await apiClient.post('https://setgoal-3dgekfmjca-uc.a.run.app', {
      goalFloors: Number(goalFloors) 
    });
    return response.data;
};

export const getJournals = async () => {
    const response = await apiClient.get('https://getjournals-3dgekfmjca-uc.a.run.app');
    return response.data; 
};

export const skipToday = async () => {
    const response = await apiClient.post('https://skiptoday-3dgekfmjca-uc.a.run.app');
    return response.data;
};

export const updateJournal = async (entryId, content, satisfaction) => {
    const response = await apiClient.put('https://updatejournal-3dgekfmjca-uc.a.run.app', {
      entryId,         
      content,         
      satisfaction     
    });
    return response.data; 
};

export const deleteJournal = async (entryId) => {
    const response = await apiClient.delete('https://deletejournal-3dgekfmjca-uc.a.run.app', {
        data: { entryId } 
    });
    return response.data; 
};

export const updateFcmToken = async (userId, fcmToken) => {
    const response = await apiClient.post('https://updatefcmtoken-3dgekfmjca-uc.a.run.app', {
      userId: userId,
      fcmToken: fcmToken
    });
    return response.data;
};

export const getNotificationsData = async (limit = 20) => {
    const response = await apiClient.get(`https://getnotifications-3dgekfmjca-uc.a.run.app?limit=${limit}`);
    return response.data;
};