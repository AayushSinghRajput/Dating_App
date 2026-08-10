import { useEffect, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { googleSignIn, AuthResponse } from "@/services/authService";

WebBrowser.maybeCompleteAuthSession();

// Wraps Google's OIDC id-token flow: prompts the system browser, sends the
// resulting id_token to our backend for verification, and returns a normal
// app AuthResponse — same shape as the email/password login/register calls.
export function useGoogleAuth(acceptedTerms?: boolean) {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });

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
  }, [response]);

  return {
    ready: !!request,
    loading,
    promptAsync,
    result,
  };
}
