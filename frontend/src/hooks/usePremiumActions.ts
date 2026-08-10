import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { getPremiumStatus, activateBoost, PremiumStatus } from "@/services/paymentService";
import { rewindLastSwipe } from "@/services/matchService";

// Shared Boost/Rewind logic, used by any entry point (header action sheet,
// discovery toolbar, etc.) so the premium-gate behavior stays consistent.
export function usePremiumActions() {
  const router = useRouter();
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [rewinding, setRewinding] = useState(false);
  const [boosting, setBoosting] = useState(false);

  const loadStatus = useCallback(() => {
    getPremiumStatus().then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const goPremium = useCallback(() => router.push("/screen/PaymentSettings"), [router]);

  const handleRewind = useCallback(async () => {
    if (rewinding) return;
    setRewinding(true);
    try {
      await rewindLastSwipe();
      Toast.show({ type: "success", text1: "Last swipe undone" });
    } catch (error: any) {
      if (error.message?.includes("Premium")) {
        Toast.show({ type: "info", text1: "Rewind is a Premium feature", text2: "Tap to upgrade", onPress: goPremium });
      } else {
        Toast.show({ type: "error", text1: "Couldn't rewind", text2: error.message });
      }
    } finally {
      setRewinding(false);
    }
  }, [rewinding, goPremium]);

  const handleBoost = useCallback(async () => {
    if (boosting) return;
    setBoosting(true);
    try {
      await activateBoost();
      Toast.show({ type: "success", text1: "Boost activated!", text2: "You're getting priority visibility for 30 minutes." });
      loadStatus();
    } catch (error: any) {
      if (error.message?.includes("Premium")) {
        Toast.show({ type: "info", text1: "Boost is a Premium feature", text2: "Tap to upgrade", onPress: goPremium });
      } else {
        Toast.show({ type: "error", text1: "Couldn't boost", text2: error.message });
      }
    } finally {
      setBoosting(false);
    }
  }, [boosting, loadStatus, goPremium]);

  return { status, rewinding, boosting, handleRewind, handleBoost };
}
