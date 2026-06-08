import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ROUTES, type LRRecord } from "@/context/LRContext";

interface LRCardProps {
  lr: LRRecord;
  onDelete: (id: string) => void;
  onShare: (lr: LRRecord) => void;
}

export function LRCard({ lr, onDelete, onShare }: LRCardProps) {
  const route = ROUTES[lr.routeId];

  function handlePress() {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.push(`/lr-detail/${lr.id}`);
  }

  function handleDelete() {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete LR",
      `Delete ${lr.lrNo}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete(lr.id) },
      ]
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.75}>
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <Text style={styles.lrNo}>{lr.lrNo}</Text>
          <View style={styles.routeBadge}>
            <Feather name="map-pin" size={9} color="rgba(255,255,255,0.35)" />
            <Text style={styles.routeText}>{route.name}</Text>
          </View>
        </View>
        <View style={styles.topRight}>
          <Text style={styles.freightText}>
            ₹{lr.frightCharge.toLocaleString("en-IN")}
          </Text>
          <Text style={styles.dateText}>{lr.date}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.vehicleRow}>
          <Feather name="truck" size={12} color="rgba(255,255,255,0.3)" />
          <Text style={styles.vehicleText}>{lr.vehicleNo}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/create-lr?edit=${lr.id}`)}
          >
            <Feather name="edit-2" size={13} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(lr)}>
            <Feather name="share-2" size={13} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
            <Feather name="trash-2" size={13} color="rgba(214,61,61,0.7)" />
          </TouchableOpacity>
          <Feather name="chevron-right" size={14} color="rgba(212,168,67,0.5)" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  topLeft: { gap: 5 },
  topRight: { alignItems: "flex-end", gap: 3 },
  lrNo: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#D4A843",
    letterSpacing: 0.3,
  },
  routeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  routeText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  freightText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  dateText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.35)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vehicleText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    fontFamily: "Inter_500Medium",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
});
