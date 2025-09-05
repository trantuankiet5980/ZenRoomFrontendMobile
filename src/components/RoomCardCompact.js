import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function RoomCardCompact({ item, onPress }) {
  return (
    <Pressable onPress={() => onPress?.(item)} style={{ width: 220, marginRight: 12 }}>
      <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' }}>
        <View style={{ height: 130, backgroundColor: '#eee' }}>
          {item.image && <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} />}
          {item.isGoodDeal && (
            <View style={{ position:'absolute', top:8, right:8, backgroundColor:'#FEE6C9',
                           paddingHorizontal:8, paddingVertical:4, borderRadius:8 }}>
              <Text style={{ color:'#f36031', fontWeight:'700', fontSize:12 }}>🔥 Giá tốt</Text>
            </View>
          )}
        </View>
        <View style={{ padding: 10, gap: 4 }}>
          <Text numberOfLines={2} style={{ fontWeight:'700' }}>{item.title}</Text>
          {!!item.priceText && <Text style={{ color:'#f36031', fontWeight:'700' }}>{item.priceText}</Text>}
          {!!item.address && (
            <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text numberOfLines={1} style={{ color:'#6B7280', fontSize:12 }}>{item.address}</Text>
            </View>
          )}
          {!!item.district && (
            <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
              <MaterialCommunityIcons name="map-marker-radius-outline" size={14} color="#6B7280" />
              <Text style={{ color:'#6B7280', fontSize:12 }}>Quận {item.district}</Text>
            </View>
          )}
          {typeof item.available==='number' && (
            <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
              <MaterialCommunityIcons name="grid" size={14} color="#6B7280" />
              <Text style={{ color:'#6B7280', fontSize:12 }}>Còn trống: {item.available} phòng</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
