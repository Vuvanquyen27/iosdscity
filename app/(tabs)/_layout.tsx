import { Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/custom-tab-bar';

/**
 * Bottom Tab Navigator với tab bar tự build (CustomTabBar).
 * SDK 54: `Tabs` lấy từ 'expo-router' (classic, bọc @react-navigation/bottom-tabs v7).
 */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen name="map" options={{ title: 'Bản đồ' }} />
      <Tabs.Screen name="booking" options={{ title: 'Đặt chỗ' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Thông báo' }} />
      <Tabs.Screen name="account" options={{ title: 'Tài khoản' }} />
    </Tabs>
  );
}
