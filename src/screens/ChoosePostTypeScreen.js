import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChoosePostTypeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header với nút back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn loại bài đăng</Text>
      </View>

      {/* Các nút lựa chọn */}
      <View style={styles.buttonWrapper}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50, // đẩy xuống một chút cho an toàn với status bar
    marginBottom: 30,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#f36031',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '90%',
  },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '500' },
});
