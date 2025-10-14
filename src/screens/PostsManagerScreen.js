import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useHideTabBar from '../hooks/useHideTabBar';
import { useDispatch, useSelector } from "react-redux";
import { fetchPropertiesByLandlord } from "../features/properties/propertiesThunks";
import S3Image from '../components/S3Image';
import { recordUserEvent } from "../features/events/eventsThunks";

const ORANGE = '#f36031';
const MUTED = '#9CA3AF';
const BORDER = '#E5E7EB';

const formatPrice = (p) => {
  const n = Number(p);
  return Number.isFinite(n) ? n.toLocaleString("vi-VN") : p;
};
const formatAddress = (addr = "") => addr.replace(/_/g, " ").trim();

export default function PostsManagerScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const {
    landlordRooms,
    landlordBuildings,
    landlordRoomsPending,
    landlordBuildingsPending,
    loading
  } = useSelector((s) => s.properties);

  const user = useSelector((s) => s.auth.user);

  const [posts, setPosts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [tab, setTab] = useState('active'); // 'pending' | 'active'
  const [q, setQ] = useState('');

  // fetch cả ROOM + BUILDING cho cả APPROVED và PENDING
  useEffect(() => {
    if (user?.userId) {
      ["ROOM", "BUILDING"].forEach(type => {
        dispatch(fetchPropertiesByLandlord({ landlordId: user.userId, postStatus: "APPROVED", type }));
        dispatch(fetchPropertiesByLandlord({ landlordId: user.userId, postStatus: "PENDING", type }));
      });
    }
  }, [dispatch, user?.userId]);

  // Map dữ liệu thành posts
  useEffect(() => {
    const approved = [
      ...(landlordRooms || []).map(p => ({ ...p, propertyType: "ROOM" })),
      ...(landlordBuildings || []).map(p => ({ ...p, propertyType: "BUILDING" }))
    ];

    const pending = [
      ...(landlordRoomsPending || []).map(p => ({ ...p, propertyType: "ROOM" })),
      ...(landlordBuildingsPending || []).map(p => ({ ...p, propertyType: "BUILDING" }))
    ];

    const allPosts = [...approved, ...pending].map(p => ({
      id: p.id || p.propertyId,
      status: p.postStatus
        ? (p.postStatus === "APPROVED" ? "active" : p.postStatus.toLowerCase())
        : "active",
      title: p.title || p.name || "Không có tiêu đề",
      address: typeof p.address === "string"
        ? formatAddress(p.address)
        : formatAddress(p.address?.addressFull || ""),
      price: p.price ? `Từ ${formatPrice(p.price)}đ/ngày` : "Giá liên hệ",
      propertyType: p.propertyType,
      media: p.media || [],        // giữ ảnh
      updatedAt: p.updatedAt || "", // giữ cache
      original: p,
    }));

    setPosts(allPosts);
  }, [landlordRooms, landlordBuildings, landlordRoomsPending, landlordBuildingsPending]);


  // Filter posts theo tab và search
  const filterPosts = useCallback(() => {
    let list = posts.filter(p => p.status === tab);
    if (!q) {
      setFiltered(list);
      return;
    }
    const needle = q.toLowerCase();
    list = list.filter(p =>
      (p.title || '').toLowerCase().includes(needle) ||
      (p.address || '').toLowerCase().includes(needle)
    );
    setFiltered(list);
  }, [posts, tab, q]);

  useEffect(() => {
    filterPosts();
  }, [filterPosts]);

  const pendingCount = posts.filter(p => p.status === 'pending').length;
  const activeCount = posts.filter(p => p.status === 'active').length;

  const renderItem = ({ item }) => <PostCard item={item} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', flex: 1 }}>Bài đăng cho thuê</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreatePostStack')} style={{ padding: 6 }}>
          <Ionicons name="add" size={22} color="#111" />
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

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Đang tải...</Text>
        </View>
      ) : filtered.length === 0 ? (
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
      }} />
    </TouchableOpacity>
  );
}

function PostCard({ item }) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  return (
    <View style={{
      borderWidth: 1, borderColor: BORDER, borderRadius: 12, overflow: 'hidden', marginBottom: 12
    }}>
      <S3Image
        src={
          item.media?.[0]?.url
          || item.original?.rooms?.[0]?.media?.[0]?.url
        }
        cacheKey={item.updatedAt}
        style={{ width: "100%", height: 120, borderRadius: 8 }}
        alt={item.title}
      />


      <View style={{ padding: 12 }}>
        {/* Loại bài đăng */}
        <Text style={{
          color: item.propertyType === "ROOM" ? ORANGE : "#2563eb",
          fontWeight: '700',
          marginBottom: 4
        }}>
          {item.propertyType === "ROOM" ? "Phòng trọ" : "Tòa nhà"}
        </Text>

        <Text numberOfLines={2} style={{ fontWeight: '700' }}>{item.title}</Text>
        {item.address ? (
          <Text style={{ color: MUTED, marginTop: 4 }} numberOfLines={1}>{item.address}</Text>
        ) : null}
        <Text style={{ color: ORANGE, fontWeight: '700', marginTop: 6 }}>{item.price}</Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (item.status === 'pending') {
                const targetScreen = item.propertyType === 'BUILDING' ? 'CreateBuilding' : 'CreateRoom';
                navigation.navigate('CreatePostStack', {
                  screen: targetScreen,
                  params: { mode: 'update', property: item.original || item },
                });
                return;
              }
              
              if (item?.id) {
                dispatch(
                  recordUserEvent({
                    eventType: "VIEW",
                    roomId: item.id,
                    metadata: { source: "posts_manager" },
                  })
                );
              }

              navigation.navigate('PropertyDetail', {
                propertyId: item.id,
                loggedViewEvent: true,
              });
            }}
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
