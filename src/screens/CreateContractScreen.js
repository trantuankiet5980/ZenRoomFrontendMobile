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

export default function CreateContractScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  useHideTabBar();

  // ====== State: Bên thuê ======
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [idFront, setIdFront] = useState(null); // {uri}
  const [idBack, setIdBack] = useState(null);
  const [members, setMembers] = useState([]);   // [{name, phone}...]

  // ====== State: Thông tin thuê ======
  const [selectedBuilding, setSelectedBuilding] = useState(null); // {id,name}
  const [roomNumber, setRoomNumber] = useState('');
  const [dateFrom, setDateFrom] = useState(''); // demo: text
  const [dateTo, setDateTo] = useState('');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [billStartDate, setBillStartDate] = useState(''); // dd/mm/yyyy
  const [paymentCycle, setPaymentCycle] = useState('Hàng tháng'); // chips

  // ====== Dịch vụ, Nội thất, Ảnh, Ghi chú ======
  const [roomImages, setRoomImages] = useState([]);
  const [note, setNote] = useState('');

  const PAYMENT_CYCLES = ['Hàng tuần', 'Hàng tháng', 'Hàng quý', '6 tháng', '1 năm'];

  const onPickBuilding = () => {
    // TODO mở modal chọn toà nhà/phòng
    setSelectedBuilding({ id: 'b1', name: 'Tòa nhà A - P201' });
  };

  const onSubmit = () => {
    console.log('CREATE CONTRACT', {
      tenant: { tenantName, tenantPhone, postTitle, citizenId, idFront, idBack, members },
      rent: {
        building: selectedBuilding, roomNumber, dateFrom, dateTo,
        price, deposit, billStartDate, paymentCycle
      },
      attachments: roomImages,
      note
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: 30 }}>
        <Pressable onPress={() => nav.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Tạo hợp đồng</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 220 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ===== Bên thuê ===== */}
        <SectionTitle title="Bên thuê" />

        <Field
          label="Đại diện bên thuê"
          required
          icon={<Ionicons name="person" size={18} color={ORANGE} />}
          placeholder="Nhập tên người thuê"
          value={tenantName}
          onChangeText={setTenantName}
        />
        <Field
          label="Số điện thoại"
          icon={<Ionicons name="call" size={18} color={ORANGE} />}
          placeholder="Nhập số điện thoại"
          keyboardType="phone-pad"
          value={tenantPhone}
          onChangeText={setTenantPhone}
        />
        <Field
          label="Tiêu đề bài đăng"
          icon={<Ionicons name="pricetag-outline" size={18} color={ORANGE} />}
          placeholder="Nhập tiêu đề bài đăng"
          value={postTitle}
          onChangeText={setPostTitle}
        />

        <Field
          label="Số CMND/CCCD"
          required
          icon={<MaterialCommunityIcons name="card-account-details-outline" size={18} color={ORANGE} />}
          placeholder="Nhập số CMND/CCCD"
          keyboardType="numeric"
          value={citizenId}
          onChangeText={setCitizenId}
        />

        {/* Ảnh CCCD */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
          <UploadSmall
            label="CCCD mặt trước"
            onPick={() => setIdFront({ uri: 'https://picsum.photos/seed/front/400/260' })}
            imageUri={idFront?.uri}
          />
          <UploadSmall
            label="CCCD mặt sau"
            onPick={() => setIdBack({ uri: 'https://picsum.photos/seed/back/400/260' })}
            imageUri={idBack?.uri}
          />
        </View>

        {/* Thành viên còn lại */}
        <RowDivider />
        <RowCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '700' }}>Thành viên còn lại</Text>
            <Pressable
              onPress={() => setMembers(prev => [...prev, { name: '', phone: '' }])}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: GRAY, borderRadius: 999 }}
            >
              <Text>+</Text>
            </Pressable>
          </View>
          {members.map((m, idx) => (
            <View key={idx} style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TextInput
                placeholder="Tên"
                value={m.name}
                onChangeText={(t) => {
                  const cp = [...members]; cp[idx].name = t; setMembers(cp);
                }}
                style={{ flex: 1, borderBottomWidth: 1, borderColor: GRAY, paddingVertical: 6 }}
              />
              <TextInput
                placeholder="SĐT"
                keyboardType="phone-pad"
                value={m.phone}
                onChangeText={(t) => {
                  const cp = [...members]; cp[idx].phone = t; setMembers(cp);
                }}
                style={{ flex: 1, borderBottomWidth: 1, borderColor: GRAY, paddingVertical: 6 }}
              />
            </View>
          ))}
        </RowCard>

        {/* ===== Thông tin thuê ===== */}
        <SectionTitle title="Thông tin thuê" />
        <ListRow
          label="Thông tin tòa nhà"
          leftIcon={<Ionicons name="home" size={18} color={ORANGE} />}
          valueText={selectedBuilding?.name || 'Chọn tòa nhà/phòng'}
          valueMuted={!selectedBuilding}
          onPress={onPickBuilding}
          required
        />
        <Field
          label="Nhập số/tên phòng"
          icon={<Ionicons name="key-outline" size={18} color={ORANGE} />}
          placeholder="Nhập số/tên phòng"
          value={roomNumber}
          onChangeText={setRoomNumber}
        />

        {/* Thời hạn thuê */}
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: '600', marginBottom: 6 }}>Thời hạn thuê</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <UnderlinedInput
              icon={<MaterialCommunityIcons name="calendar-start" size={18} color={ORANGE} />}
              placeholder="Từ ngày"
              value={dateFrom}
              onChangeText={setDateFrom}
            />
            <UnderlinedInput
              icon={<MaterialCommunityIcons name="calendar-end" size={18} color={ORANGE} />}
              placeholder="Đến ngày"
              value={dateTo}
              onChangeText={setDateTo}
            />
          </View>
        </View>

        {/* Giá & Cọc */}
        <Field
          label="Giá phòng"
          required
          icon={<MaterialCommunityIcons name="cash-multiple" size={18} color={ORANGE} />}
          placeholder="Nhập giá phòng"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />
        <Field
          label="Tiền cọc"
          icon={<MaterialCommunityIcons name="cash-lock" size={18} color={ORANGE} />}
          placeholder="Nhập tiền đặt cọc"
          keyboardType="numeric"
          value={deposit}
          onChangeText={setDeposit}
        />
        {/* Ngày bắt đầu tính tiền */}
        <ListRow
          label="Ngày bắt đầu tính tiền"
          required
          leftIcon={<MaterialCommunityIcons name="calendar-check" size={18} color={ORANGE} />}
          valueText={billStartDate || 'Chọn ngày'}
          valueMuted={!billStartDate}
          onPress={() => setBillStartDate('01/10/2025')} // TODO: date picker
        />
        {/* Kỳ thanh toán */}
        <Text style={{ fontWeight: '600', marginTop: 12, marginBottom: 6 }}>Kỳ thanh toán tiền phòng <Text style={{ color: ORANGE }}>*</Text></Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PAYMENT_CYCLES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setPaymentCycle(c)}
              style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                borderWidth: 1, borderColor: paymentCycle === c ? ORANGE : GRAY,
                backgroundColor: paymentCycle === c ? ORANGE_SOFT : '#fff'
              }}
            >
              <Text style={{ color: paymentCycle === c ? ORANGE : '#111' }}>{c}</Text>
            </Pressable>
          ))}
        </View>

        {/* ===== Thông tin dịch vụ & Nội thất ===== */}
        <SectionTitle title="Thông tin dịch vụ" />
        <RowCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="card-outline" size={18} color={ORANGE} />
            <Text style={{ fontWeight: '700' }}>Phí dịch vụ</Text>
          </View>
          <Pressable
            onPress={() => {}}
            style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: GRAY, borderRadius: 999 }}
          >
            <Text>+</Text>
          </Pressable>
        </RowCard>

        <RowCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="cube-outline" size={18} color={ORANGE} />
            <Text style={{ fontWeight: '700' }}>Nội thất</Text>
          </View>
          <Pressable
            onPress={() => {}}
            style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: GRAY, borderRadius: 999 }}
          >
            <Text>+</Text>
          </Pressable>
        </RowCard>

        {/* Ảnh phòng & hợp đồng */}
        <UploadBox
          title="Ảnh phòng & Hợp đồng"
          subtitle="Tối đa 10 ảnh"
          onPick={() => setRoomImages(prev => [...prev, { uri: 'https://picsum.photos/seed/contract/400/300' }].slice(0,10))}
        >
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {roomImages.map((img, i) => (
              <Image key={i} source={{ uri: img.uri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
            ))}
          </View>
        </UploadBox>

        {/* Ghi chú */}
        <Field
          label="Ghi chú"
          icon={<Ionicons name="pencil" size={18} color={ORANGE} />}
          placeholder="Nhập ghi chú"
          value={note}
          onChangeText={setNote}
          multiline
        />
      </ScrollView>

      {/* Footer cố định */}
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
          onPress={onSubmit}
          style={{
            height: 48, borderRadius: 12, backgroundColor: ORANGE,
            alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Tạo hợp đồng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ===== Sub components tái sử dụng ===== */

function SectionTitle({ title }) {
  return (
    <View style={{ paddingVertical: 8 }}>
      <Text style={{ color: ORANGE, fontSize: 16, fontWeight: '800' }}>{title}</Text>
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

function RowDivider() {
  return <View style={{ height: 10, backgroundColor: '#F3F4F6', marginVertical: 12, marginHorizontal: -16 }} />;
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

function UploadSmall({ label, imageUri, onPick }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: TEXT_MUTED, marginBottom: 6 }}>{label}</Text>
      <Pressable
        onPress={onPick}
        style={{
          height: 84, borderRadius: 12, borderWidth: 1, borderColor: ORANGE,
          backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
        ) : (
          <MaterialCommunityIcons name="image-plus" size={22} color={ORANGE} />
        )}
      </Pressable>
    </View>
  );
}

function UnderlinedInput({ icon, placeholder, value, onChangeText }) {
  return (
    <View style={{
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
      borderBottomWidth: 1, borderColor: GRAY, paddingBottom: 6
    }}>
      {icon}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={TEXT_MUTED}
        value={value}
        onChangeText={onChangeText}
        style={{ flex: 1 }}
      />
    </View>
  );
}
