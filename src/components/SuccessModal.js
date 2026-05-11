import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// 1. 폭죽 이펙트 라이브러리 불러오기
import ConfettiCannon from 'react-native-confetti-cannon';

import { COLORS } from '../constants/colors';

export default function SuccessModal({ 
  visible, 
  onClose, 
  achievementRate, 
  title, 
  subText,
  mainText,      // 추가: 모달 중앙 메인 텍스트 
  showConfetti   // 추가: 폭죽 표시 여부
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      navigationBarTranslucent={true} 
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          
          {/* 폭죽은 visible이고 showConfetti가 true일 때만 터짐 */}
          {visible && showConfetti && (
            <>
              {/* 왼쪽 대포 */}
              <ConfettiCannon
                count={35}
                origin={{x: 10, y: 20}} 
                autoStart={true}
                fadeOut={true}
                explosionSpeed={350}
                fallSpeed={2000}
              />
              {/* 오른쪽 대포 */}
              <ConfettiCannon
                count={35} 
                origin={{x: 310, y: 20}} 
                autoStart={true}
                fadeOut={true}
                explosionSpeed={350}
                fallSpeed={2000}
              />
            </>
          )}

          <View style={styles.modalTextContent}>
            <View style={styles.modalTitleGroup}>
              <Text style={styles.modalTitle}>{title}</Text>
              
              {/* mainText가 있으면 그걸 띄우고, 없으면 기본 퍼센트 텍스트 띄움 */}
              <Text style={styles.modalMainText}>
                {mainText ? mainText : (
                  <>벌써 주간 목표의 <Text style={styles.modalHighlightText}>{achievementRate}%</Text>를{'\n'}달성했습니다! 🎉</>
                )}
              </Text>
            </View>
            
            {/* subText가 있을 때만 렌더링 */}
            {subText ? (
              <Text style={styles.modalSubText}>
                {subText}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity 
            style={styles.completeButton} 
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.completeButtonText}>완료하기</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.50)', 
    justifyContent: 'flex-start', 
    alignItems: 'center',
    paddingTop: 164, 
  },
  modalContainer: {
    width: 320,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#0D2C75',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'visible', 
  },
  modalTextContent: {
    alignItems: 'center',
    gap: 40,
  },
  modalTitleGroup: {
    alignItems: 'center',
    gap: 20,
  },
  modalTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 32,
    lineHeight: 44.8,
    color: COLORS.black,
    textAlign: 'center',
    letterSpacing: 32 * -0.025,
  },
  modalMainText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 24,
    lineHeight: 33.6,
    color: COLORS.black,
    textAlign: 'center',
    letterSpacing: 24 * -0.025,
  },
  modalHighlightText: {
    color: COLORS.primary, 
  },
  modalSubText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    letterSpacing: 16 * -0.025,
    lineHeight: 22.4,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: -10,
    letterSpacing: 16 * -0.025,
  },
  completeButton: {
    width: 272,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  completeButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 14 * -0.025
  }
});