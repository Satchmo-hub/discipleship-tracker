// ============================================================================
// BADGE PICKER MODAL
// Allows user to pick a badge (type + variant)
// Standalone + stable — includes internal badgeCatalog
// ============================================================================

import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from "react-native";

// ============================================================================
// INTERNAL BADGE CATALOG (matches badges.tsx)
// ============================================================================
const badgeCatalog = [
  {
    category: "Fist Bump of Righteousness",
    id: "fistbump",
    icons: [
      require("../assets/badges/FistBumpArmor.png"),
      require("../assets/badges/FistBumpElf.png"),
      require("../assets/badges/FistBumpMale.png"),
    ],
  },
  {
    category: "High Five of Holiness",
    id: "highfive",
    icons: [
      require("../assets/badges/HighFiveHoliness.png"),
      require("../assets/badges/ElegantHighFive.png"),
    ],
  },
  {
    category: "You've Been Blessed!",
    id: "blessed",
    icons: [
      require("../assets/badges/YouveBeenBlessed3.png"),
      require("../assets/badges/YouveBeenBlessed2.png"),
    ],
  },
  {
    category: "El Jefe — Honor Badge",
    id: "eljefe",
    icons: [require("../assets/badges/El_Jefe.png")],
  },
];

// ============================================================================
// PROPS
// ============================================================================
type PickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (result: { category: string; iconIndex: number }) => void;
};

export default function BadgePickerModal({
  visible,
  onClose,
  onSelect,
}: PickerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.wrap}>
        <View style={styles.box}>
          <Text style={styles.title}>Choose a Badge</Text>

          <ScrollView
            contentContainerStyle={{
              paddingBottom: 30,
              alignItems: "center",
            }}
          >
            {/* ====================================================================
                BADGE GROUPS
            ==================================================================== */}
            {badgeCatalog.map((group, gIdx) => (
              <View key={`picker-group-${gIdx}`} style={styles.groupSection}>
                <Text style={styles.groupTitle}>{group.category}</Text>

                <View style={styles.iconRow}>
                  {group.icons.map((icon, iIdx) => (
                    <TouchableOpacity
                      key={`icon-${gIdx}-${iIdx}`}
                      style={styles.iconCard}
                      onPress={() => onSelect({ category: group.category, iconIndex: iIdx })}
                    >
                      <Image source={icon} style={styles.iconImage} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  box: {
    width: "88%",
    maxHeight: "85%",
    backgroundColor: "#fffaf1",
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: "#6b4f2d",
    alignItems: "center",
  },

  title: {
    fontFamily: "Ringbearer-Regular",
    fontSize: 28,
    color: "#4b3a25",
    marginBottom: 12,
    textAlign: "center",
  },

  // -------------------------------------------------------
  // Groups
  // -------------------------------------------------------
  groupSection: {
    width: "100%",
    marginVertical: 12,
  },

  groupTitle: {
    fontFamily: "Lora-Bold",
    fontSize: 18,
    color: "#4b3a25",
    textAlign: "center",
    marginBottom: 8,
  },

  // -------------------------------------------------------
  // Icons
  // -------------------------------------------------------
  iconRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },

  iconCard: {
    width: 110,
    height: 110,
    margin: 6,
    borderRadius: 12,
    backgroundColor: "#fdf7e6",
    borderWidth: 2,
    borderColor: "#b48a4a",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },

  iconImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  // -------------------------------------------------------
  // Cancel
  // -------------------------------------------------------
  cancelText: {
    marginTop: 10,
    fontSize: 18,
    color: "#6b2b34",
    fontFamily: "Lora-Regular",
  },
});
// End of BadgePickerModal.tsx
