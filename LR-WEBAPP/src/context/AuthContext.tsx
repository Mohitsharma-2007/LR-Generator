import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  checkBiometricsSupport,
  enrollBiometrics,
  authenticateBiometricWeb,
  isBiometricsRegistered,
  removeBiometricsRegistration,
} from "../services/biometricService";

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
  isEnrolled: boolean;
  unlock: () => void;
  authenticateBiometric: () => Promise<boolean>;
  verifyPin: (pin: string) => boolean;
  setBiometricEnabled: (v: boolean) => Promise<void>;
  updatePin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  registerBiometrics: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [biometricEnabled, setBiometricEnabled_] = useState(false);
  const [appPin, setAppPin_] = useState("");
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const supported = await checkBiometricsSupport();
        setHasBiometrics(supported);
        setIsEnrolled(isBiometricsRegistered());
      } catch {
        setHasBiometrics(false);
      }

      try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (raw) {
          const auth: AuthSettings = JSON.parse(raw);
          const pinVal = auth.appPin ?? "";
          const bioVal =
            (auth.biometricEnabled && isBiometricsRegistered()) ?? false;

          setBiometricEnabled_(bioVal);
          setAppPin_(pinVal);

          if (bioVal || pinVal) {
            setIsLocked(true);
          }
        }
      } catch {}
      setReady(true);
    }
    init();
  }, []);

  const persist = useCallback(async (patch: Partial<AuthSettings>) => {
    const raw = localStorage.getItem(AUTH_KEY);
    const current: AuthSettings = raw
      ? JSON.parse(raw)
      : { biometricEnabled: false, appPin: "" };
    const next = { ...current, ...patch };
    localStorage.setItem(AUTH_KEY, JSON.stringify(next));
    return next;
  }, []);

  const unlock = useCallback(() => setIsLocked(false), []);

  const authenticateBiometric = useCallback(async () => {
    if (!biometricEnabled) return false;
    try {
      const success = await authenticateBiometricWeb();
      if (success) {
        setIsLocked(false);
        return true;
      }
    } catch (err) {
      console.error("Biometric authentication error:", err);
    }
    return false;
  }, [biometricEnabled]);

  const registerBiometrics = useCallback(async () => {
    try {
      const credId = await enrollBiometrics();
      if (credId) {
        setIsEnrolled(true);
        setBiometricEnabled_(true);
        await persist({ biometricEnabled: true });
        return true;
      }
    } catch (err) {
      console.error("Biometric enrollment failed:", err);
    }
    return false;
  }, [persist]);

  const verifyPin = useCallback(
    (pin: string) => {
      if (appPin && pin === appPin) {
        setIsLocked(false);
        return true;
      }
      return false;
    },
    [appPin],
  );

  const setBiometricEnabled = useCallback(
    async (v: boolean) => {
      if (v) {
        // Must enroll first if not enrolled
        if (!isBiometricsRegistered()) {
          const success = await registerBiometrics();
          if (!success) return;
        }
      } else {
        removeBiometricsRegistration();
        setIsEnrolled(false);
      }
      setBiometricEnabled_(v);
      await persist({ biometricEnabled: v });
      if (v) setIsLocked(true);
    },
    [persist, registerBiometrics],
  );

  const updatePin = useCallback(
    async (pin: string) => {
      setAppPin_(pin);
      await persist({ appPin: pin });
      if (pin) setIsLocked(true);
    },
    [persist],
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
        isEnrolled,
        unlock,
        authenticateBiometric,
        verifyPin,
        setBiometricEnabled,
        updatePin,
        removePin,
        registerBiometrics,
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
