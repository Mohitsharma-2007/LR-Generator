import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";

const KEYS = ["1","2","3","4","5","6","7","8","9","","0","DEL"];

export function LockScreen() {
  const { authenticateBiometric, verifyPin, appPin, biometricEnabled, hasBiometrics } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showPin = !!appPin;
  const showBiometric = biometricEnabled && hasBiometrics && Platform.OS !== "web";

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    if (showBiometric) {
      const t = setTimeout(() => authenticateBiometric(), 400);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (pin.length === 4) {
      const ok = verifyPin(pin);
      if (!ok) {
        setError("Incorrect PIN");
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start(() => {
          setPin("");
          setTimeout(() => setError(""), 1400);
        });
      }
    }
  }, [pin]);

  function pressKey(key: string) {
    if (key === "DEL") { setPin((p) => p.slice(0, -1)); setError(""); }
    else if (pin.length < 4) { setPin((p) => p + key); }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A1628", "#060E1C"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.glow} pointerEvents="none" />

      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <View style={styles.top}>
          <View style={styles.logoWrap}>
            <Image
              source={require("@/assets/logo/maha_laxmi.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.company}>MAHA LAXMI</Text>
          <Text style={styles.companyLine2}>TRANSPORT CO.</Text>
          <Text style={styles.tagline}>LR Generator · Secure Access</Text>
        </View>

        {showPin && (
          <View style={styles.pinSection}>
            <Text style={[styles.prompt, !!error && styles.errorText]}>
              {error || "Enter your PIN"}
            </Text>

            <Animated.View style={[styles.dots, { transform: [{ translateX: shakeAnim }] }]}>
              {[0,1,2,3].map((i) => (
                <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
              ))}
            </Animated.View>

            <View style={styles.keypad}>
              {KEYS.map((key, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.key, key === "" && styles.keyGhost]}
                  onPress={() => key && pressKey(key)}
                  activeOpacity={0.6}
                  disabled={key === ""}
                >
                  {key === "DEL"
                    ? <Feather name="delete" size={22} color="rgba(212,168,67,0.7)" />
                    : <Text style={styles.keyText}>{key}</Text>
                  }
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {showBiometric && (
          <TouchableOpacity style={styles.biometricBtn} onPress={authenticateBiometric} activeOpacity={0.75}>
            <Feather name="shield" size={22} color="#D4A843" />
            <Text style={styles.biometricText}>Use Fingerprint</Text>
          </TouchableOpacity>
        )}

        {!showPin && !showBiometric && (
          <Text style={styles.noAuth}>No lock method active</Text>
        )}
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Private & Secure · Maha Laxmi Transport Co.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060E1C", alignItems: "center", justifyContent: "center" },
  glow: {
    position: "absolute",
    top: "25%",
    alignSelf: "center",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(212,168,67,0.04)",
  },
  inner: { alignItems: "center", width: "100%", paddingHorizontal: 36 },
  top: { alignItems: "center", marginBottom: 48 },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: "rgba(212,168,67,0.25)",
    backgroundColor: "rgba(212,168,67,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    overflow: "hidden",
  },
  logo: { width: 86, height: 86, borderRadius: 43 },
  company: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#D4A843",
    letterSpacing: 5,
  },
  companyLine2: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "rgba(212,168,67,0.5)",
    letterSpacing: 5,
    marginTop: 3,
  },
  tagline: {
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    fontFamily: "Inter_400Regular",
    marginTop: 12,
    letterSpacing: 0.3,
  },
  pinSection: { alignItems: "center", width: "100%" },
  prompt: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
    letterSpacing: 0.2,
  },
  errorText: { color: "#E05C5C" },
  dots: { flexDirection: "row", gap: 22, marginBottom: 40 },
  dot: {
    width: 13, height: 13, borderRadius: 7,
    borderWidth: 1.5, borderColor: "rgba(212,168,67,0.5)",
    backgroundColor: "transparent",
  },
  dotFilled: { backgroundColor: "#D4A843", borderColor: "#D4A843" },
  keypad: { flexDirection: "row", flexWrap: "wrap", width: 270, gap: 12 },
  key: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  keyGhost: { backgroundColor: "transparent", borderColor: "transparent" },
  keyText: { fontSize: 26, fontFamily: "Inter_400Regular", color: "#FFFFFF" },
  biometricBtn: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.2)",
    backgroundColor: "rgba(212,168,67,0.07)",
  },
  biometricText: { color: "#D4A843", fontFamily: "Inter_500Medium", fontSize: 14 },
  noAuth: { color: "rgba(255,255,255,0.2)", fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 20 },
  footer: { position: "absolute", bottom: 36 },
  footerText: { fontSize: 10, color: "rgba(255,255,255,0.12)", fontFamily: "Inter_400Regular", letterSpacing: 0.3 },
});
