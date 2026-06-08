/**
 * Biometric authentication service using the browser's WebAuthn API.
 * This enables TouchID / FaceID / Windows Hello passwordless checks in the web app
 * and provides scaffolding for Capacitor Biometrics plugin.
 */

const CREDENTIAL_KEY = "@mltc_webauthn_credential";

export async function checkBiometricsSupport(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return false;
  }
  
  try {
    // Check if platform authenticator (e.g. Touch ID, Windows Hello) is available
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

export async function enrollBiometrics(): Promise<string | null> {
  const isSupported = await checkBiometricsSupport();
  if (!isSupported) {
    throw new Error("Biometric hardware or authentication not supported on this device/browser.");
  }

  const randomChallenge = new Uint8Array(32);
  window.crypto.getRandomValues(randomChallenge);

  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
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
      { alg: -7, type: "public-key" }, // ES256
      { alg: -257, type: "public-key" }, // RS256
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
      // Save enrolled credential ID
      localStorage.setItem(CREDENTIAL_KEY, credential.id);
      return credential.id;
    }
    return null;
  } catch (err) {
    console.error("WebAuthn enrollment error:", err);
    throw err;
  }
}

export async function authenticateBiometricWeb(): Promise<boolean> {
  const credentialId = localStorage.getItem(CREDENTIAL_KEY);
  if (!credentialId) {
    throw new Error("No biometrics registered on this device.");
  }

  const randomChallenge = new Uint8Array(32);
  window.crypto.getRandomValues(randomChallenge);

  // Convert stored credential ID back to BufferSource
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

export function isBiometricsRegistered(): boolean {
  return !!localStorage.getItem(CREDENTIAL_KEY);
}

export function removeBiometricsRegistration(): void {
  localStorage.removeItem(CREDENTIAL_KEY);
}
