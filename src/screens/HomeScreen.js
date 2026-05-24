import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

import { getGoal, getHomeStats, getNotificationsData, getRecords, updateFcmToken } from '../api/socialStairApi';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function HomeScreen({ navigation }) {
  const [nickname, setNickname] = useState('사용자');
  const [goalData, setGoalData] = useState({ currentFloors: 0, goalFloors: 0, achievementRate: 0 });
  const [streak, setStreak] = useState(0); 
  const [lastWeekRate, setLastWeekRate] = useState(0); 
  const [notifications, setNotifications] = useState([]);

  const getRelativeTime = (timestamp) => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 60) return '방금 전';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}주 전`;
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const notiData = await getNotificationsData(20); 
      if (notiData && notiData.notifications) {
        const formattedNotis = notiData.notifications.map(n => {
          let ts = Date.now();
          if (n.sentAt) {
            ts = n.sentAt._seconds ? n.sentAt._seconds * 1000 : new Date(n.sentAt).getTime();
          }
          return {
            id: n.notificationId,
            title: n.title,
            body: n.body,
            type: n.type,
            timestamp: ts,
            isRead: n.isRead,
          };
        });
        setNotifications(formattedNotis);
      }
    } catch (error) {
      console.error('알림 목록 불러오기 실패:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchHomeData = async () => {
        try {
          let savedName = null;
          if (Platform.OS === 'web') {
            savedName = await AsyncStorage.getItem('userNickname');
          } else {
            savedName = await SecureStore.getItemAsync('userNickname');
          }

          if (savedName) setNickname(savedName);

          const statsData = await getHomeStats();
          if (statsData && statsData.members) {
            const myData = statsData.members.find(m => m.nickname === savedName);
            if (myData) {
              setGoalData({
                currentFloors: myData.currentFloors || 0,
                goalFloors: myData.goalFloors || 0,
                achievementRate: myData.achievementRate || 0,
              });
            }
          }

          const getISOWeekKey = (date) => {
            const target = new Date(date.valueOf());
            const dayNr = (date.getDay() + 6) % 7;
            target.setDate(target.getDate() - dayNr + 3);
            const firstThursday = target.valueOf();
            target.setMonth(0, 1);
            if (target.getDay() !== 4) {
              target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
            }
            const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
            return `${target.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
          };

          const today = new Date();
          const lastWeekDate = new Date(today.valueOf());
          lastWeekDate.setDate(today.getDate() - 7);
          const lastWeekKey = getISOWeekKey(lastWeekDate);

          try {
            const lastWeekGoalData = await getGoal(lastWeekKey);
            if (lastWeekGoalData && lastWeekGoalData.achievementRate) {
              setLastWeekRate(lastWeekGoalData.achievementRate);
            } else {
              setLastWeekRate(0);
            }
          } catch (error) {
            setLastWeekRate(0);
          }

          try {
            const [currentWeekData, lastWeekData] = await Promise.all([
              getRecords().catch(() => ({ records: [] })),
              getRecords(lastWeekKey).catch(() => ({ records: [] }))
            ]);

            const allRecords = [
              ...(currentWeekData.records || []),
              ...(lastWeekData.records || [])
            ];

            const recordDates = new Set(allRecords.map(r => {
              const ts = r.createdAt?._seconds ? r.createdAt._seconds * 1000 : new Date(r.createdAt).getTime();
              const d = new Date(ts);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }));

            let currentStreak = 0;
            const checkDate = new Date(); 
            
            const getFormattedDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            if (recordDates.has(getFormattedDate(checkDate))) {
              currentStreak = 1; 
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              checkDate.setDate(checkDate.getDate() - 1);
              if (recordDates.has(getFormattedDate(checkDate))) {
                currentStreak = 1;
                checkDate.setDate(checkDate.getDate() - 1);
              }
            }

            if (currentStreak > 0) {
              while (true) {
                if (recordDates.has(getFormattedDate(checkDate))) {
                  currentStreak++;
                  checkDate.setDate(checkDate.getDate() - 1);
                } else {
                  break; 
                }
              }
            }
            
            setStreak(currentStreak);

          } catch (error) {
            setStreak(0);
          }

        } catch (error) {
          console.error("홈 데이터 새로고침 실패:", error);
        }
      };

      fetchHomeData();
      fetchNotifications(); 
      return () => {}; 
    }, [fetchNotifications]) 
  );

  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      let userId = null;
      if (Platform.OS === 'web') {
        userId = await AsyncStorage.getItem('userId');
      } else {
        userId = await SecureStore.getItemAsync('userId');
      }
      
      if (!userId) {
        try {
          const goalData = await getGoal(); 
          if (goalData && goalData.userId) {
            userId = goalData.userId;
            
            if (Platform.OS === 'web') {
              await AsyncStorage.setItem('userId', userId);
            } else {
              await SecureStore.setItemAsync('userId', userId);
            }
          }
        } catch (e) {
          console.log('userId 복구 실패:', e);
        }
      }

      if (Platform.OS !== 'web') {
        if (Device.isDevice) {
          try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
              const { status } = await Notifications.requestPermissionsAsync();
              finalStatus = status;
            }
            if (finalStatus !== 'granted') {
               console.log("알림 권한이 거부되었습니다.");
               return;
            }
  
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  
            const tokenData = await Notifications.getExpoPushTokenAsync({
              projectId: projectId, 
            }).catch((e) => {
              console.error('푸시 토큰 발급 에러(원인 파악용):', e);
              return null;
            });
  
            if (tokenData && tokenData.data) {
              const token = tokenData.data;
              if (userId) {
                await updateFcmToken(userId, token);
              }
            }
          } catch (e) {
            console.log('푸시 알림 설정 중 전체 에러:', e);
          }
        } else {
          console.log("에뮬레이터(가상기기)에서는 푸시 알림 테스트가 불가능합니다.");
        }
      }
    };

    registerForPushNotificationsAsync();

    const notificationListener = Notifications.addNotificationReceivedListener(async (notification) => {
      fetchNotifications();
    });

    return () => {
      notificationListener.remove();
    };
  }, [fetchNotifications]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerContainer}>
          <Text style={styles.subHeader}>어서오세요, {nickname}님</Text>
          <Text style={styles.mainHeader}>오늘도 계단 한 층 더!</Text>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.accumulateContainer}>
            <Text style={styles.accumulateLabel}>이번 주 누적</Text>
            <View style={styles.accumulateValueRow}>
              <Text style={styles.accumulateNumber}>{goalData.currentFloors}</Text>
              <Text style={styles.accumulateUnit}>층</Text>
            </View>
          </View>

          <View style={styles.trendIconContainer}>
            <Feather name="trending-up" size={24} color={COLORS.white} />
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View style={[styles.progressFill, { width: `${Math.min(goalData.achievementRate, 100)}%` }]} />
              <View style={styles.progressMask} />
            </View>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressLabel}>주간 목표</Text>
              <Text style={styles.progressValue}>{goalData.currentFloors}/{goalData.goalFloors}층</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.iconCircle}>
                <Feather name="calendar" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.statLabel}>연속 기록</Text>
            </View>
            <View style={styles.statValueRow}>
              <Text style={styles.statNumber}>{streak}</Text>
              <Text style={styles.statUnit}>일</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.iconCircle}>
                <Feather name="award" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.statLabel}>지난 주 달성도</Text>
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: 13, color: COLORS.black, lineHeight: 20, letterSpacing: 13 * -0.025 }}>
                오르락 총 목표층수{'\n'}216층 중 210층 달성!!🩵
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.notificationSection}>
          <Text style={styles.sectionTitle}>성찰 일지 알림</Text>
          <View style={styles.notificationBox}>
            {notifications.length === 0 ? (
              <Text style={styles.notiDescription}>새로운 알림이 없습니다</Text>
            ) : (
              notifications.map((noti, index) => {
                const isAlert = ['afternoon', 'evening', 'wednesday', 'weeklyGoal'].includes(noti.type); 
                
                return (
                  <React.Fragment key={noti.id}>
                    <View style={styles.notiItem}>
                      <Feather 
                        name={isAlert ? "alert-triangle" : "bell"} 
                        size={18} 
                        color={isAlert ? "#F24242" : "#F5BF35"} 
                      />
                      <View style={styles.notiContent}>
                        <View style={styles.notiHeader}>
                          <Text style={styles.notiCategory}>{noti.title}</Text>
                          <Text style={styles.notiTime}>{getRelativeTime(noti.timestamp)}</Text>
                        </View>
                        <Text style={styles.notiDescription}>{noti.body}</Text>
                      </View>
                    </View>
                    {index < notifications.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                );
              })
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.resetGoalButton}
          onPress={() => navigation.navigate('Start')}
          activeOpacity={0.7}
        >
          <Feather name="refresh-cw" size={16} color={COLORS.gray} />
          <Text style={styles.resetGoalButtonText}>이번 주 목표 재설정</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 68, paddingBottom: 140 },
  headerContainer: { marginBottom: 24, gap: 2 },
  subHeader: { ...TYPOGRAPHY.subHeader },
  mainHeader: { ...TYPOGRAPHY.mainHeader },
  goalCard: { backgroundColor: COLORS.primary, borderRadius: 8, padding: 24, marginBottom: 20, position: 'relative', overflow: 'hidden' },
  progressContainer: {},
  progressBackground: { height: 32, backgroundColor: '#3F5DC8', borderRadius: 0, marginBottom: 10, overflow: 'hidden', position: 'relative' },
  progressFill: { height: '100%', backgroundColor: '#4AD8FF' },
  progressMask: { position: 'absolute', top: -30, left: '-20%', width: '120%', height: 40, backgroundColor: COLORS.primary, transform: [{ rotate: '-4deg' }] },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontFamily: 'Pretendard-SemiBold', color: COLORS.white, fontSize: 14, letterSpacing: 14 * -0.025 },
  progressValue: { fontFamily: 'Pretendard-Medium', color: COLORS.white, fontSize: 14, letterSpacing: 14 * -0.025 },
  accumulateContainer: { marginBottom: 24 },
  accumulateLabel: { fontFamily: 'Pretendard-SemiBold', color: '#EDF1FF', fontSize: 14, marginBottom: 4, letterSpacing: 14 * -0.025 },
  accumulateValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  accumulateNumber: { fontFamily: 'Pretendard-SemiBold', color: COLORS.white, fontSize: 40, lineHeight: 48, letterSpacing: 40 * -0.025 },
  accumulateUnit: { fontFamily: 'Pretendard-SemiBold', color: COLORS.white, fontSize: 16, marginBottom: 6, letterSpacing: 16 * -0.025 },
  trendIconContainer: { position: 'absolute', right: 24, top: 24, width: 66, height: 66, backgroundColor: '#3F5DC8', borderRadius: 33, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 16, gap: 12 },
  statHeader: { gap: 8 },
  iconCircle: { width: 40, height: 40, backgroundColor: '#EDF1FF', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontFamily: 'Pretendard-Medium', color: COLORS.gray, fontSize: 14, letterSpacing: 14 * -0.025 },
  statValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  statNumber: { fontFamily: 'Pretendard-SemiBold', color: COLORS.black, fontSize: 28, lineHeight: 34 },
  statUnit: { fontFamily: 'Pretendard-SemiBold', color: COLORS.black, fontSize: 16, marginBottom: 2 },
  notificationSection: { gap: 12 },
  sectionTitle: { ...TYPOGRAPHY.sectionTitle },
  notificationBox: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 18 },
  notiItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  notiContent: { flex: 1, gap: 4 },
  notiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  notiCategory: { fontFamily: 'Pretendard-Medium', color: COLORS.gray, fontSize: 11, flex: 1, marginRight: 8, letterSpacing: 11 * -0.025 },
  notiTime: { fontFamily: 'Pretendard-Medium', color: COLORS.gray, fontSize: 10, letterSpacing: 10 * -0.025 },
  notiDescription: { fontFamily: 'Pretendard-Medium', color: COLORS.gray, fontSize: 13, lineHeight: 18, letterSpacing: 13 * -0.025 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  
  resetGoalButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: COLORS.white, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 8, 
    paddingVertical: 14, 
    marginTop: 24, 
    gap: 8 
  },
  resetGoalButtonText: { 
    fontFamily: 'Pretendard-SemiBold', 
    fontSize: 14, 
    color: COLORS.gray, 
    letterSpacing: 14 * -0.025 
  },
});