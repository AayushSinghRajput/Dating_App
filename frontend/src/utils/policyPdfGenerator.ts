import { Platform, Share } from "react-native";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as FileSystem from "expo-file-system/legacy";

export interface PolicySectionData {
  id: string;
  title: string;
  content: string;
  highlights?: string[];
}

export const SOULMATE_POLICY_SECTIONS: PolicySectionData[] = [
  {
    id: "1",
    title: "1. Introduction & Our Privacy Philosophy",
    content:
      "Welcome to Soulmate. We believe meaningful romance starts with authenticity and uncompromising privacy. This Privacy Policy outlines our transparent approach to how we collect, use, protect, and respect your personal information when you use Soulmate mobile applications, web portals, and services.",
    highlights: [
      "We treat your dating life with the utmost confidentiality.",
      "You always have full control over who discovers your profile.",
      "We never sell your sensitive information or personal messages to third parties.",
    ],
  },
  {
    id: "2",
    title: "2. Information We Collect",
    content:
      "To provide genuine matches and ensure community safety, we collect information you share directly with us as well as diagnostic telemetry when using the app.",
    highlights: [
      "Account Credentials: Email address, phone number, date of birth, gender, and sexual orientation.",
      "Profile Data: Photos, relationship goals, lifestyle preferences, prompts, and bio.",
      "Verification Selfies: Used strictly to verify identity against catfish accounts, processed securely and never shown publicly.",
      "Approximate Geolocation: Device coordinates used only to calculate distance to matches (never exact addresses).",
      "Usage & Messaging Data: Swipe activity and chat messages encrypted in transit.",
    ],
  },
  {
    id: "3",
    title: "3. How We Process & Utilize Your Data",
    content:
      "We utilize modern matchmaking algorithms and safety systems designed to spark authentic connections while protecting members from bad actors.",
    highlights: [
      "Smart Matchmaking: Matching compatible singles based on mutual preferences and distance.",
      "Safety Screening: Automated fraud detection, harassment prevention, and anti-spam filters.",
      "Customer Support: Resolving inquiries, billing questions, and trust reports.",
      "Continuous Improvement: Analyzing aggregate trends to optimize discovery quality.",
    ],
  },
  {
    id: "4",
    title: "4. Information Sharing & Third Parties",
    content:
      "Soulmate does NOT sell your personal data or photos to data brokers or advertising networks. We only share information under strict, audited boundaries.",
    highlights: [
      "Other Members: Your public profile is visible based on your visibility & Incognito settings.",
      "Infrastructure Vendors: Secured cloud providers (AWS/GCP) operating under strict data processing agreements.",
      "Legal & Safety Authorities: Only when required by law or to prevent imminent physical harm.",
    ],
  },
  {
    id: "5",
    title: "5. Real-Time Location & Geolocation Privacy",
    content:
      "Distance calculations are essential for finding matches nearby. However, Soulmate safeguards your physical whereabouts through privacy-preserving geofencing.",
    highlights: [
      "Exact GPS coordinates are never displayed to other users.",
      "Distance is shown only as an approximate radius (e.g. '3 km away').",
      "You can toggle distance visibility off at any time in Account Privacy settings.",
    ],
  },
  {
    id: "6",
    title: "6. Your Privacy Rights & Controls",
    content:
      "Regardless of where you reside, Soulmate grants you world-class data rights aligned with GDPR, CCPA, and international privacy standards.",
    highlights: [
      "Incognito Mode: Browse in stealth mode where only people you've liked can discover you.",
      "Right to Access & Portability: Download a copy of your personal data archive.",
      "Right to Erasure: Permanent account deletion irreversibly scrubs your profile within 30 days.",
    ],
  },
  {
    id: "7",
    title: "7. Data Security Architecture",
    content:
      "We implement defense-in-depth security standards to protect your intimate conversations and personal records from unauthorized access.",
    highlights: [
      "TLS 1.3 cryptographic protocols for all data in transit.",
      "AES-256 bit military-grade encryption for stored media and databases.",
      "Regular automated penetration testing and vulnerability mitigation.",
    ],
  },
  {
    id: "8",
    title: "8. Age Requirement & Child Safety",
    content:
      "Soulmate is strictly designed for adults aged 18 and older. We enforce zero tolerance for underage accounts. Anyone found attempting to register under 18 is permanently blocked and their records purged.",
  },
  {
    id: "9",
    title: "9. Data Retention Policy",
    content:
      "We only retain your personal data for as long as your account is active. When you delete your account, your profile is immediately hidden, and all associated media, match histories, and chat logs are completely expunged within 30 days.",
  },
  {
    id: "10",
    title: "10. Contacting Our Data Protection Officer (DPO)",
    content:
      "If you have inquiries, feedback, or wish to exercise statutory data rights, reach out directly to our dedicated Trust & Safety Team.",
    highlights: [
      "Email: soulmatelumi@gmail.com",
      "Department: Office of the Data Protection Officer (DPO)",
      "Organization: Soulmate Dating Technologies Inc.",
      "Response Time: Within 24-48 business hours",
    ],
  },
  {
    id: "11",
    title: "11. End User License Agreement (EULA) & UGC Safety",
    content:
      "Soulmate maintains a strict zero-tolerance policy for objectionable content and abusive users. All community members must comply with these terms.",
    highlights: [
      "Zero tolerance for hate speech, harassment, nudity, scams, or offensive content.",
      "In-app Report & Block features are available on every chat and user profile.",
      "Moderation team reviews and acts on all flagged reports within 24 hours.",
      "Violations result in immediate content deletion and permanent account bans.",
    ],
  },
];

function wrapText(text: string, maxLen = 92): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxLen) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Builds the official Soulmate Privacy Policy PDF document in pure JavaScript using pdf-lib.
 * Generates an authentic, beautifully styled, multi-page branded PDF.
 */
export async function generateSoulmatePdfBytes(): Promise<string> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await doc.embedFont(StandardFonts.HelveticaOblique);

  const primaryRed = rgb(0.902, 0.224, 0.275); // #e63946
  const darkNavy = rgb(0.08, 0.11, 0.17);
  const secondaryGray = rgb(0.35, 0.41, 0.5);
  const lightBg = rgb(0.99, 0.96, 0.96);
  const lightBorder = rgb(0.94, 0.85, 0.86);

  // ================= PAGE 1 =================
  const page1 = doc.addPage([595.28, 841.89]);
  let y = 800;

  // Header Banner
  page1.drawRectangle({
    x: 36,
    y: 720,
    width: 523,
    height: 84,
    color: primaryRed,
  });

  page1.drawText("SOULMATE", {
    x: 52,
    y: 772,
    size: 24,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page1.drawText("OFFICIAL PRIVACY & DATA GOVERNANCE POLICY", {
    x: 52,
    y: 752,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page1.drawText("Where Genuine Hearts Connect Safely • Version 3.4 • October 2026", {
    x: 52,
    y: 736,
    size: 8.5,
    font: font,
    color: rgb(0.96, 0.96, 0.96),
  });

  // Trust Pillars Card
  y = 705;
  page1.drawRectangle({
    x: 36,
    y: 620,
    width: 523,
    height: 90,
    color: lightBg,
    borderColor: lightBorder,
    borderWidth: 1,
  });

  page1.drawText("THE SOULMATE PRIVACY PROMISE", {
    x: 48,
    y: 692,
    size: 9.5,
    font: boldFont,
    color: primaryRed,
  });

  const pillars = [
    "1. Zero Sale of Personal Data: We never sell your photos, chat logs, or identity to brokers.",
    "2. Granular Stealth & Incognito: Browse completely hidden from discovery queues at will.",
    "3. End-to-End Chat Encryption: Intimate conversations are shielded with TLS 1.3 & AES-256.",
    "4. Immediate Right to Erasure: Permanent account deletion completely purges all data in 30 days.",
  ];

  let pillarY = 674;
  for (const pillar of pillars) {
    page1.drawText(pillar, {
      x: 48,
      y: pillarY,
      size: 8,
      font: font,
      color: darkNavy,
    });
    pillarY -= 13;
  }

  // Articles for Page 1 (Sections 1, 2, 3)
  y = 600;
  const page1Sections = SOULMATE_POLICY_SECTIONS.slice(0, 3);

  for (const sec of page1Sections) {
    page1.drawText(sec.title.toUpperCase(), {
      x: 36,
      y,
      size: 11,
      font: boldFont,
      color: primaryRed,
    });
    y -= 14;

    const contentLines = wrapText(sec.content, 94);
    for (const line of contentLines) {
      page1.drawText(line, {
        x: 36,
        y,
        size: 8.5,
        font: font,
        color: darkNavy,
      });
      y -= 11.5;
    }
    y -= 4;

    if (sec.highlights) {
      for (const h of sec.highlights) {
        const hLines = wrapText("•  " + h, 90);
        for (const hl of hLines) {
          page1.drawText(hl, {
            x: 44,
            y,
            size: 8,
            font: font,
            color: secondaryGray,
          });
          y -= 11;
        }
      }
    }
    y -= 10;
  }

  // Page 1 Footer
  page1.drawText("Soulmate Technologies Inc. • Confidential Legal Document • Page 1 of 2", {
    x: 36,
    y: 25,
    size: 8,
    font: italicFont,
    color: secondaryGray,
  });

  // ================= PAGE 2 =================
  const page2 = doc.addPage([595.28, 841.89]);
  y = 805;

  // Mini header on Page 2
  page2.drawRectangle({
    x: 36,
    y: 775,
    width: 523,
    height: 32,
    color: primaryRed,
  });

  page2.drawText("SOULMATE • PRIVACY POLICY & USER SAFEGUARDS (PAGE 2)", {
    x: 48,
    y: 788,
    size: 9.5,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  y = 755;
  const page2Sections = SOULMATE_POLICY_SECTIONS.slice(3);

  for (const sec of page2Sections) {
    page2.drawText(sec.title.toUpperCase(), {
      x: 36,
      y,
      size: 10,
      font: boldFont,
      color: primaryRed,
    });
    y -= 13;

    const contentLines = wrapText(sec.content, 95);
    for (const line of contentLines) {
      page2.drawText(line, {
        x: 36,
        y,
        size: 8,
        font: font,
        color: darkNavy,
      });
      y -= 11;
    }
    y -= 3;

    if (sec.highlights) {
      for (const h of sec.highlights) {
        const hLines = wrapText("•  " + h, 90);
        for (const hl of hLines) {
          page2.drawText(hl, {
            x: 44,
            y,
            size: 7.8,
            font: font,
            color: secondaryGray,
          });
          y -= 10.5;
        }
      }
    }
    y -= 8;
  }

  // Official Legal Seal Box
  page2.drawRectangle({
    x: 36,
    y: 50,
    width: 523,
    height: 60,
    color: lightBg,
    borderColor: primaryRed,
    borderWidth: 1,
  });

  page2.drawText("[ SEAL ] CERTIFIED AUTHENTIC BY SOULMATE TRUST & SAFETY COUNCIL", {
    x: 48,
    y: 92,
    size: 9,
    font: boldFont,
    color: primaryRed,
  });

  page2.drawText("Office of the Data Protection Officer (DPO) • soulmatelumi@gmail.com", {
    x: 48,
    y: 78,
    size: 8,
    font: font,
    color: darkNavy,
  });

  page2.drawText("Official Document SM-POL-2026-V3.4 • Copyright 2026 Soulmate Technologies Inc.", {
    x: 48,
    y: 64,
    size: 7.5,
    font: italicFont,
    color: secondaryGray,
  });

  // Page 2 Footer
  page2.drawText("Soulmate Technologies Inc. • Confidential Legal Document • Page 2 of 2", {
    x: 36,
    y: 25,
    size: 8,
    font: italicFont,
    color: secondaryGray,
  });

  return await doc.saveAsBase64();
}

/**
 * Generates the Soulmate PDF and initiates share/download.
 * Safely handles mobile without requiring native ExpoPrint module.
 */
export async function downloadSoulmatePolicyPdf(): Promise<{
  success: boolean;
  uri?: string;
  error?: string;
  savedToStorage?: boolean;
}> {
  try {
    const base64Pdf = await generateSoulmatePdfBytes();

    // 1. Web environment: Trigger native browser anchor download
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${base64Pdf}`;
      link.download = "Soulmate_Privacy_Policy.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true, uri: link.href };
    }

    // 2. Native Mobile (Android / iOS): Write PDF to device storage via FileSystem
    const targetDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    const fileUri = `${targetDir}Soulmate_Privacy_Policy.pdf`;

    await FileSystem.writeAsStringAsync(fileUri, base64Pdf, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 3. Attempt native sharing via React Native's built-in Share API
    try {
      let shareUri = fileUri;
      if (Platform.OS === "android" && FileSystem.getContentUriAsync) {
        try {
          shareUri = await FileSystem.getContentUriAsync(fileUri);
        } catch {
          shareUri = fileUri;
        }
      }

      await Share.share({
        title: "Soulmate Privacy Policy",
        message: "Soulmate Official Privacy Policy (PDF)",
        url: shareUri,
      });
      return { success: true, uri: fileUri };
    } catch {
      // Fallback to direct file storage or SAF if sharing fails
    }

    // 4. Android fallback: StorageAccessFramework to save to Downloads
    if (Platform.OS === "android" && FileSystem.StorageAccessFramework) {
      try {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            "Soulmate_Privacy_Policy.pdf",
            "application/pdf"
          );
          await FileSystem.writeAsStringAsync(destinationUri, base64Pdf, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return { success: true, uri: destinationUri, savedToStorage: true };
        }
      } catch (safErr) {
        console.log("[Soulmate] SAF download error:", safErr);
      }
    }

    return { success: true, uri: fileUri };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to generate policy PDF" };
  }
}
