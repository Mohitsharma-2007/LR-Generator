import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { type InvoiceRecord } from "@/context/LRContext";
import { useColors } from "@/hooks/useColors";

interface InvoiceRowProps {
  invoice: InvoiceRecord;
  index: number;
  canDelete: boolean;
  onChange: (id: string, field: keyof InvoiceRecord, value: string) => void;
  onDelete: (id: string) => void;
}

export function InvoiceRow({
  invoice,
  index,
  canDelete,
  onChange,
  onDelete,
}: InvoiceRowProps) {
  const colors = useColors();

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.muted,
      borderColor: colors.border,
      color: colors.foreground,
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.indexBadge,
            { backgroundColor: colors.gold ?? colors.primary },
          ]}
        >
          <Text
            style={[styles.indexText, { color: colors.primaryForeground }]}
          >
            {index + 1}
          </Text>
        </View>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Invoice Entry
        </Text>
        {canDelete && (
          <TouchableOpacity
            onPress={() => onDelete(invoice.id)}
            style={styles.deleteBtn}
          >
            <Feather name="x-circle" size={18} color={colors.destructive} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Invoice No *
        </Text>
        <TextInput
          style={inputStyle}
          value={invoice.invoiceNo}
          onChangeText={(v) => onChange(invoice.id, "invoiceNo", v)}
          placeholder="e.g. TN2026000911-16"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Drop Location
        </Text>
        <TextInput
          style={inputStyle}
          value={invoice.dropLocation}
          onChangeText={(v) => onChange(invoice.id, "dropLocation", v)}
          placeholder="Drop location"
          placeholderTextColor={colors.mutedForeground}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Packages
          </Text>
          <TextInput
            style={inputStyle}
            value={invoice.noOfPackages}
            onChangeText={(v) => onChange(invoice.id, "noOfPackages", v)}
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Goods Weight
          </Text>
          <TextInput
            style={inputStyle}
            value={invoice.goodsWeight}
            onChangeText={(v) => onChange(invoice.id, "goodsWeight", v)}
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  indexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  headerTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  deleteBtn: {
    padding: 2,
  },
  field: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
