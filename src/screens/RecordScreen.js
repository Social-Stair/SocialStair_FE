import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

import { getJournals } from '../api/socialStairApi';

export default function RecordScreen({ navigation }) {

    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(true);

    const formatMonthDay = (dateString) => {
        if (!dateString) return '';
        const parts = dateString.split('-');
        if (parts.length === 3) {
          return `${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일`;
        }
        return dateString;
    };

    // 화면이 포커스(보일 때)될 때마다 최신 목록을 가져옴
    useFocusEffect(
        useCallback(() => {
          const fetchJournals = async () => {
            setLoading(true);
            try {
              const data = await getJournals();
              // 서버에서 entries 배열이 넘어오면 상태 업데이트
              if (data && data.entries) {
                setJournals(data.entries);
              }
            } catch (error) {
              console.error('일지 목록 불러오기 실패:', error);
            } finally {
              setLoading(false);
            }
          };
    
          fetchJournals();
        }, [])
    );


    return (
        <SafeAreaView style={styles.container}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            
            {/* 1. 상단 헤더 영역 */}
            <View style={styles.headerRow}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.subHeader}>기록 모음</Text>
                <Text style={styles.mainHeader}>성찰 일지 목록</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.writeButton}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('RecordWrite')}
              >
                <Text style={styles.writeButtonText}>작성하기</Text>
              </TouchableOpacity>
            </View>
    
            {/* 2. 성찰 일지 카드 리스트 영역 */}
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : journals.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>아직 작성된 성찰 일지가 없습니다.</Text>
                <Text style={styles.emptySubText}>첫 번째 일지를 작성해 보세요!</Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {journals.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.card}
                    activeOpacity={0.7}
                    
                    onPress={() => navigation.navigate('RecordDetail', { journalData: item })}
                  >
                    <View style={styles.cardContent}>
                      {/* 만족도 */}
                      <View style={styles.scoreRow}>
                        <Text style={styles.scoreLabel}>다음에 계단 이용할 의향</Text>
                        <Text style={styles.scoreValue}>{item.satisfaction}</Text>
                      </View>
                      
                      {/* 일지 제목 */}
                      <Text style={styles.cardTitle}>{formatMonthDay(item.date)} 성찰 일지</Text>
                      
                      {/* 작성 날짜 */}
                      <View style={styles.dateRow}>
                        <Text style={styles.dateLabel}>기록일</Text>
                        <Text style={styles.dateValue}>{item.date.replace(/-/g, '.')}</Text>
                      </View>
                    </View>
    
                    {/* 우측 화살표 아이콘 */}
                    <Feather name="chevron-right" size={24} color={COLORS.black} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
    
          </ScrollView>
        </SafeAreaView>
      );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 68,
    paddingBottom: 140, 
  },
  
  // 헤더 스타일
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  headerTextContainer: {
    gap: 2,
  },
  subHeader: {
    ...TYPOGRAPHY.subHeader,
  },
  mainHeader: {
    ...TYPOGRAPHY.mainHeader,
  },
  writeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4, 
  },
  writeButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.white,
    letterSpacing: 14 * -0.025,
  },

  // 일지 리스트 & 카드 스타일
  listContainer: {
    gap: 16, // 카드들 사이의 간격
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0D2C75',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 2,
  },
  cardContent: {
    gap: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 14 * -0.025,
  },
  scoreValue: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    letterSpacing: 14 * -0.025,
    color: COLORS.primary,
  },
  cardTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    letterSpacing: 16 * -0.025,
    color: COLORS.black,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: COLORS.gray,
    letterSpacing: 12 * -0.025,
  },
  dateValue: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
    color: COLORS.gray,
    letterSpacing: 12 * -0.025,
  },
  emptyContainer: {
    paddingTop: 200,
    gap: 2,
    alignItems: 'center'
  },
  emptyText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: COLORS.gray,
    letterSpacing: 14 * -0.025,
  },
  emptySubText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: COLORS.gray,
    letterSpacing: 14 * -0.025,
  }
});