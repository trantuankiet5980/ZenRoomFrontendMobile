import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, Image, TouchableOpacity
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useHideTabBar from '../hooks/useHideTabBar';

const ORANGE = '#f36031';
const ORANGE_SOFT = '#FEE6C9';
const GRAY = '#E5E7EB';
const TEXT_MUTED = '#6B7280';

export default function CreateRoomScreen() {
  const nav = useNavigation();
  useHideTabBar();

  // state
  const [roomName, setRoomName] = useState('');
  const [addr, setAddr] = useState('');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [floor, setFloor] = useState('');
  const [capacity, setCapacity] = useState('');
  const [parking, setParking] = useState('');
  const [desc, setDesc] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');

  const [images, setImages] = useState([]);           // [{uri}]
  const [video, setVideo] = useState(null);

  const toggle = (list, setList, val) => {
    setList(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };


  const onSave = () => {
    console.log('SAVE ROOM', {
      roomName, addr, price, deposit, salePrice, saleDuration,
      floor, capacity, parking, desc,
      phone, area,
      roomTypes, amenities, furnitures, images, video
    });
  };

  const onCreatePost = () => {
    console.log('CREATE POST WITH ROOM');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header*/}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30 }}>
        <Pressable onPress={() => nav.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Thêm phòng trọ</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 180 }}
      >
        {/* ========== Thông tin phòng ========== */}
        <SectionTitle title="Thông tin phòng" />
        <Field
          label="Số/Tên phòng" required
          icon={<Ionicons name="home" size={18} color={ORANGE} />}
          placeholder="Nhập số/tên phòng"
          value={roomName}
          onChangeText={setRoomName}
        />
        <Field
          label="Địa chỉ" required
          icon={<Ionicons name="location" size={18} color={ORANGE} />}
          placeholder="Nhập địa chỉ"
          value={addr}
          onChangeText={setAddr}
        />
        {/* Giá phòng */}
        <Field
          label="Giá phòng" required
          icon={<MaterialCommunityIcons name="cash-multiple" size={18} color={ORANGE} />}
          placeholder="Nhập giá phòng"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />
        {/* Tiền cọc */}
        <Field
          label="Tiền cọc"
          icon={<MaterialCommunityIcons name="cash-lock" size={18} color={ORANGE} />}
          placeholder="Nhập tiền đặt cọc"
          keyboardType="numeric"
          value={deposit}
          onChangeText={setDeposit}
        />
        {/* Số điện thoại */}
        <Field
          label="Số điện thoại"
          required
          icon={<Ionicons name="call" size={18} color={ORANGE} />}
          placeholder="Nhập số điện thoại"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {/* Diện tích */}
        <Field
          label="Diện tích (m²)"
          required
          icon={<MaterialCommunityIcons name="ruler-square" size={18} color={ORANGE} />}
          placeholder="Nhập diện tích phòng"
          keyboardType="numeric"
          value={area}
          onChangeText={setArea}
        />
        <Field
          label="Tầng"
          icon={<MaterialCommunityIcons name="stairs-up" size={18} color={ORANGE} />}
          placeholder="Nhập tầng"
          keyboardType="numeric"
          value={floor}
          onChangeText={setFloor}
        />
        <Field
          label="Sức chứa (Người/phòng)"
          icon={<Ionicons name="people-outline" size={18} color={ORANGE} />}
          placeholder="Nhập số Người/Phòng"
          keyboardType="numeric"
          value={capacity}
          onChangeText={setCapacity}
        />
        <Field
          label="Số chỗ đỗ xe"
          icon={<MaterialCommunityIcons name="numeric" size={18} color={ORANGE} />}
          placeholder="Nhập số chỗ để xe"
          keyboardType="numeric"
          value={parking}
          onChangeText={setParking}
        />
        <SectionTitle
          title="TIÊU ĐỀ TIN ĐĂNG VÀ MÔ TẢ CHI TIẾT"
          subtitle="Chỉ bắt buộc các thông tin dưới đây nếu bạn đăng tin."
        />
        <Field
          label="Tiêu đề tin đăng"
          icon={<Ionicons name="document-text" size={18} color={ORANGE} />}
          placeholder="Ví dụ: Phòng trọ mới xây, đầy đủ tiện nghi, giá tốt"
          value={roomName ? `Phòng trọ ${roomName} - ${addr} - Giá ${price} triệu` : ''}
          onChangeText={setRoomName}
        />
        {/* Mô tả */}
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: '600', marginBottom: 6 }}>
            Mô tả <Text style={{ color: ORANGE }}>*</Text>
          </Text>
          <View style={{
            borderWidth: 1,
            borderColor: GRAY,
            borderRadius: 8,
            padding: 8,
            minHeight: 100,
          }}>
            <TextInput
              placeholder="Nhập mô tả chi tiết về phòng trọ..."
              placeholderTextColor={TEXT_MUTED}
              value={desc}
              onChangeText={setDesc}
              multiline
              style={{ flex: 1, textAlignVertical: 'top' }}
            />
          </View>
        </View>

        <UploadBox
          title="Ảnh phòng trọ"
          subtitle="Tối đa 10 ảnh"
          onPick={() => setImages(prev => [...prev, { uri: 'https://picsum.photos/seed/room/400/300' }].slice(0, 10))}
        >
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {images.map((img, i) => (
              <View key={i} style={{ position: 'relative' }}>
                <Image source={{ uri: img.uri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
                <TouchableOpacity
                  onPress={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    backgroundColor: '#f87171', borderRadius: 12, padding: 2
                  }}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </UploadBox>

        <UploadBox
          title="Video phòng trọ"
          onPick={() => setVideo({ uri: 'https://example.com/room.mp4' })}
        >
          {video ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: TEXT_MUTED }}>Đã chọn video.</Text>
              <TouchableOpacity
                onPress={() => setVideo(null)}
                style={{
                  backgroundColor: '#f87171', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12 }}>Xóa</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={{ color: TEXT_MUTED }}>Chưa chọn video.</Text>
          )}
        </UploadBox>
      </ScrollView>



      {/* Thanh hành động cố định dưới đáy */}
      <View style={{
        position: 'absolute',
        bottom: 20, left: 0, right: 0,
        backgroundColor: '#fff',
        padding: 12,
        borderTopWidth: 1, borderColor: '#E5E7EB'
      }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={onSave}
            style={{
              flex: 1, height: 48, borderRadius: 12, backgroundColor: ORANGE,
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Lưu phòng trọ</Text>
          </Pressable>
          <Pressable
            onPress={onCreatePost}
            style={{
              flex: 1, height: 48, borderRadius: 12, backgroundColor: '#ffa07a',
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Tạo tin đăng</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ---------- Sub components (reuse CreateBuilding style) ---------- */

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
