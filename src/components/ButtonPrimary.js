import { TouchableOpacity, Text } from 'react-native';
export default function ButtonPrimary({ title, onPress, disabled, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        { backgroundColor: '#FBB040', padding: 17, borderRadius: 10, alignItems: 'center', opacity: disabled ? 0.6 : 1 },
        style,
      ]}
    >
      <Text style={{ color: '#fff', fontWeight: '600' }}>{title}</Text>
    </TouchableOpacity>
  );
}
