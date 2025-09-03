import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface SidebarProps {
  onNavigate: (screen: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const [active, setActive] = useState("Home");

  const menu = [
    { key: "Home", label: "Trang chủ", icon: "home" },
    { key: "Video", label: "Lướt video", icon: "video" },
    { key: "Chat", label: "Tin nhắn", icon: "message-text" },
    { key: "Profile", label: "Cá nhân", icon: "account" },
  ];

  const handlePress = (screen: string) => {
    setActive(screen);
    onNavigate(screen);
  };

  return (
    <View style={styles.container}>
      {menu.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.item}
          onPress={() => handlePress(item.key)}
        >
          <View style={active === item.key ? styles.activeCircle : undefined}>
            <Icon
              name={item.icon}
              size={28}
              color={active === item.key ? "#000" : "#3b82f6"}
            />
          </View>
          <Text
            style={[
              styles.label,
              { color: active === item.key ? "#000" : "#aaa" },
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default Sidebar;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginBottom:20,
  },
  item: {
    alignItems: "center",
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  activeCircle: {
    backgroundColor: "#f87171", // đỏ nhạt
    padding: 8,
    borderRadius: 50,
  },
});
