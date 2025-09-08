import React, { use, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useHideTabBar from '../hooks/useHideTabBar';

const ORANGE = '#f36031';
const ORANGE_SOFT = '#FEE6C9';
const GRAY = '#E5E7EB';
const TEXT_MUTED = '#6B7280';

export default function CreateBuildingScreen() {
    useHideTabBar();

    const nav = useNavigation();

    const [name, setName] = useState('');
    const [addr, setAddr] = useState('');
    const [phone, setPhone] = useState('');
    const [desc, setDesc] = useState('');
    const [roomTypes, setRoomTypes] = useState([]);   // chips
    const [amenities, setAmenities] = useState([]);
    const [furnitures, setFurnitures] = useState([]);
    const [images, setImages] = useState([]);         // [{uri}]
    const [video, setVideo] = useState(null);

    const toggle = (list, setList, val) => {
        setList(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
    };

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

    const onSave = () => {
    // validate + dispatch API
    console.log('SAVE BUILDING', {
      name, addr, phone, desc, roomTypes, amenities, furnitures, images, video,
    });
    // nav.goBack();
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30 }}>
        <Pressable onPress={() => nav.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Thêm tòa nhà</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 130 }}>
        {/* ========== Thông tin tòa nhà ========== */}
        <SectionTitle title="Thông tin tòa nhà" />
        <Field
          label="Tên tòa nhà"
          required
          icon={<Ionicons name="home" size={18} color={ORANGE} />}
          placeholder="Nhập tên tòa nhà"
          value={name}
          onChangeText={setName}
        />
        <Field
          label="Địa chỉ"
          required
          icon={<Ionicons name="location" size={18} color={ORANGE} />}
          placeholder="Nhập địa chỉ"
          value={addr}
          onChangeText={setAddr}
        />

        {/* Dịch vụ toà nhà */}
        <RowCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="construct-outline" size={18} color={ORANGE} />
            <Text style={{ fontWeight: '700' }}>Dịch vụ tòa nhà</Text>
          </View>
          <Pressable
            onPress={() => {}}
            style={{
              marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8,
              backgroundColor: '#fff', borderWidth: 1, borderColor: GRAY, borderRadius: 999
            }}>
            <Text style={{ color: '#111' }}>+</Text>
          </Pressable>
        </RowCard>

        {/* ========== Thông tin bài đăng ========== */}
        <SectionTitle title="Thông tin bài đăng" subtitle="Chỉ bắt buộc các thông tin dưới đây nếu bạn đăng tin." />

        {/* Loại phòng */}
        <FieldLabel icon="apps" text="Loại phòng" />
        <ChipGrid
          data={ROOM_TYPES}
          selected={roomTypes}
          onToggle={(v) => toggle(roomTypes, setRoomTypes, v)}
        />

        {/* Ảnh + Video */}
        <UploadBox
          title="Ảnh tòa nhà"
          subtitle="Tối đa 10 ảnh"
          onPick={() => {
            // TODO: pick image – ở đây demo thêm ảnh giả
            setImages(prev => [...prev, { uri: 'https://picsum.photos/seed/room/400/300' }].slice(0, 10));
          }}
        >
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img.uri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
            ))}
          </View>
        </UploadBox>

        <UploadBox
          title="Video tòa nhà"
          onPick={() => setVideo({ uri: 'https://example.com/demo.mp4' })}
        >
          {video ? (
            <Text style={{ color: TEXT_MUTED }}>Đã chọn video.</Text>
          ) : (
            <Text style={{ color: TEXT_MUTED }}>Chưa chọn video.</Text>
          )}
        </UploadBox>

        {/* SĐT + Mô tả */}
        <Field
          label="Số điện thoại"
          icon={<Ionicons name="call" size={18} color={ORANGE} />}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Field
          label="Mô tả"
          required
          icon={<Ionicons name="pencil" size={18} color={ORANGE} />}
          placeholder="Mô tả tòa nhà"
          value={desc}
          onChangeText={setDesc}
          multiline
        />

        {/* Tiện nghi */}
        <FieldLabel icon="sparkles-outline" text="Tiện nghi" />
        <ChipGrid
          data={AMENITIES}
          selected={amenities}
          onToggle={(v) => toggle(amenities, setAmenities, v)}
        />

        {/* Nội thất */}
        <FieldLabel icon="cube-outline" text="Nội thất" />
        <ChipGrid
          data={FURNITURES}
          selected={furnitures}
          onToggle={(v) => toggle(furnitures, setFurnitures, v)}
        />
      </ScrollView>
      {/* Nút Save dán cứng dưới cùng */}
        <View style={{
            position: 'absolute',
            bottom: 20, left: 0, right: 0,
            backgroundColor: '#fff',
            padding: 12,
            borderTopWidth: 1, borderColor: '#E5E7EB',
        }}>
            <Pressable
            onPress={onSave}
            style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: '#f36031',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Lưu tòa nhà</Text>
            </Pressable>
        </View>
    </View>
    );
}

function SectionTitle({ title, subtitle }) {
  return (
    <View style={{ paddingVertical: 8 }}>
      <Text style={{ color: ORANGE, fontSize: 16, fontWeight: '800', marginBottom: 2 }}>{title}</Text>
      {subtitle ? <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>{subtitle}</Text> : null}
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
