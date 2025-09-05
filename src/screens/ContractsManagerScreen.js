import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useHideTabBar from '../hooks/useHideTabBar';

const ORANGE = '#f36031';
const MUTED  = '#9CA3AF';
const BORDER = '#E5E7EB';

export default function ContractsManagerScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // demo data – thay bằng API
  const [contracts] = useState([
    { id:'c1', status:'pending', tenant:'Nguyễn A', phone:'0909...', room:'P201 - Tòa A', start:'01/10/2025', end:'01/10/2026' },
    { id:'c2', status:'active',  tenant:'Trần B',    phone:'0912...', room:'P305 - Tòa B', start:'01/09/2025', end:'01/09/2026' },
    { id:'c3', status:'expired', tenant:'Lê C',      phone:'0933...', room:'P102 - Tòa C', start:'01/08/2024', end:'01/08/2025' },
  ]);

  const [tab, setTab] = useState('pending'); // 'pending' | 'active' | 'expired'
  const [q, setQ]   = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [building, setBuilding] = useState(null); // ex: 'Tòa A'

  const filtered = useMemo(() => {
    let list = contracts.filter(c => c.status === tab);
    if (building) list = list.filter(c => (c.room||'').includes(building));
    if (!q) return list;
    const needle = q.toLowerCase();
    return list.filter(c =>
      (c.room||'').toLowerCase().includes(needle) ||
      (c.tenant||'').toLowerCase().includes(needle) ||
      (c.phone||'').toLowerCase().includes(needle)
    );
  }, [contracts, tab, q, building]);

  const pendingCount = contracts.filter(c => c.status === 'pending').length;
  const activeCount  = contracts.filter(c => c.status === 'active').length;
  const expiredCount = contracts.filter(c => c.status === 'expired').length;

  const renderItem = ({ item }) => <ContractCard item={item} tab={tab} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', flex: 1 }}>Hợp đồng</Text>
        <TouchableOpacity onPress={() => console.log('Open calendar')} style={{ padding: 6 }}>
          <Ionicons name="calendar-outline" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{
        marginHorizontal: 16, marginTop: 10,
        height: 44, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12
      }}>
        <Ionicons name="search" size={18} color={MUTED} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Nhập số phòng, tên, số điện thoại..."
          placeholderTextColor={MUTED}
          style={{ marginLeft: 8, flex: 1 }}
        />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 10 }}>
        <Tab label={`Chờ xác nhận${pendingCount ? `(${pendingCount})` : ''}`} active={tab==='pending'} onPress={()=>setTab('pending')} />
        <Tab label={`Còn hiệu lực${activeCount ? `(${activeCount})` : ''}`}   active={tab==='active'}  onPress={()=>setTab('active')} />
        <Tab label={`Hết hiệu lực${expiredCount ? `(${expiredCount})` : ''}`} active={tab==='expired'} onPress={()=>setTab('expired')} />
      </View>
      <View style={{ height: 2, backgroundColor: BORDER, marginTop: 8 }} />

      {/* Filter by building (simple dropdown) */}
      <TouchableOpacity
        onPress={() => setFilterOpen(v => !v)}
        style={{ flexDirection:'row', alignItems:'center', justifyContent:'flex-end', paddingHorizontal:16, paddingVertical:10 }}
      >
        <Text style={{ fontWeight:'700', color:'#111' }}>
          {`Lọc theo tòa nhà${building ? `: ${building}` : ''}  `}
        </Text>
        <Ionicons name={filterOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#111" />
      </TouchableOpacity>
      {filterOpen && (
        <View style={{ paddingHorizontal:16, paddingBottom:8, flexDirection:'row', flexWrap:'wrap', gap:8 }}>
          {['Tòa A','Tòa B','Tòa C'].map(b => (
            <TouchableOpacity
              key={b}
              onPress={() => { setBuilding(b === building ? null : b); setFilterOpen(false); }}
              style={{
                paddingHorizontal:12, paddingVertical:8, borderRadius:999,
                borderWidth:1, borderColor: building===b ? ORANGE : BORDER,
                backgroundColor: building===b ? '#FEE6C9' : '#fff', marginRight:8, marginBottom:8
              }}>
              <Text style={{ color: building===b ? ORANGE : '#111' }}>{b}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* List / Empty */}
      {filtered.length === 0 ? (
        <EmptyContracts />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        />
      )}

      {/* FAB: tạo hợp đồng */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CreateContract')}
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
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* ---------- Sub components ---------- */

function Tab({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingVertical: 10, marginRight: 18 }}>
      <Text style={{ fontWeight: '700', color: active ? ORANGE : MUTED }}>{label}</Text>
      <View style={{ height: 3, marginTop: 8, backgroundColor: active ? ORANGE : 'transparent', borderRadius: 2 }}/>
    </TouchableOpacity>
  );
}

function EmptyContracts() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
      {/* thay ảnh empty của bạn */}
      {/* <Image source={require('../../assets/images/empty_building.png')} style={{ width: 220, height: 220, resizeMode:'contain' }} /> */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#111', marginTop: 8 }}>
        Bạn chưa có hợp đồng nào
      </Text>
      <Text style={{ color: '#6B7280', textAlign:'center', marginTop: 6 }}>
        Nhấn nút thêm hợp đồng ngay để quản lý hợp đồng và hoá đơn hàng tháng nhé.
      </Text>
    </View>
  );
}

function ContractCard({ item, tab }) {
  return (
    <View style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12, marginBottom: 12 }}>
      <Text style={{ fontWeight: '700' }}>{item.room}</Text>
      <Text style={{ marginTop: 4 }}>Khách thuê: <Text style={{ fontWeight: '600' }}>{item.tenant}</Text></Text>
      <Text style={{ marginTop: 4, color: '#6B7280' }}>{item.phone}</Text>
      <Text style={{ marginTop: 6 }}>Hiệu lực: {item.start} → {item.end}</Text>

      <View style={{ flexDirection:'row', gap:10, marginTop:10 }}>
        <TouchableOpacity
          onPress={() => console.log('Chi tiết', item.id)}
          style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: BORDER }}
        >
          <Text>Xem</Text>
        </TouchableOpacity>

        {tab === 'pending' && (
          <TouchableOpacity
            onPress={() => console.log('Xác nhận HĐ', item.id)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: ORANGE }}
          >
            <Text style={{ color: '#fff' }}>Xác nhận</Text>
          </TouchableOpacity>
        )}
        {tab === 'active' && (
          <TouchableOpacity
            onPress={() => console.log('Tạo hóa đơn', item.id)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: ORANGE }}
          >
            <Text style={{ color: '#fff' }}>Tạo hóa đơn</Text>
          </TouchableOpacity>
        )}
        {tab === 'expired' && (
          <TouchableOpacity
            onPress={() => console.log('Gia hạn', item.id)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: ORANGE }}
          >
            <Text style={{ color: '#fff' }}>Gia hạn</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
