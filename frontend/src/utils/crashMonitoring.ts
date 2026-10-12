import { Platform } from "react-native";
import Constants from "expo-constants";

export interface CrashReport {
  message: string;
  stack?: string;
  isFatal?: boolean;
  platform: string;
  appVersion: string;
  timestamp: string;
}

let isInitialized = false;

/**
 * Initializes global JavaScript error handling and crash reporting.
 * Captures unhandled exceptions and prevents silent crashes.
 */
export function initCrashMonitoring() {
  if (isInitialized) return;
  isInitialized = true;

  const defaultHandler =
    (global as any).ErrorUtils?.getGlobalHandler?.() ||
    ((error: any, isFatal?: boolean) => {
      console.error("[Unhandled Exception]", error);
    });

  if ((global as any).ErrorUtils) {
    (global as any).ErrorUtils.setGlobalHandler(
      (error: any, isFatal?: boolean) => {
        const report: CrashReport = {
          message: error?.message || String(error),
          stack: error?.stack,
          isFatal,
          platform: `${Platform.OS} ${Platform.Version}`,
          appVersion: Constants.expoConfig?.version || "1.0.0",
          timestamp: new Date().toISOString(),
        };

        console.error(
          `[CrashMonitoring] ${isFatal ? "FATAL " : ""}Crash captured:`,
          report.message
        );

        // If a remote Sentry DSN is configured, capture it
        if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
          sendToSentry(report).catch(() => {});
        }

        // Call the default handler to preserve native stack trace / debugger behavior
        if (defaultHandler) {
          defaultHandler(error, isFatal);
        }
      }
    );
  }
}

async function sendToSentry(report: CrashReport) {
  try {
    const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
    if (!dsn) return;

    // Simple Sentry envelope or HTTP store dispatch without bulky native binaries
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, "");
    const endpoint = `${url.protocol}//${url.host}/api/${projectId}/store/`;

    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${url.username}`,
      },
      body: JSON.stringify({
        message: report.message,
        level: report.isFatal ? "fatal" : "error",
        platform: "javascript",
        release: `soulmate@${report.appVersion}`,
        extra: {
          platform: report.platform,
          stack: report.stack,
        },
      }),
    });
  } catch {
    // Silently fail so crash reporter never throws another error
  }
}
