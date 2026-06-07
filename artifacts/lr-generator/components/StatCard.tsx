import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof Feather>["name"];
  highlight?: boolean;
}

export function StatCard({ label, value, icon, highlight }: StatCardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: highlight ? colors.primary : colors.card,
          borderColor: highlight ? colors.primary : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: highlight
              ? "rgba(0,0,0,0.2)"
              : colors.muted,
          },
        ]}
      >
        <Feather
          name={icon}
          size={16}
          color={highlight ? colors.primaryForeground : colors.gold ?? colors.primary}
        />
      </View>
      <Text
        style={[
          styles.value,
          {
            color: highlight ? colors.primaryForeground : colors.gold ?? colors.primary,
          },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          {
            color: highlight
              ? "rgba(255,255,255,0.7)"
              : colors.mutedForeground,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    gap: 6,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
