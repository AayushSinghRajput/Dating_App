import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import DetailHeader from "@/src/components/ui/DetailHeader";
import {
  EmergencyContact,
  getEmergencyContacts,
  updateEmergencyContacts,
} from "@/services/safetyService";
import { shareMyLocation } from "@/src/utils/safety";

const MAX_CONTACTS = 5;

interface PreDateCheckItem {
  id: string;
  label: string;
  tip: string;
}

const PRE_DATE_CHECKLIST: PreDateCheckItem[] = [
  { id: "public", label: "Public & lively venue chosen", tip: "Never meet at private residences or isolated areas on early dates." },
  { id: "ride", label: "Own transportation arranged", tip: "Take an Uber, public transit, or drive yourself so you can leave at any time." },
  { id: "friend", label: "Friend knows venue & date's name", tip: "Send your match's profile photo and where you'll be to someone you trust." },
  { id: "battery", label: "Phone fully charged", tip: "Bring a portable charger or make sure your battery has plenty of juice." },
  { id: "funds", label: "Independent payment ready", tip: "Always have cash or card ready in case you need to split or exit quickly." },
];

export default function SafetyCenter() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Pre-date interactive checklist state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    getEmergencyContacts()
      .then((data) => {
        if (mounted) setContacts(data || []);
      })
      .catch((error: any) => {
        Toast.show({
          type: "error",
          text1: "Failed to load emergency contacts",
          text2: error?.message || "Could not sync your safety circle.",
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/settings");
    }
  };

  const persistContacts = async (next: EmergencyContact[]) => {
    const previous = contacts;
    setContacts(next);
    setSaving(true);
    try {
      const saved = await updateEmergencyContacts(next);
      setContacts(saved || next);
      Toast.show({
        type: "success",
        text1: "Safety circle updated",
        text2: "Your trusted contacts have been saved.",
      });
    } catch (error: any) {
      setContacts(previous);
      Toast.show({
        type: "error",
        text1: "Failed to save contact",
        text2: error?.message || "Please check your connection.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = () => {
    if (!name.trim() || !phone.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please enter both contact name and phone number.",
      });
      return;
    }
    if (contacts.length >= MAX_CONTACTS) {
      Toast.show({
        type: "error",
        text1: "Maximum Reached",
        text2: `You can store up to ${MAX_CONTACTS} trusted contacts.`,
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const next = [...contacts, { name: name.trim(), phone: phone.trim() }];
    setName("");
    setPhone("");
    setShowAddModal(false);
    persistContacts(next);
  };

  const handleRemoveContact = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Alert.alert(
      "Remove Contact",
      `Are you sure you want to remove ${contacts[index]?.name || "this contact"} from your safety circle?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const next = contacts.filter((_, i) => i !== index);
            persistContacts(next);
          },
        },
      ]
    );
  };

  const handleCallContact = (phoneNum: string) => {
    Haptics.selectionAsync().catch(() => {});
    Linking.openURL(`tel:${phoneNum}`).catch(() => {
      Toast.show({
        type: "error",
        text1: "Could not place call",
        text2: "Your device could not open the phone dialer.",
      });
    });
  };

  const handleShareLocation = async () => {
    if (sharing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setSharing(true);
    try {
      await shareMyLocation();
      Toast.show({
        type: "success",
        text1: "Location Shared",
        text2: "Your live location pin has been dispatched.",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Couldn't share location",
        text2: error?.message || "Location permission is required.",
      });
    } finally {
      setSharing(false);
    }
  };

  const toggleChecklist = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedChecksCount = Object.values(checkedItems).filter(Boolean).length;

  const handleEmergencySOS = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    Alert.alert(
      "Emergency Assistance",
      "If you are in immediate danger, dial local emergency dispatch services right away.",
      [
        {
          text: "Call Police / 100",
          style: "destructive",
          onPress: () => Linking.openURL("tel:100"),
        },
        {
          text: "Call Emergency / 112",
          onPress: () => Linking.openURL("tel:112"),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Safety Center" onBack={handleBack} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading safety tools...
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Trust Banner */}
            <View style={styles.heroOuter}>
              <LinearGradient
                colors={["#e63946", "#ff6b78", "#ff85a1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroTopRow}>
                  <View style={styles.heroIconBadge}>
                    <Ionicons name="shield-checkmark" size={26} color="#ffffff" />
                  </View>
                  <View style={styles.heroStatusBadge}>
                    <Ionicons name="heart" size={12} color="#ffffff" />
                    <Text style={styles.heroStatusText}>24/7 DATING SAFETY</Text>
                  </View>
                </View>

                <Text style={styles.heroTitle}>Your Safety Comes First</Text>
                <Text style={styles.heroSubtitle}>
                  Meet with confidence, keep trusted friends in the loop, and use real-time tools to date on your terms.
                </Text>

                <View style={styles.quickMetricsRow}>
                  <View style={styles.quickMetricItem}>
                    <Ionicons name="location" size={13} color="#ffffff" />
                    <Text style={styles.quickMetricText}>Live GPS Share</Text>
                  </View>
                  <View style={styles.quickMetricDivider} />
                  <View style={styles.quickMetricItem}>
                    <Ionicons name="call" size={13} color="#ffffff" />
                    <Text style={styles.quickMetricText}>SOS Circle</Text>
                  </View>
                  <View style={styles.quickMetricDivider} />
                  <View style={styles.quickMetricItem}>
                    <Ionicons name="checkmark-done-circle" size={13} color="#ffffff" />
                    <Text style={styles.quickMetricText}>Date Checklist</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Live Date Location Sharing Card */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconWrap, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="navigate-circle" size={24} color={colors.accent} />
                </View>
                <View style={styles.cardHeaderText}>
                  <View style={styles.titleBadgeRow}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      Meeting Someone IRL?
                    </Text>
                    <View style={[styles.liveBadge, { backgroundColor: colors.accentSoft }]}>
                      <Text style={[styles.liveBadgeText, { color: colors.accent }]}>
                        ACTIVE TOOL
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                    Share your exact real-time Google Maps pin with trusted friends before or during a date.
                  </Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryActionButton,
                  pressed && styles.actionButtonPressed,
                  sharing && styles.actionButtonDisabled,
                ]}
                onPress={handleShareLocation}
                disabled={sharing}
              >
                <LinearGradient
                  colors={["#e63946", "#ff6b78"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryActionGradient}
                >
                  {sharing ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.primaryActionText}>Fetching Coordinates...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="share-social-outline" size={20} color="#ffffff" />
                      <Text style={styles.primaryActionText}>Share My Live Location</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            {/* Trusted Emergency Circle Section */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  Trusted Emergency Circle
                </Text>
                <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
                  People you trust to reach immediately in any emergency ({contacts.length}/{MAX_CONTACTS})
                </Text>
              </View>

              {contacts.length < MAX_CONTACTS && (
                <Pressable
                  style={[styles.addPillBtn, { backgroundColor: colors.accentSoft }]}
                  onPress={() => setShowAddModal(true)}
                >
                  <Ionicons name="add" size={16} color={colors.accent} />
                  <Text style={[styles.addPillText, { color: colors.accent }]}>Add</Text>
                </Pressable>
              )}
            </View>

            <View
              style={[
                styles.contactsCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {contacts.length === 0 ? (
                <View style={styles.emptyContactsWrap}>
                  <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceAlt }]}>
                    <Ionicons name="people-outline" size={32} color={colors.textTertiary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No Emergency Contacts Yet
                  </Text>
                  <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                    Add close friends or family members who should be reached in case you need assistance on a date.
                  </Text>
                  <Pressable
                    style={[styles.emptyAddBtn, { backgroundColor: colors.accentSoft }]}
                    onPress={() => setShowAddModal(true)}
                  >
                    <Ionicons name="person-add-outline" size={16} color={colors.accent} />
                    <Text style={[styles.emptyAddBtnText, { color: colors.accent }]}>
                      Add First Contact
                    </Text>
                  </Pressable>
                </View>
              ) : (
                contacts.map((contact, index) => {
                  const initials = contact.name
                    ? contact.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "SO";

                  return (
                    <View
                      key={`${contact.phone}-${index}`}
                      style={[
                        styles.contactRow,
                        {
                          borderBottomColor:
                            index === contacts.length - 1 ? "transparent" : colors.border,
                        },
                      ]}
                    >
                      <View style={[styles.contactAvatar, { backgroundColor: colors.accentSoft }]}>
                        <Text style={[styles.contactAvatarText, { color: colors.accent }]}>
                          {initials}
                        </Text>
                      </View>

                      <View style={styles.contactDetails}>
                        <Text style={[styles.contactName, { color: colors.text }]}>
                          {contact.name}
                        </Text>
                        <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>
                          {contact.phone}
                        </Text>
                      </View>

                      <View style={styles.contactActions}>
                        <Pressable
                          style={[styles.callCircleBtn, { backgroundColor: colors.surfaceAlt }]}
                          onPress={() => handleCallContact(contact.phone)}
                          hitSlop={6}
                        >
                          <Ionicons name="call-outline" size={17} color={colors.accent} />
                        </Pressable>

                        <Pressable
                          style={[styles.deleteCircleBtn, { backgroundColor: colors.surfaceAlt }]}
                          onPress={() => handleRemoveContact(index)}
                          hitSlop={6}
                        >
                          <Ionicons name="trash-outline" size={17} color={colors.textTertiary} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Interactive First Date Checklist */}
            <View style={styles.checklistSection}>
              <View style={styles.checklistTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>
                    Pre-Date Safety Checklist
                  </Text>
                  <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
                    Tick these off before heading out to your date ({completedChecksCount}/{PRE_DATE_CHECKLIST.length})
                  </Text>
                </View>
                <View style={[styles.progressBadge, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.progressBadgeText, { color: colors.accent }]}>
                    {completedChecksCount === PRE_DATE_CHECKLIST.length ? "READY" : `${completedChecksCount} / 5`}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.checklistCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {PRE_DATE_CHECKLIST.map((item, idx) => {
                  const isChecked = !!checkedItems[item.id];
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.checklistItem,
                        {
                          borderBottomColor:
                            idx === PRE_DATE_CHECKLIST.length - 1 ? "transparent" : colors.border,
                        },
                      ]}
                      onPress={() => toggleChecklist(item.id)}
                    >
                      <View
                        style={[
                          styles.checkboxCircle,
                          {
                            backgroundColor: isChecked ? colors.accent : "transparent",
                            borderColor: isChecked ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        {isChecked && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                      </View>

                      <View style={styles.checkTextWrap}>
                        <Text
                          style={[
                            styles.checkLabel,
                            {
                              color: colors.text,
                              textDecorationLine: isChecked ? "line-through" : "none",
                              opacity: isChecked ? 0.7 : 1,
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text style={[styles.checkTip, { color: colors.textSecondary }]}>
                          {item.tip}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Quick Safety Hub Links */}
            <View style={styles.quickHubSection}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                More Safety Tools &amp; Resources
              </Text>

              <View
                style={[
                  styles.hubCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Pressable
                  style={[styles.hubRow, { borderBottomColor: colors.border }]}
                  onPress={() => router.push("/screen/BlockedUsers")}
                >
                  <View style={[styles.hubIconCircle, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="ban-outline" size={18} color={colors.accent} />
                  </View>
                  <View style={styles.hubTextWrap}>
                    <Text style={[styles.hubTitle, { color: colors.text }]}>
                      Blocked Profiles
                    </Text>
                    <Text style={[styles.hubSubtitle, { color: colors.textSecondary }]}>
                      Manage people who cannot see your profile or contact you
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>

                <Pressable
                  style={[styles.hubRow, { borderBottomColor: colors.border }]}
                  onPress={() => router.push("/screen/PhotoVerification")}
                >
                  <View style={[styles.hubIconCircle, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
                  </View>
                  <View style={styles.hubTextWrap}>
                    <Text style={[styles.hubTitle, { color: colors.text }]}>
                      Photo Verification
                    </Text>
                    <Text style={[styles.hubSubtitle, { color: colors.textSecondary }]}>
                      Get the blue tick to prove you are authentic
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>

                <Pressable
                  style={[styles.hubRow, { borderBottomColor: "transparent" }]}
                  onPress={() => router.push("/screen/CommunityGuidelines")}
                >
                  <View style={[styles.hubIconCircle, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="heart-circle-outline" size={18} color={colors.accent} />
                  </View>
                  <View style={styles.hubTextWrap}>
                    <Text style={[styles.hubTitle, { color: colors.text }]}>
                      Community Guidelines
                    </Text>
                    <Text style={[styles.hubSubtitle, { color: colors.textSecondary }]}>
                      Zero tolerance policies on harassment, catfishing &amp; consent
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>
              </View>
            </View>

            {/* Emergency SOS Button */}
            <View style={styles.sosContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.sosButton,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
                onPress={handleEmergencySOS}
              >
                <View style={styles.sosButtonContent}>
                  <View style={styles.sosIconWrap}>
                    <Ionicons name="call" size={18} color="#dc2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sosTitle}>Need Urgent Emergency Help?</Text>
                    <Text style={styles.sosSubtitle}>
                      Tap here to view local police (100) &amp; emergency (112) hotlines
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#dc2626" />
                </View>
              </Pressable>
            </View>
          </ScrollView>

          {/* Add Contact Modal */}
          <Modal
            visible={showAddModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAddModal(false)}
          >
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setShowAddModal(false)}
            >
              <Pressable
                style={[
                  styles.modalContent,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIconWrap, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="person-add" size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalHeading, { color: colors.text }]}>
                      Add Trusted Contact
                    </Text>
                    <Text style={[styles.modalSubheading, { color: colors.textSecondary }]}>
                      They will only be reached when you trigger an emergency share
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.modalCloseCircle, { backgroundColor: colors.surfaceAlt }]}
                    onPress={() => setShowAddModal(false)}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>

                <View style={styles.modalForm}>
                  <View style={styles.modalInputGroup}>
                    <Text style={[styles.modalInputLabel, { color: colors.textSecondary }]}>
                      Contact Full Name
                    </Text>
                    <View
                      style={[
                        styles.modalInputWrap,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                      ]}
                    >
                      <Ionicons
                        name="person-outline"
                        size={17}
                        color={colors.textTertiary}
                        style={{ marginRight: 10 }}
                      />
                      <TextInput
                        placeholder="e.g. Maya Sharma (Bestie)"
                        placeholderTextColor={colors.textTertiary}
                        value={name}
                        onChangeText={setName}
                        style={[styles.modalTextInput, { color: colors.text }]}
                      />
                    </View>
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={[styles.modalInputLabel, { color: colors.textSecondary }]}>
                      Phone Number
                    </Text>
                    <View
                      style={[
                        styles.modalInputWrap,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                      ]}
                    >
                      <Ionicons
                        name="call-outline"
                        size={17}
                        color={colors.textTertiary}
                        style={{ marginRight: 10 }}
                      />
                      <TextInput
                        placeholder="e.g. +977 9812345678"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                        style={[styles.modalTextInput, { color: colors.text }]}
                      />
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.modalSaveBtn,
                      (!name.trim() || !phone.trim() || saving) && styles.modalSaveBtnDisabled,
                      pressed && { opacity: 0.9 },
                    ]}
                    onPress={handleAddContact}
                    disabled={!name.trim() || !phone.trim() || saving}
                  >
                    <LinearGradient
                      colors={["#e63946", "#ff6b78"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modalSaveGradient}
                    >
                      {saving ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                          <Text style={styles.modalSaveBtnText}>Save To Safety Circle</Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    paddingBottom: 40,
  },
  heroOuter: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: "#e63946",
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  heroCard: {
    borderRadius: 20,
    padding: 22,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  heroIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  heroStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  heroStatusText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 18,
    marginBottom: 16,
  },
  quickMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.16)",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  quickMetricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  quickMetricText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  quickMetricDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardHeaderText: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  liveBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  primaryActionButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  actionButtonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.9,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  primaryActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16.5,
    fontWeight: "700",
    marginBottom: 2,
  },
  sectionSubheading: {
    fontSize: 12,
  },
  addPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
  },
  addPillText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  contactsCard: {
    marginHorizontal: 16,
    marginBottom: 22,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  emptyContactsWrap: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptyDesc: {
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 6,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactAvatarText: {
    fontSize: 14,
    fontWeight: "800",
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 14.5,
    fontWeight: "600",
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 12.5,
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  callCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  checklistSection: {
    marginHorizontal: 16,
    marginBottom: 22,
  },
  checklistTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressBadge: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  progressBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  checklistCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkTextWrap: {
    flex: 1,
  },
  checkLabel: {
    fontSize: 13.5,
    fontWeight: "600",
    marginBottom: 2,
  },
  checkTip: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  quickHubSection: {
    marginHorizontal: 16,
    marginBottom: 22,
  },
  hubCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 10,
  },
  hubRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hubIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  hubTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  hubTitle: {
    fontSize: 14.5,
    fontWeight: "600",
    marginBottom: 2,
  },
  hubSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  sosContainer: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sosButton: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 16,
    padding: 14,
  },
  sosButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sosIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  sosTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b91c1c",
    marginBottom: 2,
  },
  sosSubtitle: {
    fontSize: 11.5,
    color: "#991b1b",
    lineHeight: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
    gap: 12,
  },
  modalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2,
  },
  modalSubheading: {
    fontSize: 12,
    lineHeight: 16,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalForm: {
    gap: 14,
  },
  modalInputGroup: {
    gap: 6,
  },
  modalInputLabel: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  modalInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 14,
  },
  modalSaveBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 6,
  },
  modalSaveBtnDisabled: {
    opacity: 0.65,
  },
  modalSaveGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  modalSaveBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
