import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export default function useHideTabBar() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    const parent = navigation.getParent?.(); // Tab navigator
    // Ẩn tab bar khi vào
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    // Khôi phục khi rời màn
    return () => parent?.setOptions({ tabBarStyle: undefined });
  }, [navigation]);
}
