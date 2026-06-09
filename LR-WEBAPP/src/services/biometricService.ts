/**
 * Biometric authentication service.
 * 
 * On native (Capacitor Android/iOS): uses capacitor-native-biometric
 *   which calls Android BiometricPrompt / iOS FaceID directly.
 * On web: falls back to WebAuthn platform authenticator (Touch ID, Windows Hello).
 */

import { Capacitor } from "@capacitor/core";
import { NativeBiometric } from "capacitor-native-biometric";

const CREDENTIAL_KEY = "@mltc_webauthn_credential";
const BIOMETRIC_ENROLLED_KEY = "@mltc_biometric_enrolled";

/**
 * Check if biometric hardware is available on this device.
 */
export async function checkBiometricsSupport(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch {
      return false;
    }
  }

  // Web fallback: WebAuthn
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Enroll biometrics.
 * On native: just mark as enrolled (no separate enrollment step needed).
 * On web: use WebAuthn credential creation.
 */
export async function enrollBiometrics(): Promise<string | null> {
  const isSupported = await checkBiometricsSupport();
  if (!isSupported) {
    throw new Error(
      "Biometric hardware or authentication not supported on this device."
    );
  }

  if (Capacitor.isNativePlatform()) {
    // Native biometric doesn't need a separate enrollment — the OS handles it.
    // We just verify once to confirm it works, then mark enrolled.
    try {
      await NativeBiometric.verifyIdentity({
        reason: "Setup biometric lock for LR Generator",
        title: "Enable Fingerprint",
        subtitle: "Verify your identity to enable biometric unlock",
        description: "Place your finger on the sensor",
      });
      localStorage.setItem(BIOMETRIC_ENROLLED_KEY, "true");
      return "native-biometric";
    } catch (err) {
      console.error("Native biometric enrollment failed:", err);
      throw err;
    }
  }

  // Web: WebAuthn enrollment
  const randomChallenge = new Uint8Array(32);
  window.crypto.getRandomValues(randomChallenge);

  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
    {
      challenge: randomChallenge,
      rp: {
        name: "Maha Laxmi Transport Co.",
        id: window.location.hostname,
      },
      user: {
        id: userId,
        name: "mohit.sharma@mltc.com",
        displayName: "Mohit Sharma",
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },
        { alg: -257, type: "public-key" },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60000,
    };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    if (credential && credential.id) {
      localStorage.setItem(CREDENTIAL_KEY, credential.id);
      localStorage.setItem(BIOMETRIC_ENROLLED_KEY, "true");
      return credential.id;
    }
    return null;
  } catch (err) {
    console.error("WebAuthn enrollment error:", err);
    throw err;
  }
}

/**
 * Authenticate using biometrics.
 * On native: shows Android fingerprint dialog.
 * On web: uses WebAuthn assertion.
 */
export async function authenticateBiometricWeb(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      await NativeBiometric.verifyIdentity({
        reason: "Unlock LR Generator",
        title: "Fingerprint Login",
        subtitle: "Use your fingerprint to unlock",
        description: "Place your finger on the sensor",
      });
      return true;
    } catch (err) {
      console.error("Native biometric verification failed:", err);
      return false;
    }
  }

  // Web: WebAuthn assertion
  const credentialId = localStorage.getItem(CREDENTIAL_KEY);
  if (!credentialId) {
    throw new Error("No biometrics registered on this device.");
  }

  const randomChallenge = new Uint8Array(32);
  window.crypto.getRandomValues(randomChallenge);
  const encoder = new TextEncoder();
  const rawId = encoder.encode(credentialId);

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: randomChallenge,
    rpId: window.location.hostname,
    allowCredentials: [
      {
        id: rawId,
        type: "public-key",
      },
    ],
    userVerification: "required",
    timeout: 60000,
  };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });
    return !!assertion;
  } catch (err) {
    console.error("WebAuthn verification error:", err);
    return false;
  }
}

/**
 * Check if biometrics has been enrolled/registered.
 */
export function isBiometricsRegistered(): boolean {
  return localStorage.getItem(BIOMETRIC_ENROLLED_KEY) === "true";
}

/**
 * Remove biometrics registration.
 */
export function removeBiometricsRegistration(): void {
  localStorage.removeItem(CREDENTIAL_KEY);
  localStorage.removeItem(BIOMETRIC_ENROLLED_KEY);
}
