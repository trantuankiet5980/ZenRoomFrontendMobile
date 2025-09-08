import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RoomCardCompact from './RoomCardCompact';

export default function ListingCarouselSection({
  title='Phòng giá rẻ', icon='bag-outline',
  items=[], onPressItem, onPressMore, onPressSeeAll,
}) {
  return (
    <View style={{ paddingTop: 8, marginRight: 20 }}>
      <View style={{ paddingHorizontal:20, marginBottom:10, flexDirection:'row',
                     alignItems:'center', justifyContent:'space-between' , marginBottom: 20}}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          <Ionicons name={icon} size={20} color="#111827" />
          <Text style={{ fontSize:18, fontWeight:'700' }}>{title}</Text>
        </View>
        <Pressable onPress={onPressMore}><Text style={{ color:'#f4a753', fontWeight:'700' }}>Xem thêm</Text></Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft:20, paddingRight:12 }}>
        {items.map(it => <RoomCardCompact key={it.id ?? it.key} item={it} onPress={onPressItem} />)}
      </ScrollView>

      <View style={{ paddingHorizontal:20, marginTop: 70, marginBottom:8 }}>
        <Pressable onPress={onPressSeeAll}
          style={{ backgroundColor:'#f36031', height:42, width: 100, borderRadius:15, alignItems:'center', justifyContent:'center', alignSelf:'center' }}>
          <Text style={{ color:'#fff', fontWeight:'700' }}>Xem tất cả</Text>
        </Pressable>
      </View>
    </View>
  );
}
