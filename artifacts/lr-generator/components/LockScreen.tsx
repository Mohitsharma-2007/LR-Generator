import { Feather } from "@expo/vector-icons";
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

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "DEL"];

export function LockScreen() {
  const {
    authenticateBiometric,
    verifyPin,
    appPin,
    biometricEnabled,
    hasBiometrics,
  } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const showPin = !!appPin;
  const showBiometric =
    biometricEnabled && hasBiometrics && Platform.OS !== "web";

  useEffect(() => {
    if (showBiometric) {
      const t = setTimeout(() => authenticateBiometric(), 400);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (pin.length === 4) {
      const ok = verifyPin(pin);
      if (!ok) {
        setError("Incorrect PIN. Try again.");
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 12, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -12, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
        ]).start(() => {
          setPin("");
          setTimeout(() => setError(""), 1600);
        });
      }
    }
  }, [pin]);

  function pressKey(key: string) {
    if (key === "DEL") {
      setPin((p) => p.slice(0, -1));
      setError("");
    } else if (pin.length < 4) {
      setPin((p) => p + key);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Image
          source={require("@/assets/logo/maha_laxmi.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.company}>MAHA LAXMI</Text>
        <Text style={styles.companyLine2}>TRANSPORT CO.</Text>
        <Text style={styles.tagline}>LR Generator · Secure Access</Text>
      </View>

      {showPin && (
        <View style={styles.pinSection}>
          <Text style={[styles.prompt, !!error && styles.errorText]}>
            {error || "Enter PIN to continue"}
          </Text>

          <Animated.View
            style={[styles.dots, { transform: [{ translateX: shakeAnim }] }]}
          >
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[styles.dot, pin.length > i && styles.dotFilled]}
              />
            ))}
          </Animated.View>

          <View style={styles.keypad}>
            {KEYS.map((key, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.key,
                  key === "" && styles.keyGhost,
                  key === "DEL" && styles.keyDel,
                ]}
                onPress={() => key && pressKey(key)}
                activeOpacity={0.65}
                disabled={key === ""}
              >
                {key === "DEL" ? (
                  <Feather name="delete" size={22} color="#D4A843" />
                ) : (
                  <Text style={styles.keyText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {showBiometric && (
        <TouchableOpacity
          style={styles.biometricBtn}
          onPress={authenticateBiometric}
          activeOpacity={0.8}
        >
          <Feather name="shield" size={28} color="#D4A843" />
          <Text style={styles.biometricText}>Use Fingerprint</Text>
        </TouchableOpacity>
      )}

      {!showPin && !showBiometric && (
        <Text style={styles.noAuth}>No lock method active</Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Maha Laxmi Transport Co. · Private & Secure
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A1628",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  top: { alignItems: "center", marginBottom: 44 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: "rgba(212,168,67,0.4)",
  },
  company: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#D4A843",
    letterSpacing: 5,
  },
  companyLine2: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#D4A843",
    letterSpacing: 6,
    opacity: 0.7,
    marginTop: 2,
  },
  tagline: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    fontFamily: "Inter_400Regular",
    marginTop: 10,
    letterSpacing: 0.5,
  },
  pinSection: { alignItems: "center", width: "100%" },
  prompt: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    fontFamily: "Inter_400Regular",
    marginBottom: 22,
    letterSpacing: 0.2,
  },
  errorText: { color: "#E05C5C" },
  dots: { flexDirection: "row", gap: 20, marginBottom: 38 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#D4A843",
    backgroundColor: "transparent",
  },
  dotFilled: { backgroundColor: "#D4A843" },
  keypad: { flexDirection: "row", flexWrap: "wrap", width: 276, gap: 12 },
  key: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(212,168,67,0.09)",
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  keyGhost: { backgroundColor: "transparent", borderColor: "transparent" },
  keyDel: { backgroundColor: "rgba(212,168,67,0.05)" },
  keyText: { fontSize: 26, fontFamily: "Inter_400Regular", color: "#FFFFFF" },
  biometricBtn: {
    marginTop: 32,
    alignItems: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.3)",
    backgroundColor: "rgba(212,168,67,0.08)",
  },
  biometricText: {
    color: "#D4A843",
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  noAuth: {
    color: "rgba(255,255,255,0.3)",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  footer: { position: "absolute", bottom: 40 },
  footerText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.18)",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
  },
});
