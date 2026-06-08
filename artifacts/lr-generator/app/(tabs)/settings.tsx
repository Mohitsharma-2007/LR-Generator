import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  ScrollView,
  Switch,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useLR } from "@/context/LRContext";

function SectionLabel({ title }: { title: string }) {
  return <Text style={sLabel.text}>{title}</Text>;
}
const sLabel = StyleSheet.create({
  text: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 28,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
});

const PIN_KEYS = ["1","2","3","4","5","6","7","8","9","","0","DEL"];

function PinSetupModal({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (pin: string) => void }) {
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [error, setError] = useState("");
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  const current = step === "enter" ? first : second;
  const setCurrent = step === "enter" ? setFirst : setSecond;

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  }

  function pressKey(key: string) {
    setError("");
    if (key === "DEL") { setCurrent((p) => p.slice(0, -1)); return; }
    if (current.length >= 4) return;
    const next = current + key;
    setCurrent(next);
    if (next.length === 4) {
      if (step === "enter") {
        setTimeout(() => { setStep("confirm"); setSecond(""); }, 120);
      } else {
        if (next === first) { onSave(first); reset(); }
        else {
          setError("PINs don't match. Try again.");
          shake();
          setTimeout(() => { setFirst(""); setSecond(""); setStep("enter"); setError(""); }, 900);
        }
      }
    }
  }

  function reset() { setFirst(""); setSecond(""); setStep("enter"); setError(""); }
  function handleClose() { reset(); onClose(); }
  const dots = step === "enter" ? first : second;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={pin.overlay}>
        <View style={pin.sheet}>
          <View style={pin.handle} />
          <Text style={pin.title}>{step === "enter" ? "Set App PIN" : "Confirm PIN"}</Text>
          <Text style={[pin.sub, !!error && { color: "#E05C5C" }]}>
            {error || (step === "enter" ? "Enter a 4-digit PIN" : "Re-enter to confirm")}
          </Text>
          <Animated.View style={[pin.dots, { transform: [{ translateX: shakeAnim }] }]}>
            {[0,1,2,3].map((i) => (
              <View key={i} style={[pin.dot, dots.length > i && pin.dotFilled]} />
            ))}
          </Animated.View>
          <View style={pin.keypad}>
            {PIN_KEYS.map((key, idx) => (
              <TouchableOpacity
                key={idx}
                style={[pin.key, key === "" && pin.keyGhost]}
                onPress={() => key && pressKey(key)}
                activeOpacity={0.65}
                disabled={key === ""}
              >
                {key === "DEL"
                  ? <Feather name="delete" size={20} color="#D4A843" />
                  : <Text style={pin.keyText}>{key}</Text>
                }
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={handleClose} style={pin.cancelBtn}>
            <Text style={pin.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const pin = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0D1E36",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingBottom: 40,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", marginBottom: 24 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFFFFF", marginBottom: 6 },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)", marginBottom: 28 },
  dots: { flexDirection: "row", gap: 18, marginBottom: 36 },
  dot: { width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: "#D4A843", backgroundColor: "transparent" },
  dotFilled: { backgroundColor: "#D4A843" },
  keypad: { flexDirection: "row", flexWrap: "wrap", width: 264, gap: 10 },
  key: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  keyGhost: { backgroundColor: "transparent", borderColor: "transparent" },
  keyText: { fontSize: 24, fontFamily: "Inter_300Light", color: "#FFFFFF" },
  cancelBtn: { marginTop: 20, paddingVertical: 10 },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.35)" },
});

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, lrs } = useLR();
  const { biometricEnabled, appPin, hasBiometrics, setBiometricEnabled, updatePin, removePin } = useAuth();

  const [senderEmail, setSenderEmail] = useState(settings.senderEmail);
  const [appPassword, setAppPassword] = useState(settings.googleAppPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [apiKey, setApiKey] = useState(settings.openrouterApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newVehicle, setNewVehicle] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);

  const topPad = Platform.OS === "web" ? 52 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function saveEmailConfig() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    await updateSettings({ senderEmail: senderEmail.trim(), googleAppPassword: appPassword, openrouterApiKey: apiKey.trim() });
    setSaving(false);
    Alert.alert("Saved", "Settings saved successfully.");
  }

  function addEmail() {
    if (!newEmail.trim() || !newEmail.includes("@")) { Alert.alert("Invalid", "Enter a valid email address."); return; }
    if (settings.emailIds.includes(newEmail.trim())) { Alert.alert("Duplicate", "Email already added."); return; }
    updateSettings({ emailIds: [...settings.emailIds, newEmail.trim()] });
    setNewEmail("");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function removeEmail(email: string) {
    Alert.alert("Remove Email", `Remove ${email}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => updateSettings({ emailIds: settings.emailIds.filter((e) => e !== email) }) },
    ]);
  }

  function addVehicle() {
    if (!newVehicle.trim()) return;
    if (settings.vehicles.includes(newVehicle.toUpperCase().trim())) { Alert.alert("Duplicate", "Vehicle already added."); return; }
    updateSettings({ vehicles: [...settings.vehicles, newVehicle.toUpperCase().trim()] });
    setNewVehicle("");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function removeVehicle(v: string) {
    Alert.alert("Remove Vehicle", `Remove ${v}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => updateSettings({ vehicles: settings.vehicles.filter((veh) => veh !== v) }) },
    ]);
  }

  async function handlePinSave(p: string) {
    await updatePin(p);
    setShowPinSetup(false);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("PIN Set", "App PIN has been set.");
  }

  async function handleRemovePin() {
    Alert.alert("Remove PIN", "The app will no longer require a PIN.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { await removePin(); Alert.alert("Removed", "PIN removed."); } },
    ]);
  }

  async function handleBiometricToggle(v: boolean) {
    if (!hasBiometrics && v) { Alert.alert("Not Available", "No biometric enrolled on this device."); return; }
    await setBiometricEnabled(v);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const inputStyle = [s.input];

  return (
    <View style={s.container}>
      <LinearGradient colors={["#0D1E36", "#060E1C"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />

      <View style={[s.header, { paddingTop: topPad + 10 }]}>
        <View style={s.headerLeft}>
          <Image source={require("@/assets/logo/maha_laxmi.png")} style={s.headerLogo} resizeMode="contain" />
          <View>
            <Text style={s.headerTitle}>Settings</Text>
            <Text style={s.headerSub}>{lrs.length} LR{lrs.length !== 1 ? "s" : ""} stored</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: bottomPad + 108 }]}
        showsVerticalScrollIndicator={false}
      >
        {Platform.OS !== "web" && (
          <>
            <SectionLabel title="Security" />
            <View style={s.card}>
              {hasBiometrics && (
                <View style={s.row}>
                  <View style={s.rowIcon}><Feather name="shield" size={16} color="#D4A843" /></View>
                  <View style={s.rowContent}>
                    <Text style={s.rowLabel}>Fingerprint Lock</Text>
                    <Text style={s.rowSub}>{biometricEnabled ? "Enabled" : "Disabled"}</Text>
                  </View>
                  <Switch
                    value={biometricEnabled}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(212,168,67,0.5)" }}
                    thumbColor={biometricEnabled ? "#D4A843" : "rgba(255,255,255,0.5)"}
                  />
                </View>
              )}
              {hasBiometrics && <View style={s.rowDivider} />}
              <View style={s.row}>
                <View style={s.rowIcon}><Feather name="lock" size={16} color="#D4A843" /></View>
                <View style={s.rowContent}>
                  <Text style={s.rowLabel}>App PIN</Text>
                  <Text style={s.rowSub}>{appPin ? "4-digit PIN set" : "Not configured"}</Text>
                </View>
                <TouchableOpacity style={s.smallBtn} onPress={() => setShowPinSetup(true)}>
                  <Text style={s.smallBtnText}>{appPin ? "Change" : "Set PIN"}</Text>
                </TouchableOpacity>
              </View>
              {!!appPin && (
                <>
                  <View style={s.rowDivider} />
                  <TouchableOpacity style={s.destructiveRow} onPress={handleRemovePin}>
                    <Feather name="unlock" size={14} color="#D63D3D" />
                    <Text style={s.destructiveText}>Remove PIN</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}

        <SectionLabel title="Gmail" />
        <View style={s.card}>
          <Text style={s.fieldLabel}>Sender Gmail Address</Text>
          <TextInput style={inputStyle} value={senderEmail} onChangeText={setSenderEmail}
            placeholder="your@gmail.com" placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType="email-address" autoCapitalize="none" />
          <Text style={[s.fieldLabel, { marginTop: 10 }]}>Google App Password</Text>
          <View style={s.inputRow}>
            <TextInput style={[inputStyle, { flex: 1 }]} value={appPassword} onChangeText={setAppPassword}
              placeholder="16-char app password" placeholderTextColor="rgba(255,255,255,0.2)"
              secureTextEntry={!showPassword} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowPassword((p) => !p)} style={s.eyeBtn}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.55 }]} onPress={saveEmailConfig} disabled={saving} activeOpacity={0.85}>
            <LinearGradient colors={["#D4A843", "#A8782E"]} style={s.saveBtnGrad}>
              <Feather name="save" size={15} color="#0A1628" />
              <Text style={s.saveBtnText}>{saving ? "Saving…" : "Save"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <SectionLabel title="Recipients" />
        <View style={s.card}>
          <View style={s.inputRow}>
            <TextInput style={[inputStyle, { flex: 1 }]} value={newEmail} onChangeText={setNewEmail}
              placeholder="Add email address" placeholderTextColor="rgba(255,255,255,0.2)"
              keyboardType="email-address" autoCapitalize="none" />
            <TouchableOpacity style={s.addIconBtn} onPress={addEmail}>
              <Feather name="plus" size={18} color="#0A1628" />
            </TouchableOpacity>
          </View>
          {settings.emailIds.length === 0
            ? <Text style={s.emptyChip}>No recipients added</Text>
            : settings.emailIds.map((email) => (
              <View key={email} style={s.chip}>
                <Feather name="mail" size={13} color="rgba(255,255,255,0.4)" />
                <Text style={s.chipText} numberOfLines={1}>{email}</Text>
                <TouchableOpacity onPress={() => removeEmail(email)}>
                  <Feather name="x" size={15} color="rgba(214,61,61,0.6)" />
                </TouchableOpacity>
              </View>
            ))
          }
        </View>

        <SectionLabel title="AI" />
        <View style={s.card}>
          <Text style={s.fieldLabel}>OpenRouter API Key</Text>
          <View style={s.inputRow}>
            <TextInput style={[inputStyle, { flex: 1 }]} value={apiKey} onChangeText={setApiKey}
              placeholder="sk-or-..." placeholderTextColor="rgba(255,255,255,0.2)"
              secureTextEntry={!showApiKey} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowApiKey((p) => !p)} style={s.eyeBtn}>
              <Feather name={showApiKey ? "eye-off" : "eye"} size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
          <Text style={s.hint}>Free key at openrouter.ai — used for AI photo extraction</Text>
          <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.55 }]} onPress={saveEmailConfig} disabled={saving} activeOpacity={0.85}>
            <LinearGradient colors={["#D4A843", "#A8782E"]} style={s.saveBtnGrad}>
              <Feather name="save" size={15} color="#0A1628" />
              <Text style={s.saveBtnText}>{saving ? "Saving…" : "Save API Key"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <SectionLabel title="Vehicles" />
        <View style={s.card}>
          <View style={s.inputRow}>
            <TextInput style={[inputStyle, { flex: 1 }]} value={newVehicle} onChangeText={setNewVehicle}
              placeholder="Vehicle No (e.g. UP16PT9444)" placeholderTextColor="rgba(255,255,255,0.2)"
              autoCapitalize="characters" />
            <TouchableOpacity style={s.addIconBtn} onPress={addVehicle}>
              <Feather name="plus" size={18} color="#0A1628" />
            </TouchableOpacity>
          </View>
          {settings.vehicles.map((v) => (
            <View key={v} style={s.chip}>
              <Feather name="truck" size={13} color="rgba(255,255,255,0.4)" />
              <Text style={s.chipText}>{v}</Text>
              <TouchableOpacity onPress={() => removeVehicle(v)}>
                <Feather name="x" size={15} color="rgba(214,61,61,0.6)" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <SectionLabel title="About" />
        <View style={[s.card, s.aboutCard]}>
          <Image source={require("@/assets/logo/maha_laxmi.png")} style={s.aboutLogo} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={s.aboutTitle}>LR Generator</Text>
            <Text style={s.aboutSub}>Maha Laxmi Transport Co.</Text>
            <Text style={s.aboutVersion}>Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      <PinSetupModal visible={showPinSetup} onClose={() => setShowPinSetup(false)} onSave={handlePinSave} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060E1C" },
  header: { paddingHorizontal: 20, paddingBottom: 4 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerLogo: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: "rgba(212,168,67,0.3)" },
  headerTitle: { fontSize: 30, fontFamily: "Inter_700Bold", color: "#FFFFFF", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.3)", marginTop: 1 },
  content: { paddingHorizontal: 20 },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
    gap: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 2 },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(212,168,67,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#FFFFFF" },
  rowSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.35)", marginTop: 1 },
  smallBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  smallBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#D4A843" },
  destructiveRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  destructiveText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#D63D3D" },
  fieldLabel: {
    fontSize: 10, fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
  },
  inputRow: { flexDirection: "row", gap: 8 },
  eyeBtn: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  addIconBtn: {
    width: 46, height: 46, borderRadius: 12, overflow: "hidden",
    backgroundColor: "#D4A843",
    alignItems: "center", justifyContent: "center",
  },
  saveBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  saveBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13 },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#0A1628" },
  emptyChip: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.2)", textAlign: "center", paddingVertical: 4 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  chipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  hint: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.25)", lineHeight: 16 },
  aboutCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  aboutLogo: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: "rgba(212,168,67,0.3)" },
  aboutTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  aboutSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.35)", marginTop: 2 },
  aboutVersion: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.2)", marginTop: 4 },
});
