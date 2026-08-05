import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, Dimensions } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

const { width } = Dimensions.get("window");

export default function PaymentSettings() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string | null>("premium");
  const [autoRenew, setAutoRenew] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState("card-1");

  const handleBack = () => {
    router.back();
  };

  const handleSubscribe = (plan: string) => {
    setSelectedPlan(plan);
    Alert.alert(
      "Confirm Subscription",
      `Are you sure you want to subscribe to the ${plan} plan?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Subscribe",
          style: "default",
          onPress: () => {
            Alert.alert("Success", `You have successfully subscribed to ${plan} plan!`);
          }
        },
      ]
    );
  };

  const PaymentMethod = ({
    id,
    type,
    last4,
    expiry,
    isDefault = false
  }: {
    id: string;
    type: string;
    last4: string;
    expiry: string;
    isDefault?: boolean;
  }) => (
    <Pressable
      style={[
        styles.paymentMethod,
        { backgroundColor: colors.surfaceAlt, borderColor: "transparent" },
        selectedPayment === id && [styles.selectedPaymentMethod, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]
      ]}
      onPress={() => setSelectedPayment(id)}
    >
      <View style={styles.paymentMethodLeft}>
        <View style={[styles.paymentIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {type === "visa" ? (
            <Ionicons name="card" size={24} color={colors.text} />
          ) : (
            <Ionicons name="phone-portrait" size={20} color={colors.text} />
          )}
        </View>
        <View style={styles.paymentInfo}>
          <Text style={[styles.paymentType, { color: colors.text }]}>
            {type === "visa" ? "Visa" : "Mobile Payment"} •••• {last4}
          </Text>
          <Text style={[styles.paymentExpiry, { color: colors.textSecondary }]}>Expires {expiry}</Text>
          {isDefault && (
            <View style={[styles.defaultBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.radioContainer}>
        <View style={[
          styles.radio,
          { borderColor: colors.textTertiary },
          selectedPayment === id && { borderColor: colors.accent, backgroundColor: colors.accent }
        ]} />
      </View>
    </Pressable>
  );

  const SubscriptionPlan = ({
    name,
    price,
    period,
    features,
    popular = false
  }: {
    name: string;
    price: string;
    period: string;
    features: string[];
    popular?: boolean;
  }) => (
    <Pressable
      style={[
        styles.planCard,
        { backgroundColor: colors.surfaceAlt, borderColor: "transparent" },
        selectedPlan === name.toLowerCase() && [styles.selectedPlan, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]
      ]}
      onPress={() => setSelectedPlan(name.toLowerCase())}
    >
      {popular && <View style={[styles.popularBadge, { backgroundColor: colors.accent }]}><Text style={styles.popularText}>MOST POPULAR</Text></View>}

      <View style={styles.planHeader}>
        <Text style={[styles.planName, { color: colors.text }]}>{name}</Text>
        <View style={styles.priceContainer}>
          <Text style={[styles.planPrice, { color: colors.accent }]}>{price}</Text>
          <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>/{period}</Text>
        </View>
      </View>

      <View style={styles.featuresList}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={[
          styles.subscribeButton,
          { backgroundColor: colors.border },
          selectedPlan === name.toLowerCase() && [styles.subscribeButtonActive, { backgroundColor: colors.accent }]
        ]}
        onPress={() => handleSubscribe(name)}
      >
        <Text style={[
          styles.subscribeText,
          { color: colors.textSecondary },
          selectedPlan === name.toLowerCase() && styles.subscribeTextActive
        ]}>
          {selectedPlan === name.toLowerCase() ? "Selected" : "Select Plan"}
        </Text>
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, shadowColor: colors.shadow }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payment & Subscriptions</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Plan Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Plan</Text>
          <View style={[styles.currentPlanCard, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoftPressed }]}>
            <View style={styles.planStatus}>
              <Ionicons name="diamond" size={24} color={colors.accent} />
              <View style={styles.planStatusText}>
                <Text style={[styles.planStatusTitle, { color: colors.text }]}>Premium Plan</Text>
                <Text style={[styles.planStatusSubtitle, { color: colors.textSecondary }]}>Active • Renews on Jan 15, 2024</Text>
              </View>
            </View>
            <Pressable style={[styles.manageButton, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
              <Text style={[styles.manageButtonText, { color: colors.accent }]}>Manage</Text>
            </Pressable>
          </View>
        </View>

        {/* Subscription Plans */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upgrade Your Plan</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Choose the plan that works best for you
          </Text>

          <SubscriptionPlan
            name="Basic"
            price="$9.99"
            period="month"
            features={[
              "5 Super Likes per week",
              "1 Boost per month",
              "Basic filters",
              "Standard messaging"
            ]}
          />

          <SubscriptionPlan
            name="Premium"
            price="$19.99"
            period="month"
            features={[
              "Unlimited Super Likes",
              "5 Boosts per month",
              "Advanced filters",
              "See who likes you",
              "Priority messaging",
              "Travel mode"
            ]}
            popular={true}
          />

          <SubscriptionPlan
            name="Annual"
            price="$149.99"
            period="year"
            features={[
              "All Premium features",
              "60% discount",
              "Priority customer support",
              "Profile highlighting",
              "Monthly insights report"
            ]}
          />
        </View>

        {/* Payment Methods */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Methods</Text>
            <Pressable style={[styles.addButton, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="add" size={20} color={colors.accent} />
              <Text style={[styles.addButtonText, { color: colors.accent }]}>Add New</Text>
            </Pressable>
          </View>

          <PaymentMethod
            id="card-1"
            type="visa"
            last4="4242"
            expiry="12/24"
            isDefault={true}
          />

          <PaymentMethod
            id="card-2"
            type="visa"
            last4="1881"
            expiry="08/25"
          />

          <PaymentMethod
            id="mobile-1"
            type="mobile"
            last4="1234"
            expiry="12/24"
          />
        </View>

        {/* Auto Renew */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.autoRenewOption}>
            <View style={styles.autoRenewLeft}>
              <Ionicons name="refresh-circle" size={24} color={colors.accent} />
              <View style={styles.autoRenewText}>
                <Text style={[styles.autoRenewTitle, { color: colors.text }]}>Auto Renew</Text>
                <Text style={[styles.autoRenewDescription, { color: colors.textSecondary }]}>
                  Automatically renew your subscription
                </Text>
              </View>
            </View>
            <Pressable
              style={[
                styles.toggle,
                { backgroundColor: colors.border },
                autoRenew && [styles.toggleActive, { backgroundColor: colors.accentSoftPressed }]
              ]}
              onPress={() => setAutoRenew(!autoRenew)}
            >
              <View style={[
                styles.toggleThumb,
                { backgroundColor: colors.surface, shadowColor: colors.shadow },
                autoRenew && [styles.toggleThumbActive, { backgroundColor: colors.accent }]
              ]} />
            </Pressable>
          </View>
        </View>

        {/* Billing History */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Billing History</Text>
          <Pressable style={[styles.billingItem, { borderBottomColor: colors.surfaceAlt }]}>
            <View style={styles.billingLeft}>
              <Ionicons name="receipt" size={20} color={colors.textSecondary} />
              <View style={styles.billingInfo}>
                <Text style={[styles.billingTitle, { color: colors.text }]}>Premium Subscription</Text>
                <Text style={[styles.billingDate, { color: colors.textSecondary }]}>Dec 15, 2023 • $19.99</Text>
              </View>
            </View>
            <Ionicons name="download" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable style={[styles.billingItem, { borderBottomColor: colors.surfaceAlt }]}>
            <View style={styles.billingLeft}>
              <Ionicons name="receipt" size={20} color={colors.textSecondary} />
              <View style={styles.billingInfo}>
                <Text style={[styles.billingTitle, { color: colors.text }]}>Boost Pack</Text>
                <Text style={[styles.billingDate, { color: colors.textSecondary }]}>Nov 28, 2023 • $9.99</Text>
              </View>
            </View>
            <Ionicons name="download" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Support Section */}
        <View style={[styles.supportSection, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark" size={24} color={colors.success} />
          <View style={styles.supportText}>
            <Text style={[styles.supportTitle, { color: colors.success }]}>Secure & Encrypted</Text>
            <Text style={[styles.supportDescription, { color: colors.textSecondary }]}>
              All payments are processed securely with 256-bit encryption
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerPlaceholder: {
    width: 40,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop:16,
    borderRadius: 16,
    padding: 20,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
    lineHeight: 18,
  },
  // Fixed Current Plan Card Layout
  currentPlanCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  planStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  planStatusText: {
    flex: 1,
  },
  planStatusTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  planStatusSubtitle: {
    fontSize: 13,
  },
  manageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80, // Fixed minimum width
    alignItems: "center",
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    position: "relative",
  },
  selectedPlan: {},
  popularBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  priceContainer: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "800",
  },
  planPeriod: {
    fontSize: 14,
    fontWeight: "500",
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  subscribeButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  subscribeButtonActive: {},
  subscribeText: {
    fontSize: 16,
    fontWeight: "700",
  },
  subscribeTextActive: {
    color: "#fff",
  },
  paymentMethod: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  selectedPaymentMethod: {},
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
    marginRight: 12,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentType: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  paymentExpiry: {
    fontSize: 13,
  },
  defaultBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  radioContainer: {
    padding: 4,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  radioSelected: {},
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  autoRenewOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  autoRenewLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  autoRenewText: {
    flex: 1,
  },
  autoRenewTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  autoRenewDescription: {
    fontSize: 13,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: "center",
    flexShrink: 0,
  },
  toggleActive: {},
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  billingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  billingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  billingInfo: {
    flex: 1,
  },
  billingTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  billingDate: {
    fontSize: 13,
  },
  supportSection: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  supportText: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  supportDescription: {
    fontSize: 13,
    lineHeight: 16,
  },
});
