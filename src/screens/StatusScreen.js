import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image, // 1. Image 컴포넌트 추가
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

import { getHomeStats } from '../api/socialStairApi';

// 2. 로컬에 저장해둔 고양이와 강아지 이미지 불러오기
const catIcon = require('../../assets/images/cat.png');
const dogIcon = require('../../assets/images/dog.png');

export default function StatusScreen() {
  const [totalMembers, setTotalMembers] = useState(0);
  const [sharedGoal, setSharedGoal] = useState({ currentFloors: 0, goalFloors: 0, achievementRate: 0 });
  const [membersList, setMembersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchStatusData = async () => {
        setLoading(true);
        try {
          const data = await getHomeStats();
          
          if (data) {
            setTotalMembers(data.totalParticipants || 0);
            
            if (data.sharedGoal) {
              setSharedGoal({
                currentFloors: data.sharedGoal.currentFloors || 0,
                goalFloors: data.sharedGoal.goalFloors || 0,
                achievementRate: data.sharedGoal.achievementRate || 0,
              });
            }

            if (data.members) {
              setMembersList(data.members);
            }
          }
        } catch (error) {
          console.error("현황 데이터 불러오기 에러:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchStatusData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        <View style={styles.headerContainer}>
          <Text style={styles.subHeader}>집계 상황</Text>
          <Text style={styles.mainHeader}>오르락 팀원들의 실시간 목표 달성 현황</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.cardContainer}>
            
            <View style={styles.cardHeaderBlue}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.totalMemberText}>총 {totalMembers}명</Text>
                <Text style={styles.totalFloorText}>{sharedGoal.currentFloors} / {sharedGoal.goalFloors}층</Text>
              </View>
              
              <View style={styles.totalProgressBg}>
              <View style={[styles.totalProgressFill, { width: `${Math.min(sharedGoal.achievementRate, 100)}%` }]} />
              <View style={styles.totalProgressMask} />
            </View>
            </View>

            <View style={styles.listContainer}>
              {membersList.length === 0 ? (
                <Text style={styles.emptyText}>참여 중인 팀원이 없습니다.</Text>
              ) : (
                membersList.map((member, index) => {
                  // 3. 최대 100%를 넘지 않는 달성률 계산
                  const achievementRate = Math.min(member.achievementRate || 0, 100);
                  
                  // 4. 인덱스(순서)가 짝수면 고양이, 홀수면 강아지 선택
                  const iconSource = index % 2 === 0 ? catIcon : dogIcon;

                  return (
                    <View key={member.userId || index} style={styles.memberRow}>
                      <View style={styles.memberTextRow}>
                        <Text style={styles.memberName}>{member.nickname}</Text>
                        <Text style={styles.memberScore}>
                          {member.currentFloors}/{member.goalFloors}층
                        </Text>
                      </View>
                      
                      {/* 개별 프로그레스 바 영역 */}
                      <View style={styles.memberProgressBg}>
                        {/* 파란색 채워지는 바 */}
                        <View style={[styles.memberProgressFill, { width: `${achievementRate}%` }]} />
                        
                        {/* 5. 달성률 위치(left)에 맞춰 캐릭터 아이콘 배치 */}
                        <Image 
                          source={iconSource}
                          style={[
                            styles.progressIcon,
                            { left: `${achievementRate}%` }
                          ]}
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 68, paddingBottom: 140 },
  headerContainer: { marginBottom: 20, gap: 2 },
  subHeader: { ...TYPOGRAPHY.subHeader },
  mainHeader: { ...TYPOGRAPHY.mainHeader },
  cardContainer: { backgroundColor: COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  
  cardHeaderBlue: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  totalMemberText: { fontFamily: 'Pretendard-SemiBold', fontSize: 18, color: COLORS.white },
  totalFloorText: { fontFamily: 'Pretendard-Medium', fontSize: 14, color: COLORS.white },
  
  totalProgressBg: { height: 32, backgroundColor: '#3F5DC8', borderRadius: 0, position: 'relative', overflow: 'hidden' },
  totalProgressFill: { height: '100%', backgroundColor: '#4AD8FF', position: 'absolute', left: 0, top: 0 },
  totalProgressMask: { position: 'absolute', top: -30, left: '-20%', width: '120%', height: 40, backgroundColor: COLORS.primary, transform: [{ rotate: '-5deg' }] },

  listContainer: { paddingHorizontal: 24, paddingVertical: 16, gap: 16, paddingBottom: 24 },
  emptyText: { fontFamily: 'Pretendard-Medium', fontSize: 14, color: COLORS.gray, textAlign: 'center', paddingVertical: 20 },
  
  // 리스트 각 항목들 간의 간격을 아이콘 크기를 고려하여 넓혀줌
  memberRow: { gap: 8, marginBottom: 16 }, 
  
  memberTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberName: { fontFamily: 'Pretendard-Medium', fontSize: 12, color: COLORS.black, letterSpacing: 12 * 0.025 },
  memberScore: { fontFamily: 'Pretendard-Medium', fontSize: 12, color: COLORS.primary, letterSpacing: 12 * 0.025 },
  
  memberProgressBg: { 
    height: 4, 
    backgroundColor: '#EDF1FF', 
    borderRadius: 2, 
    position: 'relative',
  },
  memberProgressFill: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2, position: 'absolute', left: 0, top: 0 },
  
  // 추가된 캐릭터 아이콘 스타일 설정
  progressIcon: {
    position: 'absolute',
    top: -12,          // 선(높이 4)의 정중앙에 아이콘이 오도록 위로 끌어올림
    width: 28,         // 아이콘 너비
    height: 28,        // 아이콘 높이
    marginLeft: -14,   // 아이콘의 '가운데'가 현재 퍼센트 위치에 정확히 맞물리도록 좌측으로 당김
  },
});