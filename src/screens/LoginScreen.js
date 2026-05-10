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

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { getGoal, login } from '../api/socialStairApi';
import CustomButton from '../components/customButton';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

const logoImage = require('../../assets/images/logo.png');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // 💡 1. 빈칸 검사
    if (!email.trim() || !password.trim()) {
      Alert.alert('알림', '이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    // 💡 2. 이메일 형식 검사 (정규식 활용)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('알림', '올바른 이메일 형식이 아닙니다.\n예: user@example.com');
      return;
    }

    setLoading(true);

    try {
      const response = await login(email.trim(), password); 
      
      let hasSeenInitial = null;
      if (Platform.OS === 'web') {
        hasSeenInitial = await AsyncStorage.getItem('hasSeenInitial');
      } else {
        hasSeenInitial = await SecureStore.getItemAsync('hasSeenInitial');
      }
      
      if (!hasSeenInitial) {
        if (Platform.OS === 'web') {
          await AsyncStorage.setItem('hasSeenInitial', 'true');
        } else {
          await SecureStore.setItemAsync('hasSeenInitial', 'true');
        }
        
        navigation.replace('Initial');
        return;
      }
  
      try {
        const goalData = await getGoal();
        if (!goalData || !goalData.goalFloors) {
          navigation.replace('Start');
        } else {
          navigation.replace('MainTab');
        }
      } catch (goalError) {
        console.log('목표 조회 에러:', goalError.response?.status);
        navigation.replace('Start'); 
      }
  
    } catch (error) {
      // 💡 3. 서버에서 보내온 에러 코드(status)에 따른 맞춤형 알림창
      if (error.response) {
        if (error.response.status === 401) {
          Alert.alert('로그인 실패', '아이디 또는 비밀번호가 일치하지 않습니다.\n다시 확인해 주세요.');
        } else {
          Alert.alert('서버 오류', `서버에 문제가 발생했습니다. (에러 코드: ${error.response.status})`);
        }
      } else {
        Alert.alert('네트워크 오류', '서버와 연결할 수 없습니다. 인터넷 상태를 확인해 주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
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
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  shadowBox: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 6, borderRadius: 16, backgroundColor: COLORS.white, marginBottom: 12 },
  logo: { width: 76, height: 76 },
  logoText: { fontFamily: 'Pretendard-ExtraBold', color: COLORS.primary, fontSize: 28, letterSpacing: 28 * -0.025 },
  formContainer: { width: '100%', gap: 12, marginBottom: 30 },
  input: { ...TYPOGRAPHY.placeholder, color: COLORS.black, width: '100%', height: 48, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 16 },
  signupContainer: { flexDirection: 'row', alignItems: 'center' },
  signupText: { ...TYPOGRAPHY.placeholder },
  signupLink: { fontFamily: 'Pretendard-SemiBold', color: COLORS.gray, fontSize: 14 },
});