import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SearchPost({
  city = 'Hồ Chí Minh',
  onPressCity,
  onPressSearch,
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        padding: 8,
        borderRadius: 12,
        gap: 8,
      }}
    >
      {/* Chip location */}
      <Pressable
        onPress={onPressCity}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FEE6C9', // cam nhạt
          paddingHorizontal: 10,
          height: 36,
          borderRadius: 10,
          gap: 6,
        }}
      >
        <Ionicons name="location" size={16} color="#F18A2F" />
        <Text style={{ color: '#F18A2F', fontWeight: '700' }}>{city}</Text>
      </Pressable>

      {/* Ô “Tìm kiếm tin đăng” */}
      <Pressable
        onPress={onPressSearch}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#EDEDED',
          height: 36,
          borderRadius: 10,
          paddingHorizontal: 10,
          gap: 8,
        }}
      >
        <Ionicons name="search" size={16} color="#9CA3AF" />
        <Text style={{ color: '#9CA3AF', fontWeight: '600' }}>
          Tìm kiếm tin đăng
        </Text>
      </Pressable>
    </View>
  );
}