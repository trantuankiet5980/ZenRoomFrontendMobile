import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, Image, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useHideTabBar from '../hooks/useHideTabBar';
import { useDispatch, useSelector } from "react-redux";
import { fetchFurnishings } from "../features/furnishings/furnishingsThunks";
import { createProperty, updateProperty } from "../features/properties/propertiesThunks";
import { resetStatus } from "../features/properties/propertiesSlice";
import * as ImagePicker from "expo-image-picker";
import { fetchApartmentCategories } from '../features/apartmentCategory/apartmentThunks';
import { uploadPropertyImages, uploadPropertyVideo } from "../features/propertyMedia/propertyMediaThunks";
import AddressPickerModal from '../components/modal/AddressPickerModal';

const ORANGE = '#f36031';
const ORANGE_SOFT = '#FEE6C9';
const GRAY = '#E5E7EB';
const TEXT_MUTED = '#6B7280';

export default function CreateBuildingScreen() {
  useHideTabBar();

  const nav = useNavigation();
  const dispatch = useDispatch();

  const [title, setTitle] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [addr, setAddr] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [deposit, setDeposit] = useState('');
  const [desc, setDesc] = useState('');
  const [furnitures, setFurnitures] = useState([]);
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [aptType, setAptType] = useState('');
  const [showTypeModal, setShowTypeModal] = useState(false);

  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');

  const [floor, setFloor] = useState('');
  const [roomNo, setRoomNo] = useState('');

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressObj, setAddressObj] = useState(null);

  const { items: furnishingsFromApi, loading } = useSelector(state => state.furnishings);
  const { loadings, success, error } = useSelector(state => state.properties);

  useEffect(() => {
    dispatch(fetchFurnishings({ page: 0, size: 50 }));
  }, [dispatch]);


  const { categories: apartmentCategories = [], loading: apartmentLoading } = useSelector(
    state => state.apartment || {}
  );

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImages(prev => [...prev, ...result.assets].slice(0, 10));
    }
  };
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (!result.canceled) {
      const video = result.assets[0];
      if (video.fileSize && video.fileSize > 25 * 1024 * 1024) {
        Alert.alert("Lỗi", "Video quá lớn, vui lòng chọn file dưới 50MB");
        return;
      }
      setVideo(video);
    }
  };
  useEffect(() => {
    dispatch(fetchApartmentCategories());
  }, [dispatch]);

  const toggleFurniture = (item) => {
    setFurnitures(prev =>
      prev.find(f => f.id === item.furnishingId)
        ? prev.filter(f => f.id !== item.furnishingId)
        : [...prev, { id: item.furnishingId, label: item.furnishingName, quantity: 1 }]
    );
  };
  const userId = useSelector(state => state.auth.user?.userId);
  const onSave = () => {

    if (!title || !buildingName || !addressObj || !price || !area || !aptType) {
  Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường bắt buộc.');
  return;
}

    const payload = {
      propertyType: "BUILDING",
      landlord: { userId: userId },
      address: addressObj,
      title,
      description: desc,
      buildingName: buildingName,
      apartmentCategory: aptType,
      bedrooms: parseInt(bedrooms || "0"),
      bathrooms: parseInt(bathrooms || "0"),
      floorNo: parseInt(floor || "0"),
      roomNumber: roomNo,
      area: parseFloat(area || "0"),
      price: parseFloat(price || "0"),
      deposit: parseFloat(deposit || "0"),
      furnishings: furnitures.map(f => ({
        furnishingId: f.id,
        quantity: f.quantity,
      })),
    };
    dispatch(createProperty(payload))
      .unwrap()
      .then((newProperty) => {
        console.log("New property response:", newProperty);
        const propertyId = newProperty.id || newProperty.propertyId;
        if (!propertyId) {
          throw new Error("Property ID is missing in response");
        }

        // Upload images if any
        if (images.length > 0) {
          dispatch(uploadPropertyImages({ propertyId, images }))
            .unwrap()
            .catch(err => {
              console.error("Upload ảnh thất bại", err);
              Alert.alert("Lỗi", "Không thể tải lên ảnh: " + (err.message || "Lỗi không xác định"));
            });
        }

        // Upload video if any
        if (video) {
          dispatch(uploadPropertyVideo({ propertyId, video }))
            .unwrap()
            .catch(err => {
              console.error("Upload video thất bại", err);
              Alert.alert("Lỗi", "Không thể tải lên video: " + (err.message || "Lỗi không xác định"));
            });
        }

        Alert.alert("Thành công", "Đăng căn hộ thành công!");
        nav.navigate("PostsManager");
      })
      .catch((err) => {
        console.error("Create property failed:", err);
        Alert.alert("Lỗi", err.message || "Đăng căn hộ thất bại");
      });
  };
  useEffect(() => {
    if (success) {
      setTitle('');
      setBuildingName('');
      setAddr('');
      setPrice('');
      setArea('');
      setDeposit('');
      setDesc('');
      setFurnitures([]);
      setImages([]);
      setVideo(null);
      setAptType('');
      setBedrooms('');
      setBathrooms('');
      setFloor('');
      setRoomNo('');


      dispatch(resetStatus());
      nav.navigate('PostsManager');
    }
  }, [success]);

  const catMap = {
    CHUNG_CU: "Chung cư",
    DUPLEX: "Duplex",
    PENTHOUSE: "Penthouse"
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30 }}>
        <Pressable onPress={() => nav.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Thêm căn hộ</Text>
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
          value={buildingName}
          onChangeText={setBuildingName}
        />
        {/* Địa chỉ */}
        <View style={{ marginBottom: 0 }}>
          <Text style={{ fontWeight: "600", marginBottom: 6 }}>
            Địa chỉ <Text style={{ color: "red" }}>*</Text>
          </Text>
          <Pressable
            onPress={() => setShowAddressModal(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              padding: 10,
              backgroundColor: "#fff",
            }}
          >
            <Ionicons name="location" size={18} color={ORANGE} style={{ marginRight: 8 }} />
            <Text style={{ color: addressObj ? "#000" : "#9CA3AF" }}>
              {addressObj?.addressFull || "Chọn địa chỉ"}
            </Text>
          </Pressable>
        </View>

        {/* Diện tích */}
        <Field
          label="Diện tích (m²)"
          required
          icon={<MaterialIcons name="square-foot" size={18} color={ORANGE} />}
          placeholder="VD: 65"
          keyboardType="numeric"
          value={area}
          onChangeText={setArea}
        />
        {/* Giá phòng */}
        <Field
          label="Giá phòng" required
          icon={<MaterialCommunityIcons name="cash-multiple" size={18} color={ORANGE} />}
          placeholder="Nhập giá phòng/ngày"
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
          <CounterSelect label="Số phòng ngủ" value={bedrooms} setValue={setBedrooms} />
          <CounterSelect label="Số phòng vệ sinh" value={bathrooms} setValue={setBathrooms} />

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
          onPick={pickImages}
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
          onPick={pickVideo}
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
        <TouchableOpacity
          onPress={onSave}
          style={{
            height: 48,
            borderRadius: 12,
            backgroundColor: '#f36031',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Đăng tòa nhà</Text>
        </TouchableOpacity>
      </View>

      <AddressPickerModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSelect={(addr) => setAddressObj(addr)}
      />


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

            {apartmentLoading ? (
              <Text>Đang tải...</Text>
            ) : (
              apartmentCategories.map((cat, i) => (
                <Pressable
                  key={cat}
                  onPress={() => {
                    setAptType(cat);
                    setShowTypeModal(false);
                  }}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: i === apartmentCategories.length - 1 ? 0 : 1,
                    borderColor: GRAY
                  }}
                >
                  <Text>{catMap[cat] || cat}</Text>
                </Pressable>
              ))
            )}

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



