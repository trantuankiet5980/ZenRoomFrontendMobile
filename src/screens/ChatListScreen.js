import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ORANGE='#f36031', MUTED='#9CA3AF', BORDER='#E5E7EB', GREEN='#CBE7A7';

const DEMO = [
  { id:'1', name:'Hỗ trợ tìm phòng', last:'Chào bạn, mình hỗ trợ được gì?', time:'09:21', unread:2, role:'support',
    avatar:'https://i.pravatar.cc/100?img=32' },
  { id:'2', name:'Văn Kiệt',          last:'Oke anh nhé',                 time:'Hôm qua', unread:0, role:'tenant',
    avatar:null },
  { id:'3', name:'Trần Mai',           last:'Em muốn đặt phòng', time:'CN',     unread:1, role:'tenant',
    avatar:'https://i.pravatar.cc/100?img=12' },
];

export default function ChatListScreen() {
  const navigation = useNavigation();

  const [tab, setTab] = useState('all'); // 'all' | 'tenant'
  const [q, setQ] = useState('');

  const data = useMemo(() => {
    let d = tab === 'tenant' ? DEMO.filter(x=>x.role==='tenant') : DEMO;
    if (!q) return d;
    const s = q.toLowerCase();
    return d.filter(x => x.name.toLowerCase().includes(s) || (x.last||'').toLowerCase().includes(s));
  }, [tab, q]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ChatDetail', { chatId: item.id, name: item.name, avatar:item.avatar })}
      style={{
        marginHorizontal:16, marginTop:12, borderRadius:16, backgroundColor:'#fff',
        shadowColor:'#000', shadowOpacity:0.06, shadowRadius:6, elevation:2, padding:12, flexDirection:'row', alignItems:'center'
      }}
    >
      <Avatar uri={item.avatar} />
      <View style={{ flex:1, marginLeft:12 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
          <Text style={{ fontWeight:'700' }} numberOfLines={1}>{item.name}</Text>
          <Text style={{ color:MUTED, fontSize:12 }}>{item.time}</Text>
        </View>
        <Text style={{ color:MUTED, marginTop:4 }} numberOfLines={1}>{item.last}</Text>
      </View>
      {item.unread > 0 && (
        <View style={{
          marginLeft:8, minWidth:22, height:22, borderRadius:11, backgroundColor:ORANGE,
          alignItems:'center', justifyContent:'center', paddingHorizontal:6
        }}>
          <Text style={{ color:'#fff', fontSize:12, fontWeight:'700' }}>{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex:1, backgroundColor:'#F8F8F8' }}>
      {/* Header */}
      <View style={{ paddingTop:30, paddingHorizontal:16, paddingBottom:12, backgroundColor:'#fff', borderBottomWidth:1, borderColor:'#F2F2F2' }}>
        <View style={{ flexDirection:'row', alignItems:'center' }}>
          <Text style={{ fontSize:20, fontWeight:'800', flex:1 }}>Tin nhắn</Text>
          <Ionicons name="search" size={20} color="#111" />
        </View>

        {/* Tabs */}
        <View style={{ marginTop:12, flexDirection:'row', gap:12 }}>
          <TabPill label="Tất cả" active={tab==='all'} onPress={()=>setTab('all')} />
          <TabPill label="Khách thuê" active={tab==='tenant'} onPress={()=>setTab('tenant')} />
        </View>

        {/* Search box */}
        <View style={{
          marginTop:10, height:40, borderRadius:12, borderWidth:1, borderColor:BORDER,
          flexDirection:'row', alignItems:'center', paddingHorizontal:10
        }}>
          <Ionicons name="search" size={16} color={MUTED} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Tìm theo tên, nội dung…"
            placeholderTextColor={MUTED}
            style={{ marginLeft:8, flex:1 }}
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={(it)=>String(it.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical:8, paddingBottom:24 }}
      />
    </View>
  );
}

function TabPill({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal:14, paddingVertical:8, borderRadius:999,
        backgroundColor: active ? GREEN : '#F2F4F5',
      }}>
      <Text style={{ fontWeight:'700', color: active ? '#2E7D32' : '#111' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Avatar({ uri }) {
  if (!uri) {
    return (
      <View style={{
        width:42, height:42, borderRadius:21, backgroundColor:'#FFE1E1',
        alignItems:'center', justifyContent:'center'
      }}>
        <Ionicons name="person" size={22} color="#E26666" />
      </View>
    );
  }
  return <Image source={{ uri }} style={{ width:42, height:42, borderRadius:21 }} />;
}
