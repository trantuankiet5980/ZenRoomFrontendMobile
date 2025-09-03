import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';

export default function TenantOnly() {
  const role = useSelector((s) => s.auth.user?.role?.toLowerCase?.());
  if (role !== 'tenant') return null; // không phải tenant thì ẩn
  return (
    <View style={{ padding: 16, alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>tôi là tenant</Text>
    </View>
  );
}
