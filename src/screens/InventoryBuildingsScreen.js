import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useHideTabBar from '../hooks/useHideTabBar';

const BORDER = '#E5E7EB';
const MUTED  = '#9CA3AF';

export default function InventoryBuildingsScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // 🚀 DATA DEMO
  const [buildings] = useState([
    { id:'b1', name:'Tòa A - Quận Gò Vấp', address:'123 Nguyễn Văn Nghi', rooms:10, thumbnail:'https://picsum.photos/seed/b1/800/500' },
    { id:'b2', name:'Tòa B - Quận Tân Phú', address:'45 Lũy Bán Bích', rooms:8,  thumbnail:'https://picsum.photos/seed/b2/800/500' },
  ]);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q) return buildings;
    const s = q.toLowerCase();
    return buildings.filter(b =>
      (b.name||'').toLowerCase().includes(s) || (b.address||'').toLowerCase().includes(s)
    );
  }, [buildings, q]);

  const renderItem = ({ item }) => (
    <View style={{ borderWidth:1, borderColor:BORDER, borderRadius:12, overflow:'hidden', marginBottom:12, marginHorizontal:16 }}>
      <Image source={{ uri: item.thumbnail }} style={{ width:'100%', height:160 }} />
      <View style={{ padding:12 }}>
        <Text style={{ fontWeight:'700' }}>{item.name}</Text>
        <Text style={{ color:MUTED, marginTop:4 }}>{item.address}</Text>
        <Text style={{ marginTop:6 }}>Số phòng: {item.rooms}</Text>
      </View>
    </View>
  );

  const Empty = () => (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:24 }}>
      <Image source={require('../../assets/images/empty_building.jpg')} style={{ width:220, height:220, resizeMode:'contain' }} />
      <Text style={{ fontSize:18, fontWeight:'700', color:'#111', marginTop:8 }}>Bạn chưa có tòa nhà nào</Text>
      <Text style={{ color:'#6B7280', textAlign:'center', marginTop:6 }}>
        Nhấn nút thêm tòa nhà để dễ dàng đăng bài cho thuê và vận hành hàng tháng nhé.
      </Text>
    </View>
  );

  return (
    <View style={{ flex:1, backgroundColor:'#fff' }}>
      {/* Header */}
      <View style={{ height:56, flexDirection:'row', alignItems:'center', paddingHorizontal:12, marginTop:30 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding:8, marginRight:4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize:18, fontWeight:'700' }}>Tòa nhà</Text>
      </View>

      {/* Search */}
      <View style={{ margin:16, height:44, borderRadius:12, borderWidth:1, borderColor:BORDER, flexDirection:'row', alignItems:'center', paddingHorizontal:12 }}>
        <Ionicons name="search" size={18} color={MUTED} />
        <TextInput value={q} onChangeText={setQ} placeholder="Nhập tên tòa nhà" placeholderTextColor={MUTED} style={{ marginLeft:8, flex:1 }} />
      </View>

      {filtered.length === 0 ? (
        <Empty />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom:100 }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateBuilding')}
        style={{
          position:'absolute', right:20, bottom:20 + insets.bottom,
          width:56, height:56, borderRadius:28, backgroundColor:'#ef4444',
          alignItems:'center', justifyContent:'center',
          shadowColor:'#000', shadowOpacity:0.2, shadowRadius:8, elevation:4
        }}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
