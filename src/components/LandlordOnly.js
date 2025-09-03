import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';

export default function LandlordOnly() {
  const role = useSelector((s) => s.auth.user?.role?.toLowerCase?.());
  if (role !== 'landlord') return null;
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Tôi là landlord</Text>
    </View>
  );
}
