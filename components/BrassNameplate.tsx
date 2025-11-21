// components/BrassNameplate.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  title: string;
  icon?: ImageSourcePropType;
  value?: string | number;
};

export default function BrassNameplate({ title, icon, value }: Props) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#b7965a", "#cfae64", "#a67c37"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.plate}
      >
        {/* Rivets */}
        <View style={[styles.rivet, styles.topLeft]} />
        <View style={[styles.rivet, styles.topRight]} />
        <View style={[styles.rivet, styles.bottomLeft]} />
        <View style={[styles.rivet, styles.bottomRight]} />

        {/* Row */}
        <View style={styles.row}>
          {icon && (
            <Image
              source={icon}
              style={styles.leftIcon}
              resizeMode="contain"
            />
          )}

          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          {value !== undefined && (
            <View style={styles.valueBox}>
              <Text style={styles.valueText}>{value}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

/*************************************************
 * STYLES — 2pt rightward shift
 *************************************************/
const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginLeft: 14,  // ⭐ nudged right (12 + 2)
    marginRight: 10, // ⭐ compensation (12 - 2)
    marginVertical: 6,
  },

  plate: {
    width: "88%",    // your current shortened width
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#6d552a",
    justifyContent: "center",
    paddingHorizontal: 22,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },

  leftIcon: {
    width: 26,
    height: 26,
    marginRight: 14,
  },

  title: {
    fontFamily: "Lora-Regular",
    fontSize: 18,
    color: "#2e2618",
    flex: 1,
    paddingHorizontal: 4,
  },

  valueBox: {
    backgroundColor: "rgba(40,30,10,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d9c07a",
    marginLeft: 14,
  },

  valueText: {
    fontFamily: "Lora-Bold",
    color: "#f5eac7",
    fontSize: 14,
  },

  rivet: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#5c4521",
    borderWidth: 1.3,
    borderColor: "#e0c97a",
  },

  topLeft: { top: 6, left: 6 },
  topRight: { top: 6, right: 6 },
  bottomLeft: { bottom: 6, left: 6 },
  bottomRight: { bottom: 6, right: 6 },
});
