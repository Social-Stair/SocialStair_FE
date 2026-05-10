import * as SecureStore from 'expo-secure-store';
import apiClient from './client';

/* --- 1. 인증 관련 API --- */

// 로그인 API [cite: 22, 23]
export const login = async (email, password) => {
    const response = await apiClient.post('https://login-3dgekfmjca-uc.a.run.app', { email, password });
    
    if (response.data.token) {
      await SecureStore.setItemAsync('userToken', response.data.token);
      await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
      
      if(response.data.nickname) {
        await SecureStore.setItemAsync('userNickname', response.data.nickname);
      }
    }
    return response.data;
  };

/* --- 2. 계단 기록 관련 API --- */

// 계단 기록 입력 API [cite: 66, 67]
export const recordStairs = async (records) => {
  // records 배열 모양: [{ fromFloor: 1, toFloor: 12, time: "11:00", withColleague: true }] [cite: 70]
  const response = await apiClient.post('https://recordstairs-3dgekfmjca-uc.a.run.app', {
    records
  });
  return response.data; // [cite: 72]
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
    // weekKey가 없으면 서버에서 자동으로 이번 주 데이터 [cite: 59]
    const response = await apiClient.get('https://getgoal-3dgekfmjca-uc.a.run.app', {
      params: { weekKey }
    });
    return response.data; // goalFloors, achievementRate 등을 반환 [cite: 61]
  };

// 성찰 일지 작성 API [cite: 105, 106]
export const createJournal = async (content, satisfaction) => {
  const response = await apiClient.post('https://createjournal-3dgekfmjca-uc.a.run.app', {
    content, // [cite: 109]
    satisfaction // [cite: 109]
  });
  return response.data; // [cite: 111]
};

// 회원가입 API 
export const registerUser = async (email, password, nickname, floor) => {
    const response = await apiClient.post('https://register-3dgekfmjca-uc.a.run.app', {
      email,
      password,
      nickname,
      floor: Number(floor) // [cite: 18]
    });
    
    return response.data; // [cite: 21]
};

export const getHomeStats = async (weekKey = '') => {
    const response = await apiClient.get('https://gethomestats-3dgekfmjca-uc.a.run.app', {
      params: { weekKey }
    });
    return response.data;
};

export const setGoal = async (goalFloors) => {
    const response = await apiClient.post('https://setgoal-3dgekfmjca-uc.a.run.app', {
      goalFloors: Number(goalFloors) // 숫자로 변환해서 전송
    });
    return response.data;
};

export const getJournals = async () => {
    const response = await apiClient.get('https://getjournals-3dgekfmjca-uc.a.run.app');
    return response.data; // { entries: [...] } 형태로 반환
};

export const skipToday = async () => {
    const response = await apiClient.post('https://skiptoday-3dgekfmjca-uc.a.run.app');
    return response.data;
};

export const updateJournal = async (entryId, content, satisfaction) => {
    const response = await apiClient.put('https://updatejournal-3dgekfmjca-uc.a.run.app', {
      entryId,         // 수정할 일지 ID 
      content,         // 수정할 내용 
      satisfaction     // 만족도 
    });
    return response.data; // [cite: 124]
};

export const deleteJournal = async (entryId) => {
// DELETE 요청에서 body 데이터를 보낼 때는 data 속성
const response = await apiClient.delete('https://deletejournal-3dgekfmjca-uc.a.run.app', {
    data: { entryId } // [cite: 129]
});
return response.data; // [cite: 132]
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