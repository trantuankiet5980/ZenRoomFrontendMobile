import React, { useState, useMemo } from "react";
import { Image, View, Text, StyleSheet } from "react-native";
import { resolveAssetUrl } from "../utils/cdn";

export default function S3Image({ src, alt = "", style, cacheKey }) {
  const [err, setErr] = useState(false);

  const url = useMemo(() => {
    const u = resolveAssetUrl(src);
    return cacheKey ? `${u}${u.includes("?") ? "&" : "?"}v=${cacheKey}` : u;
  }, [src, cacheKey]);

  if (!src) return null;

  return err ? (
    <View style={[styles.fallback, style]}>
      <Text style={styles.fallbackText}>IMG</Text>
    </View>
  ) : (
    <Image
      source={{ uri: url }}
      style={style}
      onError={() => {
        console.warn("IMG LOAD ERROR:", { raw: src, resolved: url });
        setErr(true);
      }}
      onLoad={() => {
        // console.log("IMG OK:", url);
      }}
      resizeMode="cover"
      alt={alt}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9", 
    borderWidth: 1,
    borderColor: "#cbd5e1", 
  },
  fallbackText: {
    color: "#94a3b8", 
  },
});
