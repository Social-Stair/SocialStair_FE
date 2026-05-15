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

  const [isLoadingRecords, setIsLoadingRecords] = useState(true);

  const [moveMethod, setMoveMethod] = useState(''); 
  const [recordTimes, setRecordTimes] = useState([]); 
  const [startFloors, setStartFloors] = useState([]);
  const [endFloors, setEndFloors] = useState([]);
  const [withFriend, setWithFriend] = useState(false);
  
  const [matchedRecordId, setMatchedRecordId] = useState(null);

  const [satisfaction, setSatisfaction] = useState(journalData?.satisfaction || 1);
  const [journalText, setJournalText] = useState(journalData?.content || '');
  
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const isStairs = moveMethod === '계단 이용';
  const isTimeFloorDisabled = moveMethod === '해당 시간대 이동 없음' || moveMethod === '출근 안 함/퇴근';
  const isReadOnlyMode = moveMethod === '해당 시간대 이동 없음' || moveMethod === '출근 안 함/퇴근';

  const hasChanges = 
    satisfaction !== journalData?.satisfaction ||
    journalText !== journalData?.content;

  useEffect(() => {
    const fetchMatchingStairsData = async () => {
      try {
        const stairsResponse = await getRecords();
        const targetDate = journalData?.date; 

        if (stairsResponse && stairsResponse.records && targetDate) {
          
          let journalTime = 0;
          if (journalData?.createdAt) {
            journalTime = journalData.createdAt._seconds 
              ? journalData.createdAt._seconds * 1000 
              : new Date(journalData.createdAt).getTime();
          }

          const sameDayRecords = stairsResponse.records.filter(r => {
            if (!r.createdAt) return false;
            let recordTime = r.createdAt._seconds 
              ? r.createdAt._seconds * 1000 
              : new Date(r.createdAt).getTime();
            const rDate = new Date(recordTime).toISOString().split('T')[0];
            return rDate === targetDate;
          });

          let matchedRecord = null;

          if (sameDayRecords.length > 0) {
            if (journalTime > 0) {
              matchedRecord = sameDayRecords.reduce((prev, curr) => {
                let prevTime = prev.createdAt._seconds ? prev.createdAt._seconds * 1000 : new Date(prev.createdAt).getTime();
                let currTime = curr.createdAt._seconds ? curr.createdAt._seconds * 1000 : new Date(curr.createdAt).getTime();
                return Math.abs(currTime - journalTime) < Math.abs(prevTime - journalTime) ? curr : prev;
              });
            } else {
              matchedRecord = sameDayRecords[0];
            }
          }

          if (matchedRecord && matchedRecord.records && matchedRecord.records.length > 0) {
            const backendType = matchedRecord.records[0].type || '계단';
            
            if (backendType === '계단') setMoveMethod('계단 이용');
            else if (backendType === '엘리베이터') setMoveMethod('엘리베이터 이용');
            else if (backendType === '이동없음') setMoveMethod('해당 시간대 이동 없음');
            else if (backendType === '출근안함') setMoveMethod('출근 안 함/퇴근');
            else setMoveMethod(backendType);

            setMatchedRecordId(matchedRecord.recordId);
            
            const times = matchedRecord.records.map(item => item.time || '00:00');
            const starts = matchedRecord.records.map(item => String(item.fromFloor || '0'));
            const ends = matchedRecord.records.map(item => String(item.toFloor || '0'));
            
            setRecordTimes(times);
            setStartFloors(starts);
            setEndFloors(ends);
            setWithFriend(matchedRecord.records[0]?.withColleague ?? false);
          } else {
             setMoveMethod('기록 없음');
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

  const executeDelete = async () => {
    setLoading(true);
    try {
      if (matchedRecordId) {
        await Promise.all([
          deleteJournal(journalData.id),
          deleteRecords([matchedRecordId]) 
        ]);
      } else {
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

            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>언제 오르셨나요?</Text>
              {isLoadingRecords ? (
                <View style={styles.disabledInputBox}><ActivityIndicator color={COLORS.primary} size="small" /></View>
              ) : (isTimeFloorDisabled || recordTimes.length === 0) ? (
                <View style={styles.disabledInputBox}><Text style={[styles.disabledText, { opacity: 0.5 }]}>-</Text></View>
              ) : (
                recordTimes.map((time, index) => (
                  <View key={index} style={[styles.disabledInputBox, index > 0 && { marginTop: 8 }]}>
                    <Text style={styles.disabledText}>{time}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>몇 층부터 몇 층까지 오르셨나요?</Text>
              {isLoadingRecords ? (
                <View style={styles.floorRow}>
                  <View style={styles.disabledFloorBox}><ActivityIndicator color={COLORS.primary} size="small" /></View>
                  <Text style={styles.arrowText}>→</Text>
                  <View style={styles.disabledFloorBox}><ActivityIndicator color={COLORS.primary} size="small" /></View>
                </View>
              ) : (isTimeFloorDisabled || recordTimes.length === 0) ? (
                <View style={styles.floorRow}>
                  <View style={styles.disabledFloorBox}><Text style={[styles.disabledText, { opacity: 0.5 }]}>-</Text></View>
                  <Text style={styles.arrowText}>→</Text>
                  <View style={styles.disabledFloorBox}><Text style={[styles.disabledText, { opacity: 0.5 }]}>-</Text></View>
                </View>
              ) : (
                recordTimes.map((_, index) => (
                  <View key={index} style={[styles.floorRow, index > 0 && { marginTop: 12 }]}>
                    <View style={styles.disabledFloorBox}>
                      <Text style={styles.disabledText}>
                        {startFloors[index] === '-1' ? 'B1 (지하1층)' : `${startFloors[index]}층`}
                      </Text>
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
                  thumbTintColor={isReadOnlyMode ? 'transparent' : COLORS.primary}
                  disabled={isReadOnlyMode}
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
                style={[styles.journalInput, isReadOnlyMode && styles.disabledInput]} 
                placeholder="내용을 입력해주세요."
                placeholderTextColor={COLORS.gray}
                multiline
                textAlignVertical="top"
                value={journalText}
                onChangeText={setJournalText}
                editable={!isReadOnlyMode} 
              />
              
              {isStairs && (
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
              style={[styles.editButton, (!hasChanges || loading || isReadOnlyMode) && { backgroundColor: COLORS.gray }]} 
              onPress={handleEdit}
              disabled={!hasChanges || loading || isReadOnlyMode}
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
  disabledInput: { backgroundColor: '#DBDEE6' },
  
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