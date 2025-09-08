import React, { useMemo } from 'react';
import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ExploreSection({
  title = 'Khám phá',
  icon = 'business-outline',
  items = [],
  gap = 12,
  itemSize = 86,
  onPressItem,
}) {
  // Chia thành các "cột" — mỗi cột tối đa 2 item (trên/dưới)
  const columns = useMemo(() => {
    const out = [];
    for (let i = 0; i < items.length; i += 2) {
      out.push(items.slice(i, i + 2));
    }
    return out;
  }, [items]);

  return (
    <View style={{ marginTop: 8, marginRight: 20 }}>
      {/* Tiêu đề */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingLeft: 20 }}>
        <Ionicons name={icon} size={22} color="#111827" />
        <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: '700', color: '#111827' }}>
          {title}
        </Text>
      </View>

      {/* Lưới 2 hàng — cuộn ngang */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 0 }}
      >
        <View style={{ flexDirection: 'row' }}>
          {columns.map((col, ci) => (
            <View key={ci} style={{ marginRight: gap, justifyContent: 'space-between' }}>
              {col.map((item, ri) => (
                <Pressable
                  key={item.key ?? `${ci}-${ri}`}
                  onPress={() => onPressItem?.(item)}
                  style={{ marginBottom: ri === 0 ? gap : 0 }}
                >
                  <View
                    style={{
                      width: itemSize,
                      height: itemSize,
                      backgroundColor: '#E5E7EB',
                      borderRadius: 12,
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.imageUri ? (
                      <Image source={item.imageUri} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : null}

                    <View style={{ position: 'absolute', bottom: 6, left: 6, right: 6, alignItems: 'center' }}>
                      <Text numberOfLines={1} style={{ fontSize: 15, color: '#fff', fontWeight: '500',fontWeight: '600' }}>
                        {item.label}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
              {/* Nếu cột chỉ có 1 item, giữ khoảng trống để đúng 2 hàng */}
              {col.length === 1 && <View style={{ width: itemSize, height: itemSize }} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
