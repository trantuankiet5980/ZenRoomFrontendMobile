import { View, Text, TextInput } from 'react-native';
export default function InputText({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={{ fontWeight: '600' }}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 15 }}
      />
    </View>
  );
}
