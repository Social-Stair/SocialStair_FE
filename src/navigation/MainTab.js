import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

import HomeScreen from '../screens/HomeScreen';
import RecordScreen from '../screens/RecordScreen';
import StatusScreen from '../screens/StatusScreen';

const Tab = createBottomTabNavigator();

export default function MainTab() {
  const insets = useSafeAreaInsets(); 

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, 
        
        // 탭 바 스타일 설정
        tabBarStyle: {
          // 웹 환경에서는 텍스트가 잘리지 않도록 높이를 84로 넉넉하게 늘려줌
          height: Platform.OS === 'web' ? 84 : 64 + insets.bottom, 
          backgroundColor: COLORS.white,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute', 
          bottom: 0,
          borderTopWidth: 0,
          
          // 그림자 설정
          elevation: 20, 
          shadowColor: '#000000', 
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          
          // 웹 환경에서는 글씨 아래쪽 공간도 조금 더 확보
          paddingBottom: Platform.OS === 'web' ? 14 : (insets.bottom > 0 ? insets.bottom : 10), 
          paddingTop: 10,
        },
        
        tabBarActiveTintColor: COLORS.primary, 
        tabBarInactiveTintColor: COLORS.black, 
        
        // 글자 스타일 설정
        tabBarLabelStyle: {
          fontFamily: 'Pretendard-Medium',
          fontSize: 12,
          marginTop: 2,
        },
        
        // 아이콘 설정
        tabBarIcon: ({ color }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Record') iconName = 'edit-2'; 
          else if (route.name === 'Status') iconName = 'clipboard';

          return <Feather name={iconName} size={24} color={color} />;
        },
      })}
    >
      
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarLabel: '홈' }} 
      />
      <Tab.Screen 
        name="Record" 
        component={RecordScreen} 
        options={{ tabBarLabel: '기록' }} 
      />
      <Tab.Screen 
        name="Status" 
        component={StatusScreen} 
        options={{ tabBarLabel: '현황' }} 
      />
    </Tab.Navigator>
  );
}