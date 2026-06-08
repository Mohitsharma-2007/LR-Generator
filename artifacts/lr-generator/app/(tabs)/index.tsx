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

export default function HomeScreen() {
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
  const recentLRs = lrs.slice(0, 3);

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
      <View style={[styles.glowOrb, { pointerEvents: "none" }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 12, paddingBottom: bottomPad + 108 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <Image
              source={require("@/assets/logo/maha_laxmi.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.brandText}>
              <Text style={styles.brandName}>MAHA LAXMI</Text>
              <Text style={styles.brandSub}>TRANSPORT CO.</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/settings")}
            style={styles.settingsBtn}
          >
            <Feather name="sliders" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Total LRs" value={lrs.length} icon="file-text" />
          <View style={{ width: 10 }} />
          <StatCard label="This Month" value={thisMonth.length} icon="calendar" highlight />
          <View style={{ width: 10 }} />
          <StatCard label="Chennai→" value={chennaiCount} icon="arrow-right" />
        </View>

        <View style={styles.heroContainer}>
          {Platform.OS !== "web" ? (
            <LottieView
              ref={lottieRef}
              source={require("@/assets/lottie/truck.json")}
              autoPlay
              loop
              style={styles.lottie}
            />
          ) : (
            <View style={[styles.lottie, styles.webHero]}>
              <Feather name="truck" size={72} color="rgba(212,168,67,0.35)" />
            </View>
          )}
        </View>

        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

        <View style={styles.actionsRow}>
          <ActionCard
            gradient={["#D4A843", "#A8782E"]}
            icon="plus"
            iconColor="#0A1628"
            title="Create LR"
            sub="Manual entry"
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/create-lr");
            }}
          />
          <ActionCard
            gradient={["#5A3DB5", "#3D2880"]}
            icon="camera"
            iconColor="#fff"
            title="Scan LR"
            sub="AI extraction"
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/scan");
            }}
          />
          <ActionCard
            gradient={["#1E8C5E", "#156444"]}
            icon="list"
            iconColor="#fff"
            title="All LRs"
            sub="View records"
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/lrs");
            }}
          />
        </View>

        {recentLRs.length > 0 && (
          <>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionLabel}>RECENT LRs</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/lrs")}>
                <Text style={styles.viewAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {recentLRs.map((lr) => (
              <TouchableOpacity
                key={lr.id}
                style={styles.recentCard}
                onPress={() => router.push(`/lr-detail/${lr.id}`)}
                activeOpacity={0.75}
              >
                <View style={styles.recentLeft}>
                  <Text style={styles.recentLrNo}>{lr.lrNo}</Text>
                  <Text style={styles.recentRoute}>{ROUTES[lr.routeId].name}</Text>
                </View>
                <View style={styles.recentRight}>
                  <Text style={styles.recentFreight}>
                    ₹{lr.frightCharge.toLocaleString("en-IN")}
                  </Text>
                  <Text style={styles.recentDate}>{lr.date}</Text>
                </View>
                <Feather name="chevron-right" size={15} color="rgba(212,168,67,0.4)" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {lrs.length === 0 && (
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={36} color="rgba(255,255,255,0.12)" />
            <Text style={styles.emptyText}>No LRs yet. Create your first one!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ActionCard({
  gradient,
  icon,
  iconColor,
  title,
  sub,
  onPress,
}: {
  gradient: [string, string];
  icon: React.ComponentProps<typeof Feather>["name"];
  iconColor: string;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.75}>
      <LinearGradient colors={gradient} style={styles.actionIconBox}>
        <Feather name={icon} size={22} color={iconColor} />
      </LinearGradient>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060E1C" },
  glowOrb: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(212,168,67,0.05)",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(212,168,67,0.3)",
  },
  brandText: { gap: 1 },
  brandName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#D4A843",
    letterSpacing: 2.5,
  },
  brandSub: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 2.5,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  statsRow: { flexDirection: "row", marginBottom: 4 },

  heroContainer: { alignItems: "center", marginVertical: 8 },
  lottie: { width: 220, height: 140 },
  webHero: { alignItems: "center", justifyContent: "center" },

  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 8,
  },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 32 },
  actionCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  actionIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 12.5,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  actionSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
  },

  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  viewAll: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#D4A843",
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    gap: 8,
  },
  recentLeft: { flex: 1, gap: 3 },
  recentLrNo: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#D4A843",
  },
  recentRoute: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.35)",
  },
  recentRight: { alignItems: "flex-end", gap: 3 },
  recentFreight: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  recentDate: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.3)",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
  },
});
