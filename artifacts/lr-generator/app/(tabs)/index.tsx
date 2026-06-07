import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StatCard } from "@/components/StatCard";
import { useLR, ROUTES } from "@/context/LRContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { lrs } = useLR();
  const lottieRef = useRef<LottieView>(null);

  const thisMonth = lrs.filter((lr) => {
    const parts = lr.date.split("-");
    if (parts.length < 3) return false;
    const now = new Date();
    return (
      parseInt(parts[1]) === now.getMonth() + 1 &&
      parseInt(parts[2]) === now.getFullYear()
    );
  });

  const chennaiCount = lrs.filter((lr) => lr.routeId === 1).length;
  const maneserCount = lrs.filter((lr) => lr.routeId === 2).length;

  const recentLRs = lrs.slice(0, 3);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0A1628", "#112138", "#0A1628"]}
        style={[styles.header, { paddingTop: topPad + 8 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoRow}>
            <Image
              source={require("@/assets/logo/maha_laxmi.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>MAHA LAXMI</Text>
              <Text style={styles.companySubtitle}>TRANSPORT CO.</Text>
              <Text style={styles.appTagline}>LR Generator</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/settings")}
            style={styles.settingsBtn}
          >
            <Feather name="settings" size={20} color="#D4A843" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <StatCard label="Total LRs" value={lrs.length} icon="file-text" />
          <View style={{ width: 10 }} />
          <StatCard
            label="This Month"
            value={thisMonth.length}
            icon="calendar"
            highlight
          />
          <View style={{ width: 10 }} />
          <StatCard label="Chennai→" value={chennaiCount} icon="arrow-right" />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.animationContainer}>
          {Platform.OS !== "web" ? (
            <LottieView
              ref={lottieRef}
              source={require("@/assets/lottie/truck.json")}
              autoPlay
              loop
              style={styles.lottie}
            />
          ) : (
            <View style={[styles.lottie, { alignItems: "center", justifyContent: "center" }]}>
              <Feather name="truck" size={64} color="#D4A843" />
            </View>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          QUICK ACTIONS
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/create-lr");
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#D4A843", "#A8782E"]}
              style={styles.actionIconBox}
            >
              <Feather name="plus" size={24} color="#0A1628" />
            </LinearGradient>
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>
              Create LR
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>
              Manual entry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/scan");
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#6B4CC0", "#4A2E9A"]}
              style={styles.actionIconBox}
            >
              <Feather name="camera" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>
              Scan LR
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>
              AI extraction
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/lrs");
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#2D9E6E", "#1E6E4E"]}
              style={styles.actionIconBox}
            >
              <Feather name="list" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>
              All LRs
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>
              View records
            </Text>
          </TouchableOpacity>
        </View>

        {recentLRs.length > 0 && (
          <>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                RECENT LRs
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/lrs")}>
                <Text style={[styles.viewAll, { color: colors.gold ?? colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {recentLRs.map((lr) => (
              <TouchableOpacity
                key={lr.id}
                style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/lr-detail/${lr.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.recentLeft}>
                  <Text style={[styles.recentLrNo, { color: colors.gold ?? colors.primary }]}>
                    {lr.lrNo}
                  </Text>
                  <Text style={[styles.recentRoute, { color: colors.mutedForeground }]}>
                    {ROUTES[lr.routeId].name}
                  </Text>
                </View>
                <View style={styles.recentRight}>
                  <Text style={[styles.recentFreight, { color: colors.foreground }]}>
                    ₹{lr.frightCharge.toLocaleString("en-IN")}
                  </Text>
                  <Text style={[styles.recentDate, { color: colors.mutedForeground }]}>
                    {lr.date}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {lrs.length === 0 && (
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No LRs yet. Create your first one!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 48, height: 48, borderRadius: 24 },
  companyInfo: { gap: 1 },
  companyName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#D4A843",
    letterSpacing: 2,
  },
  companySubtitle: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#8094AB",
    letterSpacing: 2,
  },
  appTagline: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
    marginTop: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(212,168,67,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#1E3550",
    marginBottom: 14,
  },
  statsRow: { flexDirection: "row" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  animationContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  lottie: { width: 200, height: 130 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  actionSubtitle: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    gap: 10,
  },
  recentLeft: { flex: 1 },
  recentLrNo: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  recentRoute: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  recentRight: { alignItems: "flex-end" },
  recentFreight: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  recentDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
