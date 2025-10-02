import React, { useEffect, useState } from "react";
import { View, Text, Modal, TouchableOpacity, TextInput } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import RNPickerSelect from "react-native-picker-select";
import {
  fetchProvinces,
  fetchDistricts,
  fetchWards,
} from "../../features/administrative/administrativeThunks";

const AddressPickerModal = ({ visible, onClose, onSelect }) => {
  const dispatch = useDispatch();
  const { provinces, districts, wards } = useSelector(
    (state) => state.administrative
  );

  const [provinceCode, setProvinceCode] = useState(null);
  const [districtCode, setDistrictCode] = useState(null);
  const [wardCode, setWardCode] = useState(null);

  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");

  useEffect(() => {
    if (visible) {
      dispatch(fetchProvinces());
      setProvinceCode(null);
      setDistrictCode(null);
      setWardCode(null);
      setStreet("");
      setHouseNumber("");
    }
  }, [visible]);

  const handleConfirm = () => {
    const province = provinces.find((p) => p.code === provinceCode);
    const district = districts.find((d) => d.code === districtCode);
    const ward = wards.find((w) => w.code === wardCode);

    if (!province || !district || !ward) {
      alert("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã");
      return;
    }

    const addressObj = {
      provinceId: province.code,
      provinceName: province.name_with_type,
      districtId: district.code,
      districtName: district.name_with_type,
      wardId: ward.code,
      wardName: ward.name_with_type,
      street,
      houseNumber,
      addressFull: `${houseNumber ? houseNumber + ", " : ""}${
        street ? street + ", " : ""
      }${ward.name_with_type}, ${district.name_with_type}, ${province.name_with_type}`,
    };

    onSelect(addressObj);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
        <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 16 }}>
          Địa chỉ
        </Text>

        {/* Province */}
        <Text>Chọn tỉnh, thành phố *</Text>
        <RNPickerSelect
          placeholder={{ label: "Chọn tỉnh/thành phố", value: null }}
          items={provinces.map((p) => ({ label: p.name_with_type, value: p.code }))}
          onValueChange={(value) => {
            setProvinceCode(value);
            setDistrictCode(null);
            setWardCode(null);
            if (value) dispatch(fetchDistricts(value));
          }}
          value={provinceCode}
        />

        {/* District */}
        {provinceCode && (
          <>
            <Text style={{ marginTop: 12 }}>Chọn quận, huyện *</Text>
            <RNPickerSelect
              placeholder={{ label: "Chọn quận/huyện", value: null }}
              items={districts.map((d) => ({ label: d.name_with_type, value: d.code }))}
              onValueChange={(value) => {
                setDistrictCode(value);
                setWardCode(null);
                if (value) dispatch(fetchWards(value));
              }}
              value={districtCode}
            />
          </>
        )}

        {/* Ward */}
        {districtCode && (
          <>
            <Text style={{ marginTop: 12 }}>Chọn phường, xã *</Text>
            <RNPickerSelect
              placeholder={{ label: "Chọn phường/xã", value: null }}
              items={wards.map((w) => ({ label: w.name_with_type, value: w.code }))}
              onValueChange={(value) => setWardCode(value)}
              value={wardCode}
            />
          </>
        )}

        {/* Street + House number */}
        {wardCode && (
          <>
            <TextInput
              placeholder="Tên đường"
              value={street}
              onChangeText={setStreet}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                marginTop: 12,
                padding: 8,
                borderRadius: 6,
              }}
            />
            <TextInput
              placeholder="Số nhà"
              value={houseNumber}
              onChangeText={setHouseNumber}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                marginTop: 12,
                padding: 8,
                borderRadius: 6,
              }}
            />
          </>
        )}

        {/* Buttons */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            marginTop: 20,
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 25,
              borderRadius: 6,
              backgroundColor: "#951822ff",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Hủy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleConfirm}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 25,
              borderRadius: 6,
              backgroundColor: "#d35339ff",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Hoàn thành</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AddressPickerModal;
