import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

import { Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

import SuccessModal from '../components/SuccessModal';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

import { deleteJournal, deleteRecords, getRecords, updateJournal } from '../api/socialStairApi';

export default function RecordDetailScreen({ route, navigation }) {
  const { journalData } = route.params || {};

  // 데이터 로딩 상태
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  // [조회 전용 데이터] - 서버에서 불러와서 세팅할 상태들
  const [moveMethod, setMoveMethod] = useState('엘리베이터/출근 안 함'); // 기본값
  const [recordTimes, setRecordTimes] = useState([]); 
  const [startFloors, setStartFloors] = useState([]);
  const [endFloors, setEndFloors] = useState([]);
  const [withFriend, setWithFriend] = useState(false);
  
  // 삭제할 때 같이 보내주기 위해 매칭된 계단 기록의 ID를 저장할 State 추가
  const [matchedRecordId, setMatchedRecordId] = useState(null);

  // [수정 가능 데이터] - 성찰 일지와 만족도
  const [satisfaction, setSatisfaction] = useState(journalData?.satisfaction || 1);
  const [journalText, setJournalText] = useState(journalData?.content || '');
  
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const isNotWorking = moveMethod === '엘리베이터/출근 안 함';

  const hasChanges = 
    satisfaction !== journalData?.satisfaction ||
    journalText !== journalData?.content;

  // 화면이 열릴 때 계단 기록 API를 찔러서 현재 일지 날짜와 매칭하기
  useEffect(() => {
    const fetchMatchingStairsData = async () => {
      try {
        const stairsResponse = await getRecords();
        const targetDate = journalData?.date; 

        if (stairsResponse && stairsResponse.records && targetDate) {
          const matchedRecord = stairsResponse.records.find(r => {
            if (!r.createdAt) return false;
            
            let recordDate = '';
            if (r.createdAt._seconds) {
              recordDate = new Date(r.createdAt._seconds * 1000).toISOString().split('T')[0];
            } else {
              recordDate = new Date(r.createdAt).toISOString().split('T')[0];
            }
            return recordDate === targetDate;
          });

          // 매칭되는 계단 기록이 있다면 (계단을 이용한 날)
          if (matchedRecord && matchedRecord.records && matchedRecord.records.length > 0) {
            setMoveMethod('계단');
            // 나중에 삭제할 때를 위해 recordId를 저장해 둠
            setMatchedRecordId(matchedRecord.recordId);
            
            const times = matchedRecord.records.map(item => item.time || '시간 정보 없음');
            const starts = matchedRecord.records.map(item => String(item.fromFloor || '0'));
            const ends = matchedRecord.records.map(item => String(item.toFloor || '0'));
            
            setRecordTimes(times);
            setStartFloors(starts);
            setEndFloors(ends);
            setWithFriend(matchedRecord.records[0]?.withColleague ?? false);
          }
        }
      } catch (error) {
        console.error("계단 기록 불러오기 실패:", error);
      } finally {
        setIsLoadingRecords(false);
      }
    };

    fetchMatchingStairsData();
  }, [journalData]);

  // 실제 삭제 로직 (일지 + 계단 기록 동시 삭제)
  const executeDelete = async () => {
    setLoading(true);
    try {
      // 계단 기록 ID가 존재한다면 (계단을 올랐던 날이라면), 일지와 계단 기록을 동시에 삭제
      if (matchedRecordId) {
        await Promise.all([
          deleteJournal(journalData.id),
          deleteRecords([matchedRecordId]) // 백엔드 요청대로 배열 형태로 감싸서 전송
        ]);
      } else {
        // 엘리베이터나 출근 안 함 등으로 매칭된 계단 기록이 없을 땐 일지만 삭제
        await deleteJournal(journalData.id);
      }
      
      if (Platform.OS === 'web') {
        window.alert('일지가 삭제되었습니다.');
        navigation.goBack();
      } else {
        Alert.alert('삭제 완료', '일지가 삭제되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('삭제 중 문제가 발생했습니다.');
      } else {
        Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 웹과 앱을 분리하여 알림창을 띄우는 삭제 버튼 핸들러
  const handleDelete = () => {
    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm('정말로 이 일지를 삭제하시겠어요?');
      if (isConfirmed) {
        executeDelete();
      }
    } else {
      Alert.alert('기록 삭제', '정말로 이 일지를 삭제하시겠어요?', [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive', 
          onPress: executeDelete 
        }
      ]);
    }
  };

  const handleEdit = async () => {
    setLoading(true);
    try {
      await updateJournal(journalData.id, journalText, satisfaction);
      setSuccessModalVisible(true);
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('수정 중 문제가 발생했습니다.');
      } else {
        Alert.alert('오류', '수정 중 문제가 발생했습니다.');
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
          
          <View style={styles.headerContainer}>
            <View>
              <Text style={styles.subHeader}>기록 확인</Text>
              <Text style={styles.mainHeader}>
                {journalData?.date ? journalData.date.replace(/-/g, '.') : ''} 기록
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Feather name="x" size={28} color={COLORS.black} />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>어떤 이동 방법을 선택하셨나요?</Text>
              <View style={styles.disabledDropdownBox}>
                {isLoadingRecords ? (
                  <ActivityIndicator color={COLORS.primary} size="small" />
                ) : (
                  <Text style={styles.disabledText}>{moveMethod}</Text>
                )}
                <Feather name="lock" size={18} color={COLORS.gray} />
              </View>
            </View>

            {/* 서버에서 불러온 여러 개의 시간 데이터 렌더링 */}
            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>언제 오르셨나요?</Text>
              {isLoadingRecords ? (
                <View style={styles.disabledInputBox}><ActivityIndicator color={COLORS.primary} size="small" /></View>
              ) : recordTimes.length === 0 ? (
                <View style={styles.disabledInputBox}><Text style={[styles.disabledText, { opacity: 0.5 }]}>기록 없음</Text></View>
              ) : (
                recordTimes.map((time, index) => (
                  <View key={index} style={[styles.disabledInputBox, index > 0 && { marginTop: 8 }]}>
                    <Text style={styles.disabledText}>{time}</Text>
                  </View>
                ))
              )}
            </View>

            {/* 서버에서 불러온 여러 개의 층수 데이터 렌더링 */}
            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>몇 층부터 몇 층까지 오르셨나요?</Text>
              {isLoadingRecords ? (
                <View style={styles.floorRow}>
                  <View style={styles.disabledFloorBox}><ActivityIndicator color={COLORS.primary} size="small" /></View>
                  <Text style={styles.arrowText}>→</Text>
                  <View style={styles.disabledFloorBox}><ActivityIndicator color={COLORS.primary} size="small" /></View>
                </View>
              ) : recordTimes.length === 0 ? (
                <View style={styles.floorRow}>
                  <View style={styles.disabledFloorBox}><Text style={[styles.disabledText, { opacity: 0.5 }]}>-</Text></View>
                  <Text style={styles.arrowText}>→</Text>
                  <View style={styles.disabledFloorBox}><Text style={[styles.disabledText, { opacity: 0.5 }]}>-</Text></View>
                </View>
              ) : (
                recordTimes.map((_, index) => (
                  <View key={index} style={[styles.floorRow, index > 0 && { marginTop: 12 }]}>
                    <View style={styles.disabledFloorBox}>
                      <Text style={styles.disabledText}>{startFloors[index]}층</Text>
                    </View>
                    <Text style={styles.arrowText}>→</Text>
                    <View style={styles.disabledFloorBox}>
                      <Text style={styles.disabledText}>{endFloors[index]}층</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>다음 이동 시 계단을 이용할 의향이 얼마나 있으신가요?</Text>
              <View style={styles.satisfactionWrapper}>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={7}
                  step={1}
                  value={satisfaction}
                  onValueChange={(val) => setSatisfaction(val)}
                  minimumTrackTintColor={COLORS.primary}
                  maximumTrackTintColor="#DBDEE6"
                  thumbTintColor={COLORS.primary}
                />
                <View style={styles.satisfactionDotsRow}>
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <Text key={num} style={[styles.scoreNumber, satisfaction === num && {color: COLORS.primary}]}>{num}</Text>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>성찰 일지</Text>
              
              <Text style={styles.sectionDescription}>
                이 방법을 선택한 가장 큰 이유는 무엇인가요? 선택 이후 어떤 느낌이 드는지 자유롭게 적어주세요!
              </Text>
              <TextInput
                style={styles.journalInput}
                placeholder="내용을 입력해주세요."
                placeholderTextColor={COLORS.gray}
                multiline
                textAlignVertical="top"
                value={journalText}
                onChangeText={setJournalText}
              />
              
              {moveMethod === '계단' && (
                <View style={styles.disabledCheckboxRow}>
                  <View style={[styles.checkbox, withFriend && styles.checkboxActive]}>
                    {withFriend && <Feather name="check" size={12} color={COLORS.white} />}
                  </View>
                  <Text style={styles.disabledCheckboxText}>친구와 함께 올랐어요!</Text>
                </View>
              )}
            </View>

          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>삭제하기</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.editButton, (!hasChanges || loading) && { backgroundColor: COLORS.gray }]} 
              onPress={handleEdit}
              disabled={!hasChanges || loading}
            >
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.editButtonText}>수정 완료</Text>}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal 
        visible={isSuccessModalVisible}
        onClose={() => { setSuccessModalVisible(false); navigation.goBack(); }}
        achievementRate={0}
        title="수정 완료!"
        subText="기록이 성공적으로 수정되었습니다."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 68, paddingBottom: 90 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  subHeader: { ...TYPOGRAPHY.subHeader },
  mainHeader: { ...TYPOGRAPHY.mainHeader },
  formContainer: { gap: 24 },
  inputGroup: { gap: 10 },
  sectionTitle: { ...TYPOGRAPHY.sectionTitle },
  sectionDescription: { fontFamily: 'Pretendard-Medium', fontSize: 13, color: COLORS.gray, marginTop: -4, lineHeight: 18, letterSpacing: 13 * -0.025 },
  
  disabledDropdownBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 48, backgroundColor: '#DBDEE6', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 16,
  },
  disabledInputBox: {
    height: 48, backgroundColor: '#DBDEE6', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 16,
  },
  floorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  disabledFloorBox: {
    flex: 1, height: 48, backgroundColor: '#DBDEE6', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  disabledText: { fontFamily: 'Pretendard-Medium', fontSize: 14, color: COLORS.gray },
  arrowText: { color: COLORS.gray, fontSize: 18 },

  journalInput: {
    height: 120, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 16, fontFamily: 'Pretendard-Medium', fontSize: 14, color: COLORS.black,
  },
  
  satisfactionWrapper: { marginTop: 10 },
  slider: { width: '100%', height: 40 },
  satisfactionDotsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14 },
  scoreNumber: { fontFamily: 'Pretendard-Medium', fontSize: 12, color: COLORS.gray },

  disabledCheckboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, opacity: 0.6, justifyContent: 'center',},
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: COLORS.gray, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: COLORS.gray, borderColor: COLORS.gray },
  disabledCheckboxText: { fontFamily: 'Pretendard-Medium', fontSize: 14, color: COLORS.gray },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 40 },
  deleteButton: { flex: 1, height: 52, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#F24242', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  deleteButtonText: { fontFamily: 'Pretendard-SemiBold', fontSize: 15, color: '#F24242' },
  editButton: { flex: 2, height: 52, backgroundColor: COLORS.primary, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  editButtonText: { fontFamily: 'Pretendard-SemiBold', fontSize: 15, color: COLORS.white },
});