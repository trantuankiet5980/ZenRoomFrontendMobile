import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useHideTabBar from '../hooks/useHideTabBar';

const TAB_ACTIVE = '#f36031';
const BORDER = '#E5E7EB';
const MUTED  = '#9CA3AF';

export default function InventoryRoomsScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('empty'); // 'empty' | 'renting'
  const [q, setQ] = useState('');

  // 🚀 DATA DEMO
  const rooms = [
    { id:'r1', name:'P101 - Tòa A', status:'empty',   price:'3.5tr/tháng', thumbnail:'https://picsum.photos/seed/r1/800/500' },
    { id:'r2', name:'P202 - Tòa B', status:'renting', price:'4.0tr/tháng', tenant:'Nguyễn Văn B', thumbnail:'https://picsum.photos/seed/r2/800/500' },
    { id:'r3', name:'P305 - Tòa B', status:'empty',   price:'3.2tr/tháng', thumbnail:'https://picsum.photos/seed/r3/800/500' },
  ];

  const filtered = useMemo(() => {
    let list = rooms.filter(r => r.status === tab);
    if (!q) return list;
    const s = q.toLowerCase();
    return list.filter(r => (r.name||'').toLowerCase().includes(s));
  }, [rooms, tab, q]);

  const renderItem = ({ item }) => (
    <View style={{ borderWidth:1, borderColor:BORDER, borderRadius:12, overflow:'hidden', marginBottom:12, marginHorizontal:16 }}>
      <Image source={{ uri: item.thumbnail }} style={{ width:'100%', height:150 }} />
      <View style={{ padding:12 }}>
        <Text style={{ fontWeight:'700' }}>{item.name}</Text>
        <Text style={{ color:MUTED, marginTop:4 }}>{item.price}</Text>
        <Text style={{ marginTop:6, color: item.status==='empty' ? 'green' : 'red' }}>
          {item.status==='empty' ? 'Còn trống' : `Đang thuê (${item.tenant})`}
        </Text>
      </View>
    </View>
  );

  const Empty = ({ title, subtitle }) => (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:24 }}>
      <Image source={require('../../assets/images/empty_building.jpg')} style={{ width:220, height:220, resizeMode:'contain' }} />
      <Text style={{ fontSize:18, fontWeight:'700', color:'#111', marginTop:8 }}>{title}</Text>
      <Text style={{ color:'#6B7280', textAlign:'center', marginTop:6 }}>{subtitle}</Text>
    </View>
  );

  return (
    <View style={{ flex:1, backgroundColor:'#fff' }}>
      {/* Header */}
      <View style={{ height:56, flexDirection:'row', alignItems:'center', paddingHorizontal:12, marginTop:30 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding:8, marginRight:4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize:18, fontWeight:'700' }}>Phòng trọ</Text>
      </View>

      {/* Search */}
      <View style={{ margin:16, height:44, borderRadius:12, borderWidth:1, borderColor:BORDER, flexDirection:'row', alignItems:'center', paddingHorizontal:12 }}>
        <Ionicons name="search" size={18} color={MUTED} />
        <TextInput value={q} onChangeText={setQ} placeholder="Nhập tên phòng trọ" placeholderTextColor={MUTED} style={{ marginLeft:8, flex:1 }} />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection:'row', paddingHorizontal:16, gap:18 }}>
        <TabButton label="Chưa cho thuê" active={tab==='empty'}   onPress={()=>setTab('empty')} />
        <TabButton label="Đang cho thuê" active={tab==='renting'} onPress={()=>setTab('renting')} />
      </View>
      <View style={{ height:2, backgroundColor:BORDER, marginTop:8 }} />

      {/* List / Empty */}
      {filtered.length === 0 ? (
        <Empty
          title={tab==='empty' ? 'Bạn chưa có phòng nào' : 'Chưa có phòng đang cho thuê'}
          subtitle={tab==='empty'
            ? 'Nhấn nút thêm phòng ngay để dễ dàng đăng bài cho thuê và vận hành hàng tháng nhé.'
            : 'Khi có phòng đang cho thuê, chúng sẽ hiển thị ở đây.'}
        />
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
        onPress={() => navigation.navigate('CreateRoom')}
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

function TabButton({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingVertical:10 }}>
      <Text style={{ fontWeight:'700', color: active ? TAB_ACTIVE : '#9CA3AF' }}>{label}</Text>
      <View style={{ height:3, marginTop:8, backgroundColor: active ? TAB_ACTIVE : 'transparent', borderRadius:2 }}/>
    </TouchableOpacity>
  );
}
