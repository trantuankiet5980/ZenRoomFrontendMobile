import { View, Text, TouchableOpacity } from 'react-native';
import { AntDesign, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function ActionGrid({ items = [], columns = 3 }) {
  const itemW = `${100 / columns}%`;
  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      backgroundColor: '#fff',
      padding: 12, borderRadius: 12,
      shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2
    }}>
      {items.map((it) => (
        <TouchableOpacity
          key={it.key}
          onPress={it.onPress}
          activeOpacity={0.7}
          style={{ width: itemW, alignItems: 'center', paddingVertical: 14, gap: 8 }}
        >
          {it.iconLib === 'ion' ? (
            <Ionicons name={it.icon} size={26} color="#111827" />
          ) : it.iconLib === 'mc' ? (
            <MaterialCommunityIcons name={it.icon} size={26} color="#111827" />
          ) : it.iconLib === 'fa' ? (
            <FontAwesome5 name={it.icon} size={27} color="#111827" />
          ) : (
            <AntDesign name={it.icon} size={26} color="#111827" />
          )}
          <Text style={{ fontSize: 12, color: '#111827', textAlign: 'center' }}>{it.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
