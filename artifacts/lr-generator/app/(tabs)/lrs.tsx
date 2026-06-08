import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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
import { useLR, type LRRecord } from "@/context/LRContext";
import { generatePDF, sharePDF } from "@/services/pdfService";

type FilterType = "all" | "1" | "2";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "1", label: "Chennai → Manesar" },
  { key: "2", label: "Manesar → Chennai" },
];

export default function LRsScreen() {
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
      Alert.alert("Error", "Failed to generate PDF.");
    } finally {
      setSharing(null);
    }
  }

  const topPad = Platform.OS === "web" ? 52 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D1E36", "#060E1C"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Receipts</Text>
            <Text style={styles.subtitle}>
              {lrs.length} lorry receipt{lrs.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              if (Platform.OS !== "web")
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/create-lr");
            }}
          >
            <LinearGradient colors={["#D4A843", "#A8782E"]} style={styles.addBtnGrad}>
              <Feather name="plus" size={20} color="#0A1628" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Feather name="search" size={15} color="rgba(255,255,255,0.3)" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search LR No, vehicle…"
            placeholderTextColor="rgba(255,255,255,0.25)"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x-circle" size={15} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                filter === f.key && styles.filterChipActive,
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f.key && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="file-text" size={44} color="rgba(255,255,255,0.08)" />
          <Text style={styles.emptyTitle}>
            {lrs.length === 0 ? "No LRs yet" : "No results"}
          </Text>
          <Text style={styles.emptySubtitle}>
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
            <LRCard lr={item} onDelete={deleteLR} onShare={handleShare} />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomPad + 108 },
          ]}
          scrollEnabled={!!filtered.length}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.countLabel}>
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060E1C" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 14,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.35)",
    marginTop: 1,
  },
  addBtn: { borderRadius: 14, overflow: "hidden" },
  addBtnGrad: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterChipActive: {
    backgroundColor: "rgba(212,168,67,0.18)",
    borderColor: "rgba(212,168,67,0.4)",
  },
  filterText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.4)",
  },
  filterTextActive: { color: "#D4A843" },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  countLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.25)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
    lineHeight: 18,
  },
});
