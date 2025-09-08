import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export default function RoomCard({ image, title, price, address, available, time }) {
  return (
    <View style={styles.card}>
      <Image source={image} style={styles.image} />
      <View style={styles.info}>
        <Text numberOfLines={2} style={styles.title}>{title}</Text>
        <Text style={styles.price}>{price}</Text>
        <Text numberOfLines={1} style={styles.address}>{address}</Text>
        <Text style={styles.available}>{available ? "Còn phòng" : "Hết phòng"}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 100,
  },
  info: {
    padding: 8,
  },
  title: {
    fontWeight: "bold",
    fontSize: 14,
  },
  price: {
    color: "#e11d48",
    marginVertical: 2,
  },
  address: {
    color: "#555",
    fontSize: 12,
  },
  available: {
    fontSize: 12,
    color: "#009688",
  },
  time: {
    fontSize: 12,
    color: "#888",
  },
});
