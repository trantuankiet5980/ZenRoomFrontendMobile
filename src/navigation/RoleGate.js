import { useSelector } from 'react-redux';
import { View, Text } from 'react-native';

export default function RoleGate({ allow = [], children }) {
  const role = useSelector((s) => s.auth.user?.role?.toLowerCase?.());
  const allowList = allow.map((r) => r.toLowerCase());
  if (!allowList.includes(role)) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Không có quyền truy cập.</Text>
      </View>
    );
  }
  return children;
}
