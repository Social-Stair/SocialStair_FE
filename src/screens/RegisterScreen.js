import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import CustomButton from '../components/customButton';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

// 회원가입 API 함수 불러오기
import { registerUser } from '../api/socialStairApi';

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState(''); // 비밀번호 확인용
  const [nickname, setNickname] = useState('');
  const [floor, setFloor] = useState('');

  const handleRegister = async () => {
    // 1. 빈칸 검사
    if (!email.trim() || !password.trim() || !nickname.trim() || !floor) {
      Alert.alert('알림', '모든 항목을 빠짐없이 입력해 주세요.');
      return;
    }

    // 2. 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('알림', '올바른 이메일 형식이 아닙니다.');
      return;
    }

    // 3. 비밀번호 길이 검사 (예: 6자리 이상)
    if (password.length < 6) {
      Alert.alert('알림', '비밀번호는 6자리 이상으로 설정해 주세요.');
      return;
    }

    setLoading(true);

    try {
      // 회원가입 API 호출
      await registerUser(email.trim(), password, nickname.trim(), floor);
      
      Alert.alert('가입 완료', '환영합니다! 회원가입이 완료되었습니다.', [
        { text: '확인', onPress: () => navigation.replace('Initial') } // 💡 성공 시 화면 이동
      ]);

    } catch (error) {
      // 💡 서버 에러 처리 (API 명세서 기준: 닉네임 중복 400 에러) [cite: 15]
      if (error.response) {
        if (error.response.status === 400) {
          Alert.alert('회원가입 실패', '이미 사용 중인 닉네임이거나 입력값이 잘못되었습니다.\n다른 닉네임으로 시도해 주세요.');
        } else {
          Alert.alert('서버 오류', `회원가입 중 문제가 발생했습니다. (${error.response.status})`);
        }
      } else {
        Alert.alert('네트워크 오류', '서버와 연결할 수 없습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 뒤로 가기 버튼 */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={28} color={COLORS.black} />
          </TouchableOpacity>

          {/* 1. 상단 타이틀 영역 */}
          <View style={styles.headerContainer}>
            <Text style={styles.subHeader}>회원가입</Text>
            <Text style={styles.mainHeader}>아래 정보를 입력해주세요</Text>
          </View>

          {/* 입력 폼 영역 */}
          <View style={styles.formContainer}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={styles.input}
                placeholder="사용할 이메일을 입력해주세요"
                placeholderTextColor={COLORS.gray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호</Text>
              <TextInput
                style={styles.input}
                placeholder="사용할 비밀번호를 입력해주세요"
                placeholderTextColor={COLORS.gray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호 확인</Text>
              <TextInput
                style={styles.input}
                placeholder="비밀번호를 다시 한 번 입력해주세요"
                placeholderTextColor={COLORS.gray}
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                secureTextEntry={true}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>닉네임</Text>
              <TextInput
                style={styles.input}
                placeholder="사용할 닉네임을 입력해주세요"
                placeholderTextColor={COLORS.gray}
                value={nickname}
                onChangeText={setNickname}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>소속 층수</Text>
              <TextInput
                style={styles.input}
                placeholder="현재 건물 내 소속한 층수를 입력해주세요"
                placeholderTextColor={COLORS.gray}
                value={floor}
                onChangeText={setFloor}
                keyboardType="numeric" // 숫자 키보드 띄우기
              />
            </View>

          </View>

          {/* 버튼 영역 */}
          <View style={styles.actionContainer}>
            <CustomButton 
                title={loading ? "가입 처리 중..." : "회원가입 완료"}
                onPress={handleRegister} 
                disabled={loading}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 68,
    paddingBottom: 80,
  },
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  headerContainer: {
    marginBottom: 20,
    gap: 2,
  },
  subHeader: {
    ...TYPOGRAPHY.subHeader,
  },
  mainHeader: {
    ...TYPOGRAPHY.mainHeader,
  },
  formContainer: {
    gap: 24,
    marginBottom: 40,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.black,
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
  actionContainer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 30,
  },
});