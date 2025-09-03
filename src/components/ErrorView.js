import { View, Text } from 'react-native';
export default function ErrorView({ message }) {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ color: 'tomato' }}>{message || 'Something went wrong'}</Text>
    </View>
  );
}
