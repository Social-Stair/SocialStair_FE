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

import { Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import CustomButton from '../components/customButton';
import SuccessModal from '../components/SuccessModal';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

import { createJournal, recordStairs, skipToday } from '../api/socialStairApi';

export default function RecordWriteScreen({ navigation }) {
    const [loading, setLoading] = useState(false);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [moveMethod, setMoveMethod] = useState('계단 이용'); 

    const [recordTimes, setRecordTimes] = useState(['']); 
    
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
    const [currentTimeIndex, setCurrentTimeIndex] = useState(null);

    const [startFloors, setStartFloors] = useState(['']);
    const [endFloors, setEndFloors] = useState(['']);
    
    const [openDropdownInfo, setOpenDropdownInfo] = useState(null);
    
    const [satisfaction, setSatisfaction] = useState(1);
    const [journalText, setJournalText] = useState('');

    const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
    const [achievementRate, setAchievementRate] = useState(30); 
    const [modalTitle, setModalTitle] = useState('대단해요!');
    const [modalMainText, setModalMainText] = useState(null); 
    const [modalSubText, setModalSubText] = useState('삼성관 대학원생들의\n건강한 움직임을 응원합니다.\n지금의 좋은 기운을 유지해보세요!');
    const [showConfetti, setShowConfetti] = useState(true);

    const isNotWorking = moveMethod === '출근 안 함/퇴근' || moveMethod === '해당 시간대 이동 없음';

    const showCustomAlert = (title, message) => {
        if (Platform.OS === 'web') {
            window.alert(`[${title}]\n${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const handleSelectMethod = (method) => {
        setMoveMethod(method);
        setIsDropdownOpen(false);
        setOpenDropdownInfo(null);
        
        if (method === '출근 안 함/퇴근') {
            setRecordTimes(['']);
            setStartFloors(['']);
            setEndFloors(['']);
            setSatisfaction(1);
            setJournalText('');
        } 
        else if (method === '해당 시간대 이동 없음') {
            setRecordTimes(['']);
            setStartFloors(['']);
            setEndFloors(['']);
            setSatisfaction(1);
            setJournalText('해당 시간대 이동이 없습니다.');
        }
        else if (method === '엘리베이터 이용') {
            setRecordTimes(['']);
            setStartFloors(['']);
            setEndFloors(['']);
        }
    };

    const addTimeInput = () => {
        if (!isNotWorking) { 
            setRecordTimes([...recordTimes, '']);
            setStartFloors([...startFloors, '']);
            setEndFloors([...endFloors, '']);
        }
    };

    const removeTimeInput = (indexToRemove) => {
        setRecordTimes(recordTimes.filter((_, index) => index !== indexToRemove));
        setStartFloors(startFloors.filter((_, index) => index !== indexToRemove));
        setEndFloors(endFloors.filter((_, index) => index !== indexToRemove));
        setOpenDropdownInfo(null);
    };

    const updateStartFloor = (index, value) => {
        const newFloors = [...startFloors];
        newFloors[index] = value;
        setStartFloors(newFloors);
    };

    const updateEndFloor = (index, value) => {
        const newFloors = [...endFloors];
        newFloors[index] = value;
        setEndFloors(newFloors);
    };

    const showTimePicker = (index) => {
        if (isNotWorking) return; 
        setCurrentTimeIndex(index);
        setTimePickerVisibility(true);
    };

    const hideTimePicker = () => {
        setTimePickerVisibility(false);
    };

    const handleConfirmTime = (date) => {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? '오후' : '오전';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        minutes = minutes < 10 ? '0' + minutes : minutes;
        const strTime = `${ampm} ${hours}:${minutes}`;

        const newTimes = [...recordTimes];
        newTimes[currentTimeIndex] = strTime;
        setRecordTimes(newTimes);
        hideTimePicker();
    };

    const handleSubmit = async () => {
        if (moveMethod === '계단 이용' || moveMethod === '엘리베이터 이용') {
            const hasEmptyTime = recordTimes.some(time => !time.trim());
            const hasEmptyFloor = startFloors.some(f => !f.trim()) || endFloors.some(f => !f.trim());
            
            if (hasEmptyTime || hasEmptyFloor || !journalText.trim()) {
                showCustomAlert('알림', '시간, 층수, 성찰 일지를 모두 입력해주세요!');
                return; 
            }
        }

        setLoading(true);

        try {
            let backendType = '계단';
            if (moveMethod === '계단 이용') backendType = '계단';
            else if (moveMethod === '엘리베이터 이용') backendType = '엘리베이터';
            else if (moveMethod === '해당 시간대 이동 없음') backendType = '이동없음';
            else if (moveMethod === '출근 안 함/퇴근') backendType = '출근안함';

            const recordsPayload = recordTimes.map((time, index) => {
                let fFloor = startFloors[index] === 'B1' ? -1 : parseInt(startFloors[index], 10);
                let tFloor = parseInt(endFloors[index], 10);
                
                return {
                    fromFloor: isNaN(fFloor) ? 1 : fFloor, 
                    toFloor: isNaN(tFloor) ? 1 : tFloor,
                    time: time.trim() ? time : "00:00",
                    type: backendType, 
                    withColleague: false
                };
            });

            if (moveMethod === '계단 이용') {
                const [recordResponse] = await Promise.all([
                    recordStairs(recordsPayload),
                    createJournal(journalText, parseInt(satisfaction, 10))
                ]);

                setAchievementRate(recordResponse?.achievementRate || 0);

                if (recordResponse?.milestone) {
                    setModalTitle(recordResponse.milestone.title);
                    setModalSubText(recordResponse.milestone.body);
                } else {
                    setModalTitle('수고하셨어요!');
                    setModalSubText('오늘의 건강한 발걸음이 기록되었습니다.\n지금의 좋은 기운을 유지해보세요!');
                }
                setModalMainText(null); 
                setShowConfetti(true);

            } else if (moveMethod === '엘리베이터 이용') {
                await Promise.all([
                    recordStairs(recordsPayload), 
                    createJournal(journalText, parseInt(satisfaction, 10))
                ]);
                
                setModalTitle('일지 작성 완료');
                setModalMainText('성찰 일지가 기록되었습니다 📥');
                setModalSubText('');
                setShowConfetti(false);
                setAchievementRate(0); 

            } else if (moveMethod === '해당 시간대 이동 없음') {
                await Promise.all([
                    recordStairs(recordsPayload), 
                    createJournal(journalText, parseInt(satisfaction, 10))
                ]);
                
                setModalTitle('일지 작성 완료');
                setModalMainText('해당 시간대 이동 없음으로\n기록되었습니다! 🙌🏻');
                setModalSubText('');
                setShowConfetti(false);
                setAchievementRate(0); 
            
            } else if (moveMethod === '출근 안 함/퇴근') {
                await Promise.all([
                    recordStairs(recordsPayload), 
                    skipToday() 
                ]);
                
                setModalTitle('일지 작성 완료');
                setModalMainText('오늘은 푹 쉬시고,\n다음 출근 때 뵙겠습니다! 🙌🏻');
                setModalSubText('');
                setShowConfetti(false);
                setAchievementRate(0);
            }

            setSuccessModalVisible(true);

        } catch (error) {
            console.error("기록 등록 실패:", error);
            showCustomAlert('에러', '기록을 등록하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const handleModalComplete = () => {
        setSuccessModalVisible(false);
        navigation.goBack();
    };

    const renderFloorList = (items, isStartFloor, index) => {
        const handleSelect = (floor) => {
            if (isStartFloor) updateStartFloor(index, floor);
            else updateEndFloor(index, floor);
            setOpenDropdownInfo(null);
        };

        return (
            <ScrollView 
                style={[{ flex: 1 }, Platform.OS === 'web' && { overflowY: 'auto', overscrollBehavior: 'contain' }]}
                contentContainerStyle={{ paddingVertical: 4 }}
                nestedScrollEnabled={true} 
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled" 
            >
                {items.map(floor => (
                    <TouchableOpacity 
                        key={floor} 
                        style={styles.floorDropdownItem}
                        onPress={() => handleSelect(floor)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.floorDropdownItemText}>
                            {isStartFloor && floor === 'B1' ? 'B1 (지하1층)' : `${floor}층`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
            
            <View style={styles.headerContainer}>
                <View>
                <Text style={styles.subHeader}>기록 작성</Text>
                <Text style={styles.mainHeader}>오늘의 오르락 기록</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                <Feather name="x" size={28} color={COLORS.black} />
                </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
                
                <View style={styles.inputGroup}>
                <Text style={styles.sectionTitle}>어떤 이동 방법을 선택하셨나요?</Text>
                <TouchableOpacity 
                    style={styles.dropdownBox} 
                    activeOpacity={0.8}
                    onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <Text style={styles.dropdownText}>{moveMethod}</Text>
                    <Feather name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={24} color={COLORS.gray} />
                </TouchableOpacity>

                {isDropdownOpen && (
                    <View style={styles.dropdownList}>
                    {['계단 이용', '엘리베이터 이용', '해당 시간대 이동 없음', '출근 안 함/퇴근'].map((method) => (
                        <TouchableOpacity 
                        key={method} 
                        style={styles.dropdownItem}
                        onPress={() => handleSelectMethod(method)}
                        >
                        <Text style={styles.dropdownItemText}>{method}</Text>
                        </TouchableOpacity>
                    ))}
                    </View>
                )}
                </View>

                <View style={styles.inputGroup}>
                <Text style={styles.sectionTitle}>언제 오르셨나요?</Text>
                
                {recordTimes.map((time, index) => (
                    <View key={index} style={styles.timeInputRow}>
                    
                    {Platform.OS === 'web' ? (
                        <TextInput
                            style={[styles.timeInputWrapper, isNotWorking && styles.disabledInput, styles.timeInputText]}
                            placeholder="예) 14:00"
                            placeholderTextColor={COLORS.gray}
                            value={time}
                            onChangeText={(val) => {
                                const newTimes = [...recordTimes];
                                newTimes[index] = val;
                                setRecordTimes(newTimes);
                            }}
                            editable={!isNotWorking}
                        />
                    ) : (
                        <TouchableOpacity 
                            style={[styles.timeInputWrapper, isNotWorking && styles.disabledInput]}
                            onPress={() => showTimePicker(index)}
                            disabled={isNotWorking}
                        >
                            <Text style={[styles.timeInputText, !time && styles.placeholderText]}>
                            {time || "예) 오후 12:00"}
                            </Text>
                        </TouchableOpacity>
                    )}
                    
                    {index === recordTimes.length - 1 ? (
                        <TouchableOpacity 
                        style={[styles.plusButton, isNotWorking && { backgroundColor: COLORS.gray }]} 
                        onPress={addTimeInput}
                        disabled={isNotWorking}
                        >
                        <Feather name="plus" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                        style={styles.minusButton} 
                        onPress={() => removeTimeInput(index)}
                        >
                        <Feather name="minus" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                    )}
                    </View>
                ))}

                {Platform.OS !== 'web' && (
                    <DateTimePickerModal
                        isVisible={isTimePickerVisible}
                        mode="time"
                        onConfirm={handleConfirmTime}
                        onCancel={hideTimePicker}
                        confirmTextIOS="확인"
                        cancelTextIOS="취소"
                    />
                )}
                </View>

                <View style={[styles.inputGroup, { zIndex: 10 }]}>
                  <Text style={styles.sectionTitle}>몇 층부터 몇 층까지 올라가셨나요?</Text>
                  {recordTimes.map((_, index) => {
                      const isStartOpen = openDropdownInfo?.type === 'start' && openDropdownInfo?.index === index;
                      const isEndOpen = openDropdownInfo?.type === 'end' && openDropdownInfo?.index === index;
                      const isAnyOpen = isStartOpen || isEndOpen;

                      return (
                        <View key={index} style={[
                            styles.floorInputRow, 
                            index > 0 && { marginTop: 12 }, 
                            { zIndex: 100 - index },
                            isAnyOpen && { height: 212, marginBottom: -164 } 
                        ]}>
                            
                            {/* 출발층 드롭다운 */}
                            <View style={[styles.floorDropdownContainer, isStartOpen && { zIndex: 100 }]}>
                                <TouchableOpacity
                                    style={[styles.floorInputBtn, isNotWorking && styles.disabledInput]}
                                    onPress={() => !isNotWorking && setOpenDropdownInfo(isStartOpen ? null : { type: 'start', index })}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.floorInputText, !startFloors[index] && styles.placeholderText]}>
                                        {startFloors[index] ? (startFloors[index] === 'B1' ? 'B1 (지하1층)' : `${startFloors[index]}층`) : "선택"}
                                    </Text>
                                    <Feather name="chevron-down" size={16} color={COLORS.gray} />
                                </TouchableOpacity>
                                
                                {isStartOpen && (
                                    <View style={styles.floorDropdownMenu}>
                                        {renderFloorList(['B1', '1', '2', '3', '4', '5', '6'], true, index)}
                                    </View>
                                )}
                            </View>

                            <View style={styles.arrowContainer}>
                                <Text style={styles.arrowText}>→</Text>
                            </View>
                            
                            {/* 도착층 드롭다운 */}
                            <View style={[styles.floorDropdownContainer, isEndOpen && { zIndex: 100 }]}>
                                <TouchableOpacity
                                    style={[styles.floorInputBtn, isNotWorking && styles.disabledInput]}
                                    onPress={() => !isNotWorking && setOpenDropdownInfo(isEndOpen ? null : { type: 'end', index })}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.floorInputText, !endFloors[index] && styles.placeholderText]}>
                                        {endFloors[index] ? `${endFloors[index]}층` : "선택"}
                                    </Text>
                                    <Feather name="chevron-down" size={16} color={COLORS.gray} />
                                </TouchableOpacity>

                                {isEndOpen && (
                                    <View style={styles.floorDropdownMenu}>
                                        {renderFloorList(['1', '2', '3', '4', '5', '6', '7'], false, index)}
                                    </View>
                                )}
                            </View>

                        </View>
                      );
                  })}
                </View>

                <View style={[styles.inputGroup, { zIndex: 1 }]}>
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
                    thumbTintColor={isNotWorking ? 'transparent' : COLORS.primary} 
                    disabled={isNotWorking} 
                    />
                    <View style={styles.satisfactionDotsRow}>
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                        <Text key={num} style={styles.scoreNumber}>{num}</Text>
                    ))}
                    </View>
                    <View style={styles.satisfactionLabels}>
                    <Text style={styles.satisfactionLabel}>매우 아님</Text>
                    <Text style={styles.satisfactionLabel}>매우 있음</Text>
                    </View>
                </View>
                </View>

                <View style={[styles.inputGroup, { zIndex: 1 }]}>
                <Text style={styles.sectionTitle}>성찰 일지</Text>
                
                <Text style={styles.sectionDescription}>
                  이 방법을 선택한 가장 큰 이유는 무엇인가요? 선택 이후 어떤 느낌이 드는지 자유롭게 적어주세요!
                </Text>
                <TextInput
                    style={[styles.journalInput, isNotWorking && styles.disabledInput]}
                    placeholder="내용을 입력해주세요."
                    placeholderTextColor={COLORS.gray}
                    multiline
                    textAlignVertical="top"
                    value={journalText}
                    onChangeText={setJournalText}
                    editable={!isNotWorking} 
                />
                </View>

            </View>

            <View style={styles.actionContainer}>
                <CustomButton 
                title={loading ? "등록 중..." : "등록하기"}
                onPress={handleSubmit}
                disabled={loading}
                />
            </View>

            </ScrollView>
        </KeyboardAvoidingView>

        <SuccessModal 
            visible={isSuccessModalVisible}
            onClose={handleModalComplete}
            achievementRate={achievementRate}
            title={modalTitle}
            subText={modalSubText}
            mainText={modalMainText} 
            showConfetti={showConfetti} 
        />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 68, paddingBottom: 64 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  subHeader: { ...TYPOGRAPHY.subHeader, marginBottom: 2 },
  mainHeader: { ...TYPOGRAPHY.mainHeader },
  formContainer: { gap: 24 },
  inputGroup: { gap: 10 },
  sectionTitle: { ...TYPOGRAPHY.sectionTitle },
  sectionDescription: { fontFamily: 'Pretendard-Medium', fontSize: 13, color: COLORS.gray, marginTop: -4, lineHeight: 18, letterSpacing: 13 * -0.025 },
  
  dropdownBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 16 },
  dropdownText: { fontFamily: 'Pretendard-Medium', fontSize: 14, color: COLORS.gray, letterSpacing: 14 * -0.025 },
  dropdownList: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginTop: -4, overflow: 'hidden' },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  dropdownItemText: { fontFamily: 'Pretendard-Medium', fontSize: 14, color: COLORS.black, letterSpacing: 14 * -0.025 },
  
  timeInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInputWrapper: { flex: 1, height: 48, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 16 },
  timeInputText: { fontFamily: 'Pretendard-Medium', fontSize: 14, color: COLORS.black, textAlign: 'left' },
  placeholderText: { color: COLORS.gray },
  plusButton: { width: 48, height: 48, backgroundColor: COLORS.primary, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  minusButton: { width: 48, height: 48, backgroundColor: '#F24242', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  disabledInput: { backgroundColor: '#DBDEE6' },
  
  floorInputRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' },
  
  floorDropdownContainer: { width: '42%' }, 
  floorInputBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12 },
  floorInputText: { flex: 1, fontFamily: 'Pretendard-Medium', fontSize: 14, color: COLORS.black, textAlign: 'center' },
  
  floorDropdownMenu: { position: 'absolute', top: 52, left: 0, right: 0, height: 160, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, zIndex: 1000 },
  floorDropdownItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.background, alignItems: 'center' },
  floorDropdownItemText: { fontFamily: 'Pretendard-Medium', fontSize: 14, color: COLORS.black },

  arrowContainer: { height: 48, justifyContent: 'center', zIndex: 1 },
  arrowText: { fontFamily: 'Pretendard-Medium', fontSize: 16, color: COLORS.gray, marginHorizontal: 12 },
  
  satisfactionWrapper: { marginTop: 10, marginBottom: 12 },
  slider: { width: '100%', height: 40 },
  satisfactionDotsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, marginTop: -4 },
  scoreNumber: { fontFamily: 'Pretendard-Medium', fontSize: 14, color: COLORS.gray, letterSpacing: 14 * -0.025 },
  satisfactionLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  satisfactionLabel: { fontFamily: 'Pretendard-Medium', fontSize: 12, color: COLORS.gray, letterSpacing: 12 * -0.025 },
  
  journalInput: { height: 145, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 16, ...TYPOGRAPHY.placeholder, color: COLORS.black },
  actionContainer: { marginTop: 24, alignItems: 'center' },
});