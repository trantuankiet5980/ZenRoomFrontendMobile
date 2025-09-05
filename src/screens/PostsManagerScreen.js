import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useHideTabBar from '../hooks/useHideTabBar';

const ORANGE = '#f36031';
const MUTED = '#9CA3AF';
const BORDER = '#E5E7EB';

export default function PostsManagerScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // demo data (có thể thay bằng API)
  const [posts] = useState([
    // { id:'1', status:'pending', title:'Phòng Q.Gò Vấp 20m²', address:'Nguyễn Văn Nghi', price:'3.5tr/tháng', thumbnail:'https://picsum.photos/seed/p1/320/200' },
    // { id:'2', status:'active',  title:'Căn hộ mini Tân Phú',   address:'Lũy Bán Bích',     price:'4.2tr/tháng', thumbnail:'https://picsum.photos/seed/p2/320/200' },
  ]);
  const [tab, setTab] = useState('active'); // 'pending' | 'active'
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const list = posts.filter(p => p.status === tab);
    if (!q) return list;
    const needle = q.toLowerCase();
    return list.filter(p =>
      (p.title || '').toLowerCase().includes(needle) ||
      (p.address || '').toLowerCase().includes(needle)
    );
  }, [posts, tab, q]);

  const pendingCount = posts.filter(p => p.status === 'pending').length;
  const activeCount  = posts.filter(p => p.status === 'active').length;

  const renderItem = ({ item }) => <PostCard item={item} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', flex: 1 }}>Bài đăng cho thuê phòng</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreatePost')} style={{ padding: 6 }}>
          <Ionicons name="add" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{ margin: 16, height: 44, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
                     flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
        <Ionicons name="search" size={18} color={MUTED} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nhập tiêu đề, địa chỉ..."
          placeholderTextColor={MUTED}
          style={{ marginLeft: 8, flex: 1 }}
        />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16 }}>
        <Tab label={`Đang chờ duyệt${pendingCount ? `(${pendingCount})` : ''}`}
             active={tab === 'pending'}
             onPress={() => setTab('pending')} />
        <Tab label={`Đang hoạt động${activeCount ? `(${activeCount})` : ''}`}
             active={tab === 'active'}
             onPress={() => setTab('active')} />
      </View>
      <View style={{ height: 2, backgroundColor: BORDER, marginTop: 8 }} />

      {/* List / Empty */}
      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#111' }}>Không có bài đăng</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        />
      )}

      {/* FAB Đẩy tin */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => console.log('Boost posts')}
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16 + insets.bottom,
          width: 64, height: 64, borderRadius: 32,
          backgroundColor: '#ef4444',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5
        }}
      >
        <Ionicons name="rocket-outline" size={22} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 2 }}>Đẩy tin</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ----- Sub components ----- */

function Tab({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingVertical: 10, marginRight: 18 }}>
      <Text style={{ fontWeight: '700', color: active ? ORANGE : MUTED }}>{label}</Text>
      <View style={{
        height: 3, marginTop: 8,
        backgroundColor: active ? ORANGE : 'transparent', borderRadius: 2
      }}/>
    </TouchableOpacity>
  );
}

function PostCard({ item }) {
  return (
    <View style={{
      borderWidth: 1, borderColor: BORDER, borderRadius: 12, overflow: 'hidden', marginBottom: 12
    }}>
      <Image source={{ uri: item.thumbnail }} style={{ width: '100%', height: 160 }} />
      <View style={{ padding: 12 }}>
        <Text numberOfLines={2} style={{ fontWeight: '700' }}>{item.title}</Text>
        <Text style={{ color: MUTED, marginTop: 4 }} numberOfLines={1}>{item.address}</Text>
        <Text style={{ color: ORANGE, fontWeight: '700', marginTop: 6 }}>{item.price}</Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => console.log('Xem chi tiết', item.id)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: BORDER }}
          >
            <Text>Xem</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => console.log('Ẩn bài', item.id)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: ORANGE }}
          >
            <Text style={{ color: '#fff' }}>Ẩn</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
