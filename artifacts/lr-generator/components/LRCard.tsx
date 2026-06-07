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
import { useColors } from "@/hooks/useColors";

interface LRCardProps {
  lr: LRRecord;
  onDelete: (id: string) => void;
  onShare: (lr: LRRecord) => void;
}

export function LRCard({ lr, onDelete, onShare }: LRCardProps) {
  const colors = useColors();
  const route = ROUTES[lr.routeId];

  function handlePress() {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.push(`/lr-detail/${lr.id}`);
  }

  function handleDelete() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete LR",
      `Are you sure you want to delete ${lr.lrNo}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(lr.id),
        },
      ]
    );
  }

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    lrNo: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: colors.gold ?? colors.primary,
      letterSpacing: 0.5,
    },
    date: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    routeBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.muted,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginBottom: 10,
      alignSelf: "flex-start",
    },
    routeText: {
      color: colors.mutedForeground,
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      marginLeft: 6,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    vehicleText: {
      fontSize: 13,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
    },
    freightText: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: colors.gold ?? colors.primary,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      padding: 6,
    },
    actionText: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    deleteText: {
      color: colors.destructive,
    },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.lrNo}>{lr.lrNo}</Text>
          <Text style={styles.date}>{lr.date}</Text>
        </View>
        <View style={styles.routeBadge}>
          <Feather name="map-pin" size={11} color={colors.mutedForeground} />
          <Text style={styles.routeText}>{route.name}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Feather name="truck" size={13} color={colors.mutedForeground} />
          <Text style={styles.vehicleText}>{lr.vehicleNo}</Text>
        </View>
        <Text style={styles.freightText}>
          ₹{lr.frightCharge.toLocaleString("en-IN")}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push(`/create-lr?edit=${lr.id}`)}
        >
          <Feather name="edit-2" size={13} color={colors.mutedForeground} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(lr)}>
          <Feather name="share-2" size={13} color={colors.mutedForeground} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
          <Feather name="trash-2" size={13} color={colors.destructive} />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
