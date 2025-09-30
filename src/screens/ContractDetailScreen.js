import React, { useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { fetchContractById } from "../features/contracts/contractThunks";
import {
  selectContractDetail,
  selectContractsLoading,
} from "../features/contracts/contractSlice";

export default function ContractDetailScreen() {
  const route = useRoute();
  const { contractId } = route.params;
  const dispatch = useDispatch();
  const contract = useSelector(selectContractDetail);
  const loading = useSelector(selectContractsLoading);

  useEffect(() => {
    dispatch(fetchContractById(contractId));
  }, [contractId]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  if (!contract) {
    return <Text>Không tìm thấy hợp đồng</Text>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
        HỢP ĐỒNG THUÊ PHÒNG
      </Text>

      <Text>Bên thuê: {contract.tenantName} - {contract.tenantPhone}</Text>
      <Text>CCCD: {contract.citizenId}</Text>
      <Text>Tòa nhà: {contract.buildingName}</Text>
      <Text>Phòng: {contract.roomNumber}</Text>
      <Text>Ngày bắt đầu: {contract.startDate}</Text>
      <Text>Ngày kết thúc: {contract.endDate}</Text>
      <Text>Giá thuê: {contract.rentPrice} VND</Text>
      <Text>Đặt cọc: {contract.deposit} VND</Text>
      <Text>Ghi chú: {contract.notes}</Text>
    </ScrollView>
  );
}
