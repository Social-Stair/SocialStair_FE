import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native'; // 웹/앱 구분을 위해 추가

import AsyncStorage from '@react-native-async-storage/async-storage'; // 웹 저장소용 추가
import { useFonts } from 'expo-font';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';

import InitialScreen from './src/screens/InitialScreen';
import LoginScreen from './src/screens/LoginScreen';
import RecordDetailScreen from './src/screens/RecordDetailScreen';
import RecordWriteScreen from './src/screens/RecordWriteScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import StartScreen from './src/screens/StartScreen';

import MainTab from './src/navigation/MainTab';

import { getGoal } from './src/api/socialStairApi';

const Stack = createNativeStackNavigator();

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Pretendard-Regular': require('./src/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('./src/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('./src/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('./src/fonts/Pretendard-Bold.otf'),
    'Pretendard-ExtraBold': require('./src/fonts/Pretendard-ExtraBold.otf'),
  });

  // 1. 초기 화면 경로와 로그인 검사 상태
  const [initialRoute, setInitialRoute] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // 3. 토큰 확인 및 초기 화면(로그인, 홈, 목표설정) 결정 로직
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 웹과 앱을 구분하여 토큰을 꺼내옵니다.
        let token = null;
        if (Platform.OS === 'web') {
          token = await AsyncStorage.getItem('userToken');
        } else {
          token = await SecureStore.getItemAsync('userToken');
        }
        
        if (!token) {
          // 토큰이 없으면 로그인 화면으로
          setInitialRoute('Login');
        } else {
          try {
            // 토큰이 있으면 이번 주 목표 설정 여부 확인
            const goalData = await getGoal();
            if (!goalData || !goalData.goalFloors) {
              setInitialRoute('Start'); // 목표 미설정 시 목표 설정 화면으로
            } else {
              setInitialRoute('MainTab'); // 목표가 있으면 홈(메인 탭)으로
            }
          } catch (e) {
            // 백엔드에서 이번 주 목표를 찾지 못해 404 에러를 뱉는 경우!
            if (e.response && e.response.status === 404) {
              setInitialRoute('Start'); // 목표 설정 화면으로 이동!
            } else {
              // 그 외 토큰 만료나 찐 서버 에러일 때만 로그인으로 쫓아냄
              setInitialRoute('Login'); 
            }
          }
        }
      } catch (e) {
        setInitialRoute('Login');
      } finally {
        // 검사 완료 표시
        setIsAuthReady(true);
      }
    };

    checkAuth();
  }, []);

  // 4. 폰트 로딩과 로그인 검사가 '모두' 끝났을 때만 스플래시 스크린 숨기기
  useEffect(() => {
    if ((fontsLoaded || fontError) && isAuthReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isAuthReady]);

  // 준비가 안 끝났으면 빈 화면 유지 (화면에는 스플래시 이미지가 계속 떠있게 됨)
  if ((!fontsLoaded && !fontError) || !isAuthReady) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        {/* 로그인 화면 */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="Initial" 
          component={InitialScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="Start" 
          component={StartScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen
          name="MainTab"
          component={MainTab} 
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="RecordWrite" 
          component={RecordWriteScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="RecordDetail" 
          component={RecordDetailScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}