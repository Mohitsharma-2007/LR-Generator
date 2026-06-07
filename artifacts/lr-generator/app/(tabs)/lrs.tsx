import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LRCard } from "@/components/LRCard";
import { useLR, ROUTES, type LRRecord } from "@/context/LRContext";
import { generatePDF, sharePDF } from "@/services/pdfService";
import { useColors } from "@/hooks/useColors";

type FilterType = "all" | "1" | "2";

export default function LRsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { lrs, deleteLR } = useLR();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sharing, setSharing] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return lrs.filter((lr) => {
      const matchesSearch =
        !search ||
        lr.lrNo.toLowerCase().includes(search.toLowerCase()) ||
        lr.vehicleNo.toLowerCase().includes(search.toLowerCase()) ||
        lr.consignmentNo.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" || lr.routeId.toString() === filter;
      return matchesSearch && matchesFilter;
    });
  }, [lrs, search, filter]);

  async function handleShare(lr: LRRecord) {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      setSharing(lr.id);
      const uri = await generatePDF(lr);
      await sharePDF(uri, lr.lrNo);
    } catch {
      Alert.alert("Error", "Failed to generate PDF for sharing.");
    } finally {
      setSharing(null);
    }
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface ?? colors.card,
            paddingTop: topPad + 8,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Lorry Receipts
        </Text>
        <TouchableOpacity
          style={[
            styles.addBtn,
            { backgroundColor: colors.gold ?? colors.primary },
          ]}
          onPress={() => {
            if (Platform.OS !== "web")
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/create-lr");
          }}
        >
          <Feather name="plus" size={18} color="#0A1628" />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            marginHorizontal: 16,
            marginTop: 12,
          },
        ]}
      >
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by LR No, vehicle..."
          placeholderTextColor={colors.mutedForeground}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {(["all", "1", "2"] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === f
                    ? colors.gold ?? colors.primary
                    : colors.card,
                borderColor:
                  filter === f
                    ? colors.gold ?? colors.primary
                    : colors.border,
              },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    filter === f ? "#0A1628" : colors.mutedForeground,
                },
              ]}
            >
              {f === "all"
                ? "All"
                : f === "1"
                ? "Chennai→Manesar"
                : "Manesar→Chennai"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="file-text" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {lrs.length === 0 ? "No LRs yet" : "No results found"}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            {lrs.length === 0
              ? "Tap + to create your first LR"
              : "Try a different search or filter"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LRCard
              lr={item}
              onDelete={deleteLR}
              onShare={handleShare}
            />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomPad + 80 },
          ]}
          scrollEnabled={!!filtered.length}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text
              style={[styles.countText, { color: colors.mutedForeground }]}
            >
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  list: { paddingHorizontal: 16 },
  countText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
