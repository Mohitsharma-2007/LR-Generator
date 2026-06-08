import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLR } from "@/context/LRContext";
import { extractFromImage } from "@/services/aiService";

interface Extracted {
  route: string | null;
  consignmentNo: string | null;
  invoiceNos: string[];
}

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { settings } = useLR();
  const lottieRef = useRef<LottieView>(null);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [editedRoute, setEditedRoute] = useState<string | null>(null);
  const [editedConsignment, setEditedConsignment] = useState("");
  const [editedInvoices, setEditedInvoices] = useState("");

  const topPad = Platform.OS === "web" ? 52 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function pickImage(fromCamera: boolean) {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let result;
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Camera access is needed to scan LRs.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.8, base64: true });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Photo library access is needed.");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.8, base64: true });
    }

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setExtracted(null);
      await processImage(asset.base64 ?? "");
    }
  }

  async function processImage(base64: string) {
    if (!settings.openrouterApiKey) {
      Alert.alert("API Key Required", "Add your OpenRouter API key in Settings.");
      return;
    }
    setLoading(true);
    try {
      const result = await extractFromImage(base64, settings.openrouterApiKey);
      setExtracted(result);
      setEditedRoute(result.route);
      setEditedConsignment(result.consignmentNo ?? "");
      setEditedInvoices(result.invoiceNos.join(", "));
      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Extraction Failed", "AI could not extract data. Please enter details manually.");
    } finally {
      setLoading(false);
    }
  }

  function handleFillForm() {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const routeId = editedRoute?.includes("Manesar →") ? 2 : 1;
    const invoiceList = editedInvoices.split(",").map((s) => s.trim()).filter(Boolean);
    router.push({
      pathname: "/create-lr",
      params: { routeId: routeId.toString(), consignmentNo: editedConsignment, invoiceNos: invoiceList.join("|") },
    });
  }

  function reset() {
    setImageUri(null);
    setExtracted(null);
    setEditedRoute(null);
    setEditedConsignment("");
    setEditedInvoices("");
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D1E36", "#060E1C"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Text style={styles.title}>AI Scan</Text>
        <View style={styles.aiBadge}>
          <Feather name="zap" size={11} color="#6B4CC0" />
          <Text style={styles.aiBadgeText}>AI Powered</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 108 }]}
        showsVerticalScrollIndicator={false}
      >
        {!imageUri && !loading && (
          <View style={styles.uploadSection}>
            <View style={styles.uploadBox}>
              {Platform.OS !== "web" ? (
                <LottieView
                  ref={lottieRef}
                  source={require("@/assets/lottie/loading_hand.json")}
                  autoPlay
                  loop
                  style={styles.uploadLottie}
                />
              ) : (
                <View style={[styles.uploadLottie, styles.uploadLottieCenter]}>
                  <Feather name="upload-cloud" size={52} color="rgba(255,255,255,0.15)" />
                </View>
              )}
              <Text style={styles.uploadTitle}>Upload LR Photo</Text>
              <Text style={styles.uploadSub}>
                AI extracts route, consignment & invoice numbers automatically
              </Text>
            </View>

            <View style={styles.pickRow}>
              <PickButton
                gradient={["#D4A843", "#A8782E"]}
                icon="image"
                iconColor="#0A1628"
                label="Gallery"
                onPress={() => pickImage(false)}
              />
              <PickButton
                gradient={["#5A3DB5", "#3D2880"]}
                icon="camera"
                iconColor="#fff"
                label="Camera"
                onPress={() => pickImage(true)}
              />
            </View>

            {!settings.openrouterApiKey && (
              <TouchableOpacity
                style={styles.apiWarning}
                onPress={() => router.push("/(tabs)/settings")}
              >
                <Feather name="alert-triangle" size={14} color="#D4A843" />
                <Text style={styles.apiWarningText}>
                  No API key — tap to configure in Settings
                </Text>
                <Feather name="chevron-right" size={14} color="rgba(212,168,67,0.5)" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {loading && (
          <View style={styles.loadingSection}>
            {Platform.OS !== "web" ? (
              <LottieView
                source={require("@/assets/lottie/ai_loading.json")}
                autoPlay
                loop
                style={styles.loadingLottie}
              />
            ) : (
              <View style={[styles.loadingLottie, styles.uploadLottieCenter]}>
                <Feather name="loader" size={52} color="rgba(255,255,255,0.15)" />
              </View>
            )}
            <Text style={styles.loadingTitle}>Analysing…</Text>
            <Text style={styles.loadingSub}>AI is reading the LR document</Text>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.previewThumb}
                resizeMode="cover"
              />
            )}
          </View>
        )}

        {!loading && imageUri && extracted && (
          <View style={styles.resultSection}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />

            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.successDot}>
                  <Feather name="check" size={12} color="#1E8C5E" />
                </View>
                <Text style={styles.resultTitle}>Extraction Complete</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Route</Text>
                <View style={styles.routeRow}>
                  {["Chennai → Manesar", "Manesar → Chennai"].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.routeOption,
                        editedRoute === r && styles.routeOptionActive,
                      ]}
                      onPress={() => setEditedRoute(r)}
                    >
                      <Text style={[styles.routeOptionText, editedRoute === r && styles.routeOptionTextActive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Consignment No.</Text>
                <TextInput
                  style={styles.input}
                  value={editedConsignment}
                  onChangeText={setEditedConsignment}
                  placeholder="Consignment number"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Invoice Numbers</Text>
                <TextInput
                  style={styles.input}
                  value={editedInvoices}
                  onChangeText={setEditedInvoices}
                  placeholder="Comma separated"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  multiline
                />
              </View>
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={reset}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fillBtn} onPress={handleFillForm} activeOpacity={0.85}>
                <LinearGradient colors={["#D4A843", "#A8782E"]} style={styles.fillBtnGrad}>
                  <Feather name="edit-3" size={16} color="#0A1628" />
                  <Text style={styles.fillBtnText}>Fill Form</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function PickButton({
  gradient, icon, iconColor, label, onPress,
}: {
  gradient: [string, string];
  icon: React.ComponentProps<typeof Feather>["name"];
  iconColor: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.pickBtn} onPress={onPress} activeOpacity={0.75}>
      <LinearGradient colors={gradient} style={styles.pickIcon}>
        <Feather name={icon} size={20} color={iconColor} />
      </LinearGradient>
      <Text style={styles.pickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060E1C" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(107,76,192,0.15)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(107,76,192,0.3)",
  },
  aiBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#8B6FD4" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  uploadSection: { gap: 14 },
  uploadBox: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    padding: 36,
    gap: 10,
  },
  uploadLottie: { width: 150, height: 120 },
  uploadLottieCenter: { alignItems: "center", justifyContent: "center" },
  uploadTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  uploadSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    lineHeight: 19,
  },
  pickRow: { flexDirection: "row", gap: 12 },
  pickBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  pickIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  pickLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  apiWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(212,168,67,0.07)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.2)",
  },
  apiWarningText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(212,168,67,0.8)" },
  loadingSection: { alignItems: "center", gap: 14, paddingVertical: 40 },
  loadingLottie: { width: 160, height: 160 },
  loadingTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  loadingSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.35)" },
  previewThumb: { width: 120, height: 80, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", marginTop: 8 },
  resultSection: { gap: 16 },
  previewImage: { width: "100%", height: 200, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  resultCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    padding: 18,
    gap: 16,
  },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  successDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(30,140,94,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  field: { gap: 7 },
  fieldLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
  },
  routeRow: { flexDirection: "row", gap: 8 },
  routeOption: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  routeOptionActive: {
    backgroundColor: "rgba(212,168,67,0.15)",
    borderColor: "rgba(212,168,67,0.35)",
  },
  routeOptionText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.4)", textAlign: "center" },
  routeOptionTextActive: { color: "#D4A843" },
  resultActions: { flexDirection: "row", gap: 12 },
  resetBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  resetText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.5)" },
  fillBtn: { flex: 2, borderRadius: 14, overflow: "hidden" },
  fillBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  fillBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0A1628" },
});
