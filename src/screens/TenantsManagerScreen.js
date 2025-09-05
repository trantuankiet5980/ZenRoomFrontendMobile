import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useHideTabBar from '../hooks/useHideTabBar';

const ORANGE = '#f36031';
const MUTED  = '#9CA3AF';
const BORDER = '#E5E7EB';

export default function TenantsManagerScreen() {
  useHideTabBar();
  const navigation = useNavigation();

  // demo data (thay bằng API)
  const [tenants] = useState([
    // { id:'1', status:'deposit',  name:'Nguyễn Văn A', phone:'0909 000 111', room:'P201 - Tòa A', when:'12/10/2025', note:'Cọc 2tr' },
    // { id:'2', status:'renting', name:'Trần Thị B',    phone:'0912 333 444', room:'P305 - Tòa B', when:'01/10/2025', note:'Chu kỳ tháng' },
  ]);

  const [tab, setTab] = useState('deposit'); // 'deposit' | 'renting'
  const [q, setQ]   = useState('');

  const filtered = useMemo(() => {
    const list = tenants.filter(t => t.status === tab);
    if (!q) return list;
    const needle = q.toLowerCase();
    return list.filter(t =>
      (t.name||'').toLowerCase().includes(needle) ||
      (t.phone||'').toLowerCase().includes(needle) ||
      (t.room||'').toLowerCase().includes(needle)
    );
  }, [tenants, tab, q]);

  const depositCount = tenants.filter(t => t.status === 'deposit').length;
  const rentingCount = tenants.filter(t => t.status === 'renting').length;

  const renderItem = ({ item }) => <TenantCard item={item} tab={tab} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', flex: 1 }}>Quản lý khách thuê</Text>
        <TouchableOpacity onPress={() => console.log('Open calendar')} style={{ padding: 6 }}>
          <Ionicons name="calendar-outline" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{
        margin: 16, height: 44, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12
      }}>
        <Ionicons name="search" size={18} color={MUTED} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nhập thông tin tìm kiếm"
          placeholderTextColor={MUTED}
          style={{ marginLeft: 8, flex: 1 }}
        />
      </View>

      {/* Tabs (giống PostsManager) */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16 }}>
        <Tab
          label={`Đã đặt cọc${depositCount ? `(${depositCount})` : ''}`}
          active={tab === 'deposit'}
          onPress={() => setTab('deposit')}
        />
        <Tab
          label={`Đang thuê${rentingCount ? `(${rentingCount})` : ''}`}
          active={tab === 'renting'}
          onPress={() => setTab('renting')}
        />
      </View>
      <View style={{ height: 2, backgroundColor: BORDER, marginTop: 8 }} />

      {/* List / Empty */}
      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#111' }}>Chưa có dữ liệu</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

/* ----- Sub components y như PostsManager ----- */

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

function TenantCard({ item, tab }) {
  return (
    <View style={{
      borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12, marginBottom: 12
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems:'center' }}>
        <Text style={{ fontWeight: '700' }}>{item.name}</Text>
        <Text style={{ color: '#6B7280' }}>{item.phone}</Text>
      </View>
      <Text style={{ marginTop: 6 }}>Phòng: <Text style={{ fontWeight: '600' }}>{item.room}</Text></Text>
      {!!item.when && <Text style={{ marginTop: 4, color: '#6B7280' }}>Ngày: {item.when}</Text>}
      {!!item.note && <Text style={{ marginTop: 4, color: '#6B7280' }}>{item.note}</Text>}

      <View style={{ flexDirection:'row', gap:10, marginTop:10 }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => console.log('Chi tiết', item.id)}
          style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: BORDER }}
        >
          <Text>Xem</Text>
        </TouchableOpacity>

        {tab === 'deposit' ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => console.log('Xác nhận thuê', item.id)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: ORANGE }}
          >
            <Text style={{ color: '#fff' }}>Xác nhận thuê</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => console.log('Thanh toán', item.id)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: ORANGE }}
          >
            <Text style={{ color: '#fff' }}>Thanh toán</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
