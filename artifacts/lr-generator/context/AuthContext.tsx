import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

const AUTH_KEY = "@mltc_auth_v1";

interface AuthSettings {
  biometricEnabled: boolean;
  appPin: string;
}

interface AuthContextType {
  isLocked: boolean;
  biometricEnabled: boolean;
  appPin: string;
  hasBiometrics: boolean;
  unlock: () => void;
  authenticateBiometric: () => Promise<boolean>;
  verifyPin: (pin: string) => boolean;
  setBiometricEnabled: (v: boolean) => Promise<void>;
  updatePin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [biometricEnabled, setBiometricEnabled_] = useState(false);
  const [appPin, setAppPin_] = useState("");
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      if (Platform.OS !== "web") {
        try {
          const compatible = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          setHasBiometrics(compatible && enrolled);
        } catch {}
      }
      try {
        const raw = await AsyncStorage.getItem(AUTH_KEY);
        if (raw) {
          const auth: AuthSettings = JSON.parse(raw);
          setBiometricEnabled_(auth.biometricEnabled ?? false);
          setAppPin_(auth.appPin ?? "");
          if (auth.biometricEnabled || auth.appPin) {
            setIsLocked(true);
          }
        }
      } catch {}
      setReady(true);
    }
    init();
  }, []);

  const persist = useCallback(
    async (patch: Partial<AuthSettings>) => {
      const raw = await AsyncStorage.getItem(AUTH_KEY);
      const current: AuthSettings = raw
        ? JSON.parse(raw)
        : { biometricEnabled: false, appPin: "" };
      const next = { ...current, ...patch };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(next));
      return next;
    },
    []
  );

  const unlock = useCallback(() => setIsLocked(false), []);

  const authenticateBiometric = useCallback(async () => {
    if (Platform.OS === "web") return false;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock MLTC LR Generator",
        cancelLabel: "Use PIN",
        disableDeviceFallback: true,
      });
      if (result.success) {
        setIsLocked(false);
        return true;
      }
    } catch {}
    return false;
  }, []);

  const verifyPin = useCallback(
    (pin: string) => {
      if (appPin && pin === appPin) {
        setIsLocked(false);
        return true;
      }
      return false;
    },
    [appPin]
  );

  const setBiometricEnabled = useCallback(
    async (v: boolean) => {
      setBiometricEnabled_(v);
      await persist({ biometricEnabled: v });
      if (v) setIsLocked(true);
    },
    [persist]
  );

  const updatePin = useCallback(
    async (pin: string) => {
      setAppPin_(pin);
      await persist({ appPin: pin });
    },
    [persist]
  );

  const removePin = useCallback(async () => {
    setAppPin_("");
    const next = await persist({ appPin: "" });
    if (!next.biometricEnabled) setIsLocked(false);
  }, [persist]);

  if (!ready) return null;

  return (
    <AuthContext.Provider
      value={{
        isLocked,
        biometricEnabled,
        appPin,
        hasBiometrics,
        unlock,
        authenticateBiometric,
        verifyPin,
        setBiometricEnabled,
        updatePin,
        removePin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
