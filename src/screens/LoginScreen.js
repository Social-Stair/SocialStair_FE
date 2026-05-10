import React, { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage'; // 웹용 저장소 추가
import * as SecureStore from 'expo-secure-store';

import CustomButton from '../components/customButton';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

import { getGoal, login } from '../api/socialStairApi';

const logoImage = require('../../assets/images/logo.png');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // 1. 빈칸 검사
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const response = await login(email, password); // 로그인 API 호출
      
      // 1. 회원가입 후 최초 로그인 여부 확인 (웹/앱 분기 처리)
      let hasSeenInitial = null;
      if (Platform.OS === 'web') {
        hasSeenInitial = await AsyncStorage.getItem('hasSeenInitial');
      } else {
        hasSeenInitial = await SecureStore.getItemAsync('hasSeenInitial');
      }
      
      if (!hasSeenInitial) {
        // 최초 로그인이라면 값을 저장하고 InitialScreen으로 이동 (웹/앱 분기 처리)
        if (Platform.OS === 'web') {
          await AsyncStorage.setItem('hasSeenInitial', 'true');
        } else {
          await SecureStore.setItemAsync('hasSeenInitial', 'true');
        }
        
        navigation.replace('Initial');
        return;
      }
  
      // 2. 이번 주 목표 설정 여부 확인 
      try {
        const goalData = await getGoal();
        if (!goalData || !goalData.goalFloors) {
          // 목표가 없으면 목표 설정 화면(StartScreen)으로
          navigation.replace('Start');
        } else {
          // 목표가 이미 있으면 홈으로
          navigation.replace('MainTab');
        }
      } catch (goalError) {
        // 목표 데이터가 없어서 404 등 에러가 발생한 경우, 무조건 목표 설정 화면으로
        console.log('목표 조회 에러 (아마 목표 미설정 상태):', goalError.response?.status);
        navigation.replace('Start'); 
      }
  
    } catch (error) {
      Alert.alert('로그인 실패', '정보를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* 1. 로고 영역 */}
        <View style={styles.logoContainer}>
          <View style={styles.shadowBox}>
            <Image
              source={logoImage}
              style={styles.logo}
              resizeMode='contain'
            />
          </View>
          <Text style={styles.logoText}>오르락</Text>
        </View>

        {/* 2. 입력 폼 영역 */}
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="이메일을 입력해주세요"
            placeholderTextColor={COLORS.gray} 
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호를 입력해주세요"
            placeholderTextColor={COLORS.gray} 
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <CustomButton 
            title={loading ? "로그인 중..." : "로그인"}
            onPress={handleLogin} 
            disabled={loading} 
            style={{ marginTop: 20 }}
          />
          
        </View>

        {/* 3. 회원가입 링크 영역 */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>계정이 없으신가요? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupLink}>회원가입</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, 
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  shadowBox: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    marginBottom: 12,
  },
  logo: {
    width: 76,
    height: 76,
  },
  logoText: {
    fontFamily: 'Pretendard-ExtraBold',
    color: COLORS.primary,
    fontSize: 28,
    letterSpacing: 28 * -0.025, 
  },
  formContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 30,
  },
  input: {
    ...TYPOGRAPHY.placeholder, 
    color: COLORS.black,      
    width: '100%',
    height: 48,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    ...TYPOGRAPHY.placeholder, 
  },
  signupLink: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.gray,
    fontSize: 14,
  },
});