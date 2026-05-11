import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

import { setGoal } from '../api/socialStairApi';

const goalImage = require('../../assets/images/goal.png');

export default function StartScreen({ navigation }) {
  const [floorCount, setFloorGoal] = useState('1');
  const [loading, setLoading] = useState(false); 

  const showCustomAlert = (title, message) => {
    if (Platform.OS === 'web') {
        window.alert(`[${title}]\n${message}`);
    } else {
        Alert.alert(title, message);
    }
  };

  const handleMinus = () => {
    const current = parseInt(floorCount, 10) || 1;
    if (current > 1) {
      setFloorGoal(String(current - 1));
    }
  };

  const handlePlus = () => {
    const current = parseInt(floorCount, 10) || 0;
    setFloorGoal(String(current + 1));
  };

  const handleStart = async () => {
    const finalGoal = parseInt(floorCount, 10);
    
    if (isNaN(finalGoal) || finalGoal < 1) {
      showCustomAlert('알림', '목표 층수는 1층 이상으로 입력해주세요.');
      return;
    }

    setLoading(true); 
    try {
      await setGoal(finalGoal);
      console.log('목표 설정 성공:', finalGoal);
      navigation.replace('MainTab'); 
    } catch (error) {
      console.error('목표 설정 실패:', error);
      showCustomAlert('오류', '목표를 설정하는 중 문제가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. 키보드가 올라올 때 화면을 밀어 올려주는 KeyboardAvoidingView 적용 */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* 2. 내용이 밀려 올라갈 수 있도록 ScrollView 적용 */}
        <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled" // 키보드가 열려있을 때 다른 곳을 터치하면 닫히게 함
        >
          
          <View style={styles.headerContainer}>
            <Text style={styles.subHeader}>목표 설정</Text>
            <Text style={styles.mainHeader}>이번 주 목표 층수</Text>
          </View>

          <View style={styles.imageContainer}>
            <View style={styles.imageShadow}>
              <Image 
                source={goalImage} 
                style={styles.character} 
                resizeMode="contain" 
              />
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.questionText}>
              앞으로 일주일 동안 총 몇 층{'\n'}오르는 것을 <Text style={styles.highlightText}>목표</Text>로 하시겠어요?
            </Text>
            <Text style={styles.subtitleText}>지난 주 계단 이용률은 확인하셨나요?</Text>
          </View>

          <View style={styles.counterWrapper}>
            <View style={styles.counterContainer}>
              <TouchableOpacity style={styles.iconButton} onPress={handleMinus} activeOpacity={0.7}>
                <Feather name="minus" size={24} color={COLORS.black} />
              </TouchableOpacity>
              
              <TextInput
                style={styles.countTextInput}
                value={floorCount}
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setFloorGoal(numericValue);
                }}
                keyboardType="number-pad" 
                selectTextOnFocus={true} 
                maxLength={4} 
              />
              
              <TouchableOpacity style={styles.iconButton} onPress={handlePlus} activeOpacity={0.7}>
                <Feather name="plus" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            <Text style={styles.unitText}>층</Text>
          </View>

          <View style={styles.actionContainer}>
          <TouchableOpacity 
              style={[styles.startButton, loading && { backgroundColor: COLORS.gray }]} 
              onPress={handleStart}
              activeOpacity={0.8}
              disabled={loading} 
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.startButtonText}>지금 시작하기</Text>
              )}
            </TouchableOpacity>
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
  // 3. ScrollView에 맞게 스타일 이름과 속성 변경 (flex: 1 대신 flexGrow: 1 사용)
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40, // 키보드 여백 확보
  },
  headerContainer: {
    paddingTop: 68, 
    gap: 2,         
  },
  subHeader: {
    ...TYPOGRAPHY.subHeader,
  },
  mainHeader: {
    ...TYPOGRAPHY.mainHeader,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 120,
    marginBottom: -30, 
  },
  imageShadow: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
  },
  character: {
    width: 400,
    height: 400,
  },
  textContainer: {
    alignItems: 'center',
    gap: 20, 
  },
  questionText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 24,
    lineHeight: 33.6,
    letterSpacing: 24 * -0.025,
    color: COLORS.black,
    textAlign: 'center',
  },
  highlightText: {
    color: '#3B57BC', 
    fontFamily: 'Pretendard-Bold',
  },
  subtitleText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    lineHeight: 22.4,
    letterSpacing: 16 * -0.025,
    color: COLORS.gray,
    textAlign: 'center',
  },
  counterWrapper: {
    alignItems: 'center',
    marginTop: 18,
    gap: 4, 
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 300, 
  },
  iconButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D2C75',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 3,
  },
  countTextInput: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 60,
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 60 * -0.025,
    minWidth: 120, 
    padding: 0,
    margin: 0,
  },
  unitText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: COLORS.gray,
    letterSpacing: 20 * -0.025,
  },
  // 버튼을 하단으로 밀어주기 위해 marginTop을 auto로 변경
  actionContainer: {
    marginTop: 0, 
    paddingTop: 40,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24, 
    borderRadius: 120,   
    shadowColor: '#0D2C75',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  startButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 18,
    lineHeight: 25.2,
    letterSpacing: 18 * -0.025,
    color: COLORS.white,
    textAlign: 'center',
  },
});