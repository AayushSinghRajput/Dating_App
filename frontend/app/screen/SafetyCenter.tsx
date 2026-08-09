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
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import {
  EmergencyContact,
  getEmergencyContacts,
  updateEmergencyContacts,
} from "@/utils/api";
import { shareMyLocation } from "@/src/utils/safety";

const MAX_CONTACTS = 5;

export default function SafetyCenter() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    getEmergencyContacts()
      .then(setContacts)
      .catch((error: any) => {
        Toast.show({ type: "error", text1: "Failed to load emergency contacts", text2: error.message });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleBack = () => router.back();

  const persistContacts = async (next: EmergencyContact[]) => {
    const previous = contacts;
    setContacts(next);
    setSaving(true);
    try {
      const saved = await updateEmergencyContacts(next);
      setContacts(saved);
    } catch (error: any) {
      setContacts(previous);
      Toast.show({ type: "error", text1: "Failed to save contacts", text2: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = () => {
    if (!name.trim() || !phone.trim()) return;
    if (contacts.length >= MAX_CONTACTS) {
      Toast.show({ type: "error", text1: `You can save up to ${MAX_CONTACTS} contacts` });
      return;
    }
    const next = [...contacts, { name: name.trim(), phone: phone.trim() }];
    setName("");
    setPhone("");
    persistContacts(next);
  };

  const handleRemoveContact = (index: number) => {
    const next = contacts.filter((_, i) => i !== index);
    persistContacts(next);
  };

  const handleShareLocation = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await shareMyLocation();
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Couldn't share location", text2: error.message });
    } finally {
      setSharing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Safety Center</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Panic button */}
            <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Meeting someone in person?</Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Share your live location with someone you trust before or during a date.
              </Text>
              <Pressable
                style={[styles.panicButton, { backgroundColor: colors.accent }]}
                onPress={handleShareLocation}
                disabled={sharing}
              >
                {sharing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color="#fff" />
                    <Text style={styles.panicButtonText}>Share My Location</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Emergency contacts */}
            <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Trusted Contacts</Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Save people you'd want to reach quickly in an emergency.
              </Text>

              {contacts.map((contact, index) => (
                <View key={`${contact.phone}-${index}`} style={[styles.contactRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                    <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{contact.phone}</Text>
                  </View>
                  <Pressable onPress={() => handleRemoveContact(index)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={colors.textTertiary} />
                  </Pressable>
                </View>
              ))}

              {contacts.length < MAX_CONTACTS && (
                <View style={styles.addContactForm}>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                    <TextInput
                      placeholder="Contact name"
                      placeholderTextColor={colors.textTertiary}
                      value={name}
                      onChangeText={setName}
                      style={[styles.input, { color: colors.text }]}
                    />
                  </View>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                    <TextInput
                      placeholder="Phone number"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      style={[styles.input, { color: colors.text }]}
                    />
                  </View>
                  <Pressable
                    style={[
                      styles.addButton,
                      { backgroundColor: name.trim() && phone.trim() ? colors.accent : colors.textTertiary },
                    ]}
                    onPress={handleAddContact}
                    disabled={!name.trim() || !phone.trim() || saving}
                  >
                    <Text style={styles.addButtonText}>Add Contact</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 20, paddingBottom: 40 },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  sectionDescription: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  panicButton: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  panicButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  contactName: { fontSize: 15, fontWeight: "600" },
  contactPhone: { fontSize: 13, marginTop: 2 },
  addContactForm: { marginTop: 16 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15 },
  addButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
