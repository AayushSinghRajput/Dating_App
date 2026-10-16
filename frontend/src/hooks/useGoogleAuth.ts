import { useEffect, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { googleSignIn, AuthResponse } from "@/services/authService";

WebBrowser.maybeCompleteAuthSession();

// Wraps Google's OIDC id-token flow: prompts the system browser, sends the
// resulting id_token to our backend for verification, and returns a normal
export function useGoogleAuth(acceptedTerms?: boolean) {
  const [loading, setLoading] = useState(false);

  const androidClientId =
    process.env.EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  const androidClientPrefix = androidClientId?.replace(
    ".apps.googleusercontent.com",
    ""
  );

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      androidClientId,
    },
    {
      native: androidClientPrefix
        ? `com.googleusercontent.apps.${androidClientPrefix}:/oauth2redirect`
        : undefined,
    }
  );

  useEffect(() => {
    if (request) {
      console.log("[GoogleAuth] Initialized redirectUri:", request.redirectUri);
    }
  }, [request]);

  const [result, setResult] = useState<{
    data?: AuthResponse;
    error?: Error & { requiresSignup?: boolean };
  } | null>(null);

  useEffect(() => {
    if (response?.type !== "success") return;

    const idToken = response.params.id_token;
    setLoading(true);
    googleSignIn(idToken, acceptedTerms)
      .then((data) => setResult({ data }))
      .catch((error) => setResult({ error }))
      .finally(() => setLoading(false));
  }, [response, acceptedTerms]);

  return {
    ready: !!request,
    loading,
    promptAsync,
    result,
  };
}
