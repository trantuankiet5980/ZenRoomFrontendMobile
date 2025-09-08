import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, Image, TouchableOpacity
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useHideTabBar from '../hooks/useHideTabBar';

const ORANGE = '#f36031';
const ORANGE_SOFT = '#FEE6C9';
const GRAY = '#E5E7EB';
const TEXT_MUTED = '#6B7280';

export default function CreatePostScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  useHideTabBar();

  // form state
  const [selectedBuilding, setSelectedBuilding] = useState(null); // {id, name} | null
  const [addr, setAddr] = useState('');
  const [title, setTitle] = useState('');
  const [certFire, setCertFire] = useState(false);

  const [phone, setPhone] = useState('0987654321');
  const [desc, setDesc] = useState('');

  const [roomTypes, setRoomTypes] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [furnitures, setFurnitures] = useState([]);
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);

  const ROOM_TYPES = [
    'Phòng trọ','Chung cư','Chung cư mini',
    'Homestay','1 ngủ 1 khách','2 ngủ 1 khách',
    '3 ngủ 1 khách','1 ngủ 1 bếp','2 ngủ 1 bếp','Khác'
  ];
  const AMENITIES = [
    'Vệ sinh khép kín','Gác xép','Ban công','Ra vào vân tay',
    'Không chung chủ','Nuôi pet','Giờ linh hoạt','Gửi xe điện'
  ];
  const FURNITURES = [
    'Điều hòa','Nóng lạnh','Kệ bếp','Tủ lạnh','Giường ngủ','Máy giặt',
    'Đồ dùng bếp','Bàn ghế','Đèn trang trí','Tranh trang trí','Cây cối trang trí',
    'Chăn ga gối','Tủ quần áo','Nệm','Kệ giày dép','Rèm','Quạt trần','Gương toàn thân','Sofa'
  ];

  const toggle = (list, setList, val) => {
    setList(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const onPickBuilding = () => {
    // TODO: mở modal chọn tòa nhà/phòng. Demo chọn giả:
    setSelectedBuilding({ id: 'b1', name: 'Tòa nhà A - P201' });
  };

  const onAddService = () => {
    // TODO: mở sheet thêm dịch vụ toà nhà
  };

  const onSubmitPost = () => {
    console.log('CREATE POST', {
      building: selectedBuilding,
      addr, title, certFire,
      roomTypes, images, video, phone, desc, amenities, furnitures
    });
    // TODO: validate & call API
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30 }}>
        <Pressable onPress={() => nav.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Thêm bài đăng</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 200 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ===== Thông tin tòa nhà ===== */}
        <SectionTitle title="Thông tin tòa nhà" />
        {/* Chọn tòa nhà/phòng */}
        <ListRow
          label="Chọn tòa nhà/phòng"
          required
          leftIcon={<Ionicons name="home" size={18} color={ORANGE} />}
          valueText={selectedBuilding?.name || 'Chọn tòa nhà/phòng'}
          valueMuted={!selectedBuilding}
          onPress={onPickBuilding}
        />
        {/* Địa chỉ */}
        <Field
          label="Địa chỉ" required
          icon={<Ionicons name="location" size={18} color={ORANGE} />}
          placeholder="Nhập địa chỉ"
          value={addr}
          onChangeText={setAddr}
        />
        {/* Tiêu đề */}
        <Field
          label="Tiêu đề bài đăng" required
          icon={<Ionicons name="pricetag-outline" size={18} color={ORANGE} />}
          placeholder="Nhập tiêu đề bài đăng"
          value={title}
          onChangeText={setTitle}
        />
        {/* Checkbox PCCC */}
        <Pressable onPress={() => setCertFire(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <View style={{
            width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: certFire ? ORANGE : GRAY,
            backgroundColor: certFire ? ORANGE : '#fff', alignItems: 'center', justifyContent: 'center'
          }}>
            {certFire ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </View>
          <Text style={{ color: '#111' }}>Tòa nhà đảm bảo hệ thống phòng & chữa cháy</Text>
        </Pressable>

        {/* Dịch vụ tòa nhà */}
        <RowDivider />
        <RowCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="construct-outline" size={18} color={ORANGE} />
            <Text style={{ fontWeight: '700' }}>Dịch vụ tòa nhà</Text>
          </View>
          <Pressable
            onPress={onAddService}
            style={{
              marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8,
              backgroundColor: '#fff', borderWidth: 1, borderColor: GRAY, borderRadius: 999
            }}>
            <Text style={{ color: '#111' }}>+</Text>
          </Pressable>
        </RowCard>

        {/* ===== Thông tin bài đăng ===== */}
        <SectionTitle
          title="Thông tin bài đăng"
          subtitle="Chỉ bắt buộc các thông tin dưới đây nếu bạn đăng tin."
        />

        {/* Loại phòng */}
        <FieldLabel icon="apps" text="Loại phòng" />
        <ChipGrid
          data={ROOM_TYPES}
          selected={roomTypes}
          onToggle={(v) => toggle(roomTypes, setRoomTypes, v)}
        />

        {/* Ảnh / Video */}
        <UploadBox
          title="Ảnh tòa nhà"
          subtitle="Tối đa 10 ảnh"
          onPick={() => setImages(prev => [...prev, { uri: 'https://picsum.photos/seed/post/400/300' }].slice(0,10))}
        >
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img.uri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
            ))}
          </View>
        </UploadBox>

        <UploadBox
          title="Video tòa nhà"
          onPick={() => setVideo({ uri: 'https://example.com/building.mp4' })}
        >
          {video ? <Text style={{ color: TEXT_MUTED }}>Đã chọn video.</Text> : <Text style={{ color: TEXT_MUTED }}>Chưa chọn video.</Text>}
        </UploadBox>

        {/* Số điện thoại & Mô tả */}
        <Field
          label="Số điện thoại" required
          icon={<Ionicons name="call" size={18} color={ORANGE} />}
          placeholder="Nhập số điện thoại"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Field
          label="Mô tả" required
          icon={<Ionicons name="pencil" size={18} color={ORANGE} />}
          placeholder="Mô tả tòa nhà"
          value={desc}
          onChangeText={setDesc}
          multiline
        />

        {/* Tiện nghi & Nội thất */}
        <FieldLabel icon="home-outline" text="Tiện nghi" />
        <ChipGrid data={AMENITIES} selected={amenities} onToggle={(v)=>toggle(amenities,setAmenities,v)} />

        <FieldLabel icon="cube-outline" text="Nội thất" />
        <ChipGrid data={FURNITURES} selected={furnitures} onToggle={(v)=>toggle(furnitures,setFurnitures,v)} />
      </ScrollView>

      {/* Footer: nút Thêm bài đăng (cố định) */}
      <View style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        zIndex: 10, elevation: 8,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10 + insets.bottom,
        borderTopWidth: 1, borderColor: '#E5E7EB'
      }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onSubmitPost}
          style={{
            height: 48, borderRadius: 12, backgroundColor: '#ffa07a',
            alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Thêm bài đăng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ========= Sub-components ========= */

function SectionTitle({ title, subtitle }) {
  return (
    <View style={{ paddingVertical: 8 }}>
      <Text style={{ color: ORANGE, fontSize: 16, fontWeight: '800', marginBottom: 2 }}>{title}</Text>
      {subtitle ? <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>{subtitle}</Text> : null}
    </View>
  );
}

function ListRow({ label, required, leftIcon, valueText, valueMuted, onPress }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontWeight: '600', marginBottom: 6 }}>
        {label} {required ? <Text style={{ color: ORANGE }}>*</Text> : null}
      </Text>
      <Pressable
        onPress={onPress}
        style={{
          height: 44, borderBottomWidth: 1, borderColor: GRAY,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {leftIcon}
          <Text style={{ color: valueMuted ? TEXT_MUTED : '#111' }}>
            {valueText}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={TEXT_MUTED} />
      </Pressable>
    </View>
  );
}

function Field({ label, required, icon, placeholder, value, onChangeText, keyboardType, multiline }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontWeight: '600', marginBottom: 6 }}>
        {label} {required ? <Text style={{ color: ORANGE }}>*</Text> : null}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderBottomWidth: 1, borderColor: GRAY, paddingBottom: 6
      }}>
        {icon}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={TEXT_MUTED}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          style={{ flex: 1, paddingVertical: multiline ? 6 : 0 }}
        />
      </View>
    </View>
  );
}

function FieldLabel({ icon, text }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: ORANGE_SOFT, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={16} color={ORANGE} />
      </View>
      <Text style={{ fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
        borderWidth: 1, borderColor: active ? ORANGE : GRAY,
        backgroundColor: active ? ORANGE_SOFT : '#fff', marginRight: 10, marginBottom: 10
      }}
    >
      <Text style={{ color: active ? ORANGE : '#111' }}>{label}</Text>
    </Pressable>
  );
}

function ChipGrid({ data, selected, onToggle }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
      {data.map((x, i) => (
        <Chip key={i} label={x} active={selected.includes(x)} onPress={() => onToggle(x)} />
      ))}
    </View>
  );
}

function UploadBox({ title, subtitle, onPick, children }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ fontWeight: '700', marginBottom: 8 }}>{title}</Text>
      {subtitle ? <Text style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 6 }}>{subtitle}</Text> : null}
      <Pressable
        onPress={onPick}
        style={{
          height: 90, borderRadius: 12, borderWidth: 1, borderColor: ORANGE,
          backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <MaterialCommunityIcons name="image-plus" size={22} color={ORANGE} />
        <Text style={{ color: ORANGE, fontSize: 12, marginTop: 4 }}>Chọn từ thư viện</Text>
      </Pressable>
      {children ? <View style={{ marginTop: 10 }}>{children}</View> : null}
    </View>
  );
}

function RowDivider() {
  return <View style={{ height: 10, backgroundColor: '#F3F4F6', marginVertical: 12, marginHorizontal: -16 }} />;
}

function RowCard({ children }) {
  return (
    <View style={{
      backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: GRAY, marginTop: 12
    }}>
      {children}
    </View>
  );
}
