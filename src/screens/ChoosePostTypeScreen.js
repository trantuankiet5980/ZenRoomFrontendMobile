import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ChoosePostTypeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chọn loại bài đăng</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('CreateBuilding')}>
        <Text style={styles.buttonText}>Đăng căn hộ</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('CreateRoom')}>
        <Text style={styles.buttonText}>Đăng phòng</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, marginBottom: 20 },
  button: { backgroundColor: '#f36031', padding: 15, borderRadius: 10, marginVertical: 10, width: '80%' },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16 },
});
