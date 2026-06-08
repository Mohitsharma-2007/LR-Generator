import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof Feather>["name"];
  highlight?: boolean;
}

export function StatCard({ label, value, icon, highlight }: StatCardProps) {
  return (
    <View
      style={[
        styles.card,
        highlight ? styles.cardHighlight : styles.cardDefault,
      ]}
    >
      <View style={[styles.iconBox, highlight ? styles.iconBoxHL : styles.iconBoxDefault]}>
        <Feather
          name={icon}
          size={15}
          color={highlight ? "#0A1628" : "#D4A843"}
        />
      </View>
      <Text style={[styles.value, highlight ? styles.valueHL : styles.valueDefault]}>
        {value}
      </Text>
      <Text style={[styles.label, highlight ? styles.labelHL : styles.labelDefault]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    gap: 5,
  },
  cardDefault: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.09)",
  },
  cardHighlight: {
    backgroundColor: "rgba(212,168,67,0.18)",
    borderColor: "rgba(212,168,67,0.4)",
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  iconBoxDefault: {
    backgroundColor: "rgba(212,168,67,0.12)",
  },
  iconBoxHL: {
    backgroundColor: "rgba(10,22,40,0.25)",
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  valueDefault: { color: "#FFFFFF" },
  valueHL: { color: "#0A1628" },
  label: {
    fontSize: 9.5,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  labelDefault: { color: "rgba(255,255,255,0.45)" },
  labelHL: { color: "rgba(10,22,40,0.65)" },
});
