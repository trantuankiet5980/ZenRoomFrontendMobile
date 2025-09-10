import React, { use, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, Image, TouchableOpacity
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useHideTabBar from '../hooks/useHideTabBar';
import { useDispatch, useSelector } from "react-redux";
import { fetchFurnishings } from "../features/furnishings/furnishingsThunks";

const ORANGE = '#f36031';
const ORANGE_SOFT = '#FEE6C9';
const GRAY = '#E5E7EB';
const TEXT_MUTED = '#6B7280';

export default function CreateBuildingScreen() {
  useHideTabBar();

  const nav = useNavigation();
  const dispatch = useDispatch();

  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [addr, setAddr] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [deposit, setDeposit] = useState('');
  const [phone, setPhone] = useState('');
  const [desc, setDesc] = useState('');
  const [furnitures, setFurnitures] = useState([]);
  const [images, setImages] = useState([]);        
  const [video, setVideo] = useState(null);
  const [aptType, setAptType] = useState('');
  const [showTypeModal, setShowTypeModal] = useState(false);

  const [numRooms, setNumRooms] = useState('');
  const [numBaths, setNumBaths] = useState('');
  const [numBeds, setNumBeds] = useState('');

  const [floor, setFloor] = useState('');
  const [roomNo, setRoomNo] = useState('');

  const { items: furnishingsFromApi, loading } = useSelector(state => state.furnishings);

  useEffect(() => {
    dispatch(fetchFurnishings({ page: 0, size: 50 }));
  }, [dispatch]);

  const FURNITURES = [
    { id: "eeec9487-85db-4d54-a5dc-8ac424bbf36f", label: "Điều hòa" },
    { id: "abc9487-85db-4d54-a5dc-8ah324bbf36f", label: "Nóng lạnh" },
    { id: "xyz9487-85db-4d54-a5dc-8ah324bbf36f", label: "Kệ bếp" },
  ];

  const toggleFurniture = (item) => {
    setFurnitures(prev =>
      prev.find(f => f.id === item.furnishingId)
        ? prev.filter(f => f.id !== item.furnishingId)
        : [...prev, { id: item.furnishingId, label: item.furnishingName, quantity: 1 }]
    );
  };
  const APT_TYPES = [
    'Chung cư', 'Duplex', 'Penthouse', 'Căn hộ dịch vụ', 'Mini', 'Tập thể', 'Cư xá'
  ];

  const onSave = () => {
    const payload = {
      propertyType: "BUILDING",
      landlord: { userId: "bc647ad1-55f1-4869-84ba-cf28ecc9ef84" }, // TODO: lấy từ token login
      address: { addressFull: addr },
      title,
      description: desc,
      buildingName: name,
      apartmentCategory: aptType,
      bedrooms: parseInt(numRooms || "0"),
      bathrooms: parseInt(numBaths || "0"),
      floorNo: parseInt(floor || "0"),
      roomNumber: roomNo,
      area: parseFloat(area || "0"),
      price: parseFloat(price || "0"),
      deposit: parseFloat(deposit || "0"),
      furnishings: furnitures.map(f => ({ furnishingId: f.id, quantity: f.quantity })),
    };

    console.log("SAVE BUILDING", payload);
    // TODO: call API
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
        {/* ========== Thông tin căn hộ ========== */}
        <SectionTitle title="Thông tin căn hộ" />
        {/* Tiêu đề bài đăng */}
        <Field
          label="Tiêu đề bài đăng"
          required
          icon={<Ionicons name="document-text" size={18} color={ORANGE} />}
          placeholder="VD: Căn hộ Sunrise full nội thất"
          value={title}
          onChangeText={setTitle}
        />
        {/* Tên căn hộ */}
        <Field
          label="Tên căn hộ"
          required
          icon={<Ionicons name="home" size={18} color={ORANGE} />}
          placeholder="Nhập tên căn hộ"
          value={name}
          onChangeText={setName}
        />
        {/* Địa chỉ */}
        <Field
          label="Địa chỉ"
          required
          icon={<Ionicons name="location" size={18} color={ORANGE} />}
          placeholder="Nhập địa chỉ"
          value={addr}
          onChangeText={setAddr}
        />
        {/* Diện tích */}
        <Field
          label="Diện tích (m²)"
          required
          icon={<MaterialCommunityIcons name="square-foot" size={18} color={ORANGE} />}
          placeholder="VD: 65"
          keyboardType="numeric"
          value={area}
          onChangeText={setArea}
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

        <SectionTitle title="Vị trí căn hộ" />
        {/* Vị trí */}
        <Field
          label="Tầng"
          icon={<Ionicons name="layers" size={18} color={ORANGE} />}
          placeholder="VD: 5"
          value={floor}
          onChangeText={setFloor}
          keyboardType="numeric"
        />
        <Field
          label="Số phòng"
          icon={<MaterialCommunityIcons name="door" size={18} color={ORANGE} />}
          placeholder="VD: 502"
          value={roomNo}
          onChangeText={setRoomNo}
          keyboardType="numeric"
        />
        {/* ========== Chi tiết căn hộ ========== */}
        <SectionTitle title="Chi tiết căn hộ" />

        {/* Loại căn hộ */}
        <Pressable
          onPress={() => setShowTypeModal(true)}
          style={{
            marginTop: 10, borderBottomWidth: 1, borderColor: GRAY,
            flexDirection: 'row', alignItems: 'center', paddingBottom: 8
          }}
        >
          <Ionicons name="business" size={18} color={ORANGE} style={{ marginRight: 6 }} />
          <Text style={{ flex: 1, color: aptType ? '#111' : TEXT_MUTED }}>
            {aptType || 'Chọn loại căn hộ'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#555" />
        </Pressable>

        {/* Số phòng / vệ sinh / ngủ */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
          <CounterSelect label="Số phòng ngủ" value={numRooms} setValue={setNumRooms} />
          <CounterSelect label="Số phòng vệ sinh" value={numBaths} setValue={setNumBaths} />

        </View>
        {/* Nội thất */}
        <FieldLabel icon="cube-outline" text="Nội thất" />
      {loading ? (
        <Text style={{ color: TEXT_MUTED, marginTop: 8 }}>Đang tải...</Text>
      ) : (
        <ChipGrid
          data={furnishingsFromApi.map(f => ({ id: f.furnishingId, label: f.furnishingName }))}
          selected={furnitures.map(f => f.id)}
          onToggle={(id) => {
            const item = furnishingsFromApi.find(f => f.furnishingId === id);
            if (item) toggleFurniture(item);
          }}
        />
      )}
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

        {/* Ảnh + Video */}
        <UploadBox
          title="Ảnh tòa nhà"
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
          title="Video tòa nhà"
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

      {/* Modal chọn loại căn hộ */}
      {showTypeModal && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center'
        }}>
          <View style={{
            backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '80%'
          }}>
            <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 10 }}>Chọn loại căn hộ</Text>
            {APT_TYPES.map((t, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  setAptType(t);
                  setShowTypeModal(false);
                }}
                style={{
                  paddingVertical: 10, borderBottomWidth: i === APT_TYPES.length - 1 ? 0 : 1,
                  borderColor: GRAY
                }}
              >
                <Text style={{ color: '#111' }}>{t}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setShowTypeModal(false)}
              style={{ marginTop: 12, alignSelf: 'flex-end' }}
            >
              <Text style={{ color: ORANGE }}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      )}
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
      {data.map((item) => (
        <Chip
          key={item.id}
          label={item.label}
          active={selected.includes(item.id)}
          onPress={() => onToggle(item.id)}
        />
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

function CounterSelect({ label, value, setValue, min = 0, max = 10 }) {
  const onChange = (text) => {
    const num = parseInt(text || "0");
    if (!isNaN(num) && num >= min && num <= max) {
      setValue(String(num));
    } else if (text === "") {
      setValue("");
    }
  };

  const increase = () => {
    const num = parseInt(value || "0");
    if (num < max) setValue(String(num + 1));
  };

  const decrease = () => {
    const num = parseInt(value || "0");
    if (num > min) setValue(String(num - 1));
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontWeight: "600", marginBottom: 4 }}>{label}</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: 6,
          overflow: "hidden",
          width: 120,
          height: 36,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 14,
            paddingVertical: 0,
          }}
          keyboardType="numeric"
          value={value}
          onChangeText={onChange}
        />
        <View
          style={{
            flexDirection: "column",
            borderLeftWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Pressable
            onPress={increase}
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-up" size={14} color="#333" />
          </Pressable>
          <Pressable
            onPress={decrease}
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-down" size={14} color="#333" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}



