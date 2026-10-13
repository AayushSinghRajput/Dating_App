export type LanguageCode = "en" | "ne" | "hi";

export interface Translations {
  tabs: {
    home: string;
    likes: string;
    chat: string;
    settings: string;
  };
  common: {
    save: string;
    cancel: string;
    done: string;
    edit: string;
    back: string;
    loading: string;
    error: string;
    refresh: string;
    search: string;
    ok: string;
  };
  homeHeader: {
    getNoticed: string;
    boostActive: string;
    boostProfile: string;
    rewindSwipe: string;
  };
  discovery: {
    allCaughtUp: string;
    allCaughtUpSub: string;
    widenPreferences: string;
    rewind: string;
    viewLikes: string;
    yourMatches: string;
    sayHello: string;
    chat: string;
    exploreProfiles: string;
    noOneNearby: string;
    noOneNearbyDesc: string;
    lastSwipeUndone: string;
    profileRestored: string;
    couldNotRewind: string;
    superLike: string;
    match: string;
    verified: string;
    boosted: string;
  };
  likes: {
    title: string;
    likesYou: string;
    matches: string;
    noLikesYet: string;
    noLikesYetDesc: string;
    noMatchesYet: string;
    noMatchesYetDesc: string;
    findMatches: string;
    peopleLikedYou: string;
    personLikedYou: string;
    mutualMatches: string;
    mutualMatch: string;
    likedUser: string;
    failedToLike: string;
    failedToPass: string;
  };
  chatScreen: {
    title: string;
    unreadMessages: string;
    unreadMessage: string;
    allCaughtUp: string;
    searchPlaceholder: string;
    cancel: string;
    searchResults: string;
    recentConversations: string;
    onlineNow: string;
    noConversationsFound: string;
    trySearchingDifferent: string;
    loadingChats: string;
    chatSingular: string;
    chatPlural: string;
  };
  notificationsScreen: {
    title: string;
    unreadCount: string;
    all: string;
    unread: string;
    calls: string;
    likes: string;
    newSection: string;
    thisWeekSection: string;
    earlierSection: string;
    noNotifications: string;
    chatAction: string;
    viewAction: string;
    callBackAction: string;
  };
  settings: {
    title: string;
    subtitle: string;
    accountSection: string;
    accountDesc: string;
    safetySection: string;
    safetyDesc: string;
    preferencesSection: string;
    preferencesDesc: string;
    appearance: string;
    appearanceDesc: string;
    light: string;
    dark: string;
    system: string;
    editProfile: string;
    yourProfile: string;
    version: string;
    accountPrivacy: string;
    changePassword: string;
    emailVerification: string;
    photoVerification: string;
    safetyCenter: string;
    inviteFriends: string;
    notifications: string;
    payment: string;
    blockedUsers: string;
    language: string;
    helpSupport: string;
    logout: string;
    deleteAccount: string;
    logoutConfirmTitle: string;
    logoutConfirmMessage: string;
  };
  languageScreen: {
    title: string;
    currentLanguage: string;
    currentLanguageSubtitle: string;
    supportedLanguages: string;
    supportedSubtitle: string;
    selectPrompt: string;
    changedTitle: string;
    changedMessage: string;
    helpTitle: string;
    helpDescription: string;
  };
}

export const translations: Record<LanguageCode, Translations> = {
  en: {
    tabs: {
      home: "Home",
      likes: "Likes",
      chat: "Chat",
      settings: "Settings",
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      done: "Done",
      edit: "Edit",
      back: "Back",
      loading: "Loading...",
      error: "Error",
      refresh: "Refresh",
      search: "Search",
      ok: "OK",
    },
    homeHeader: {
      getNoticed: "Get noticed",
      boostActive: "Boosted — priority visibility active",
      boostProfile: "⚡ Boost My Profile",
      rewindSwipe: "↩️ Rewind Last Swipe",
    },
    discovery: {
      allCaughtUp: "You're All Caught Up! 🎉",
      allCaughtUpSub: "You've seen everyone nearby for now. Widen your preferences or say hi to your matches!",
      widenPreferences: "Widen Search Preferences",
      rewind: "Rewind",
      viewLikes: "View Likes",
      yourMatches: "Your Matches",
      sayHello: "Say hello while you wait for new people!",
      chat: "Chat",
      exploreProfiles: "Explore Profiles",
      noOneNearby: "No one new nearby",
      noOneNearbyDesc: "Check back soon, or widen your preferences to see more people.",
      lastSwipeUndone: "Last swipe undone!",
      profileRestored: "Profile restored to your deck.",
      couldNotRewind: "Could not rewind",
      superLike: "Super Like",
      match: "Match",
      verified: "Verified",
      boosted: "Boosted",
    },
    likes: {
      title: "Likes & Matches",
      likesYou: "Likes You",
      matches: "Matches",
      noLikesYet: "No Likes Yet",
      noLikesYetDesc: "When someone likes your profile, they will appear here. Swipe on the discovery feed to boost your visibility!",
      noMatchesYet: "No Matches Yet",
      noMatchesYetDesc: "When you both like each other, you form a match! Check your \"Likes You\" tab or discover more people.",
      findMatches: "Find Matches",
      peopleLikedYou: "people liked you",
      personLikedYou: "person liked you",
      mutualMatches: "mutual matches",
      mutualMatch: "mutual match",
      likedUser: "Liked",
      failedToLike: "Failed to like back",
      failedToPass: "Failed to pass",
    },
    chatScreen: {
      title: "Messages",
      unreadMessages: "unread messages",
      unreadMessage: "unread message",
      allCaughtUp: "You're all caught up",
      searchPlaceholder: "Search by name...",
      cancel: "Cancel",
      searchResults: "Search Results",
      recentConversations: "Recent Conversations",
      onlineNow: "Online Now",
      noConversationsFound: "No conversations found",
      trySearchingDifferent: "Try searching a different name",
      loadingChats: "Loading Chats...",
      chatSingular: "chat",
      chatPlural: "chats",
    },
    notificationsScreen: {
      title: "Notifications",
      unreadCount: "unread",
      all: "All",
      unread: "Unread",
      calls: "Calls",
      likes: "Likes",
      newSection: "NEW",
      thisWeekSection: "THIS WEEK",
      earlierSection: "EARLIER",
      noNotifications: "No notifications yet",
      chatAction: "Chat",
      viewAction: "View",
      callBackAction: "Call back",
    },
    settings: {
      title: "Settings",
      subtitle: "Manage your account preferences",
      accountSection: "Account",
      accountDesc: "Manage your profile and privacy",
      safetySection: "Safety",
      safetyDesc: "Stay safe when meeting matches in person",
      preferencesSection: "Preferences",
      preferencesDesc: "Customize your app experience",
      appearance: "Appearance",
      appearanceDesc: "Choose how Soulmate looks on your device",
      light: "Light",
      dark: "Dark",
      system: "System",
      editProfile: "Edit Profile",
      yourProfile: "Your Profile",
      version: "Version",
      accountPrivacy: "Account Privacy",
      changePassword: "Change Password",
      emailVerification: "Email & Verification",
      photoVerification: "Photo Verification",
      safetyCenter: "Safety Center",
      inviteFriends: "Invite Friends",
      notifications: "Notifications",
      payment: "Payment & Subscriptions",
      blockedUsers: "Blocked Users",
      language: "Language",
      helpSupport: "Help & Support",
      logout: "Log Out",
      deleteAccount: "Delete Account",
      logoutConfirmTitle: "Log Out",
      logoutConfirmMessage: "Are you sure you want to log out of Soulmate?",
    },
    languageScreen: {
      title: "Language",
      currentLanguage: "Current Language",
      currentLanguageSubtitle: "App is currently in",
      supportedLanguages: "Supported Languages",
      supportedSubtitle: "Select your preferred language for Soulmate",
      selectPrompt: "Choose a language",
      changedTitle: "Language Updated",
      changedMessage: "App language has been set to",
      helpTitle: "Need help with languages?",
      helpDescription: "Changing your language immediately updates the app interface and your display preferences.",
    },
  },

  ne: {
    tabs: {
      home: "गृहपृष्ठ",
      likes: "मन परेको",
      chat: "कुराकानी",
      settings: "सेटिङ्स",
    },
    common: {
      save: "सुरक्षित गर्नुहोस्",
      cancel: "रद्द गर्नुहोस्",
      done: "सम्पन्न",
      edit: "सम्पादन",
      back: "पछाडि",
      loading: "लोड हुँदैछ...",
      error: "त्रुटि",
      refresh: "ताजा गर्नुहोस्",
      search: "खोज्नुहोस्",
      ok: "ठीक छ",
    },
    homeHeader: {
      getNoticed: "ध्यान खिच्नुहोस्",
      boostActive: "बुस्ट सक्रिय — प्राथमिकता दृश्यता जारी",
      boostProfile: "⚡ मेरो प्रोफाइल बुस्ट गर्नुहोस्",
      rewindSwipe: "↩️ अघिल्लो स्वाइप फिर्ता गर्नुहोस्",
    },
    discovery: {
      allCaughtUp: "सबै प्रोफाइल हेरिसक्नुभयो! 🎉",
      allCaughtUpSub: "तपाईंको नजिकका सबै प्रोफाइल हेरिसक्नुभयो। नयाँ मानिसहरू भेट्न खोजी दायरा बढाउनुहोस् वा म्याचहरूसँग कुराकानी गर्नुहोस्!",
      widenPreferences: "खोजी प्राथमिकता बढाउनुहोस्",
      rewind: "अघिल्लो फर्काउनुहोस्",
      viewLikes: "लाइकहरू हेर्नुहोस्",
      yourMatches: "तपाईंका म्याचहरू",
      sayHello: "नयाँ साथीहरू आउन्जेल म्याचहरूसँग 'नमस्ते' भन्नुहोस्!",
      chat: "च्याट",
      exploreProfiles: "नयाँ प्रोफाइल हेर्नुहोस्",
      noOneNearby: "नजिकै कोही नयाँ छैन",
      noOneNearbyDesc: "चाँडै पुन: जाँच्नुहोस्, वा थप मानिसहरू हेर्न आफ्नो प्राथमिकता फराकिलो बनाउनुहोस्।",
      lastSwipeUndone: "अघिल्लो स्वाइप फिर्ता गरियो!",
      profileRestored: "प्रोफाइल पुनः देखाइएको छ।",
      couldNotRewind: "फर्काउन सकिएन",
      superLike: "सुपर लाइक",
      match: "म्याच",
      verified: "प्रमाणीकृत",
      boosted: "बुस्ट गरिएको",
    },
    likes: {
      title: "लाइक र म्याचहरू",
      likesYou: "तपाईंलाई मन पराउने",
      matches: "म्याचहरू",
      noLikesYet: "अहिलेसम्म लाइक छैन",
      noLikesYetDesc: "कसैले तपाईंको प्रोफाइल मन पराउँदा, तिनीहरू यहाँ देखा पर्नेछन्। आफ्नो दृश्यता बढाउन स्वाइप जारी राख्नुहोस्!",
      noMatchesYet: "अहिलेसम्म म्याच छैन",
      noMatchesYetDesc: "जब तपाईं दुवैले एकअर्कालाई मन पराउनुहुन्छ, म्याच बन्नेछ! मन परेको ट्याब हेर्नुहोस् वा थप मानिसहरू खोज्नुहोस्।",
      findMatches: "म्याच खोज्नुहोस्",
      peopleLikedYou: "जनाले तपाईंलाई मन पराए",
      personLikedYou: "जनाले तपाईंलाई मन पराए",
      mutualMatches: "वटा म्याचहरू",
      mutualMatch: "वटा म्याच",
      likedUser: "मन पर्यो",
      failedToLike: "लाइक गर्न सकिएन",
      failedToPass: "अस्वीकार गर्न सकिएन",
    },
    chatScreen: {
      title: "सन्देशहरू",
      unreadMessages: "नपढेका सन्देशहरू",
      unreadMessage: "नपढेको सन्देश",
      allCaughtUp: "सबै सन्देश हेरिसक्नुभयो",
      searchPlaceholder: "नामबाट खोज्नुहोस्...",
      cancel: "रद्द गर्नुहोस्",
      searchResults: "खोज परिणाम",
      recentConversations: "भर्खरका कुराकानी",
      onlineNow: "अहिले अनलाइन",
      noConversationsFound: "कुनै कुराकानी भेटिएन",
      trySearchingDifferent: "फरक नाम खोजेर प्रयास गर्नुहोस्",
      loadingChats: "च्याट लोड हुँदैछ...",
      chatSingular: "च्याट",
      chatPlural: "च्याटहरू",
    },
    notificationsScreen: {
      title: "सूचनाहरू",
      unreadCount: "नपढेका",
      all: "सबै",
      unread: "नपढेका",
      calls: "कलहरू",
      likes: "लाइकहरू",
      newSection: "नयाँ",
      thisWeekSection: "यो हप्ता",
      earlierSection: "पहिलेका",
      noNotifications: "अहिलेसम्म कुनै सूचना छैन",
      chatAction: "च्याट",
      viewAction: "हेर्नुहोस्",
      callBackAction: "फिर्ता कल",
    },
    settings: {
      title: "सेटिङ्स",
      subtitle: "तपाईंको खाता प्राथमिकताहरू व्यवस्थापन गर्नुहोस्",
      accountSection: "खाता",
      accountDesc: "आफ्नो प्रोफाइल र गोपनीयता व्यवस्थापन गर्नुहोस्",
      safetySection: "सुरक्षा",
      safetyDesc: "भेट्दा सुरक्षित रहनुहोस्",
      preferencesSection: "प्राथमिकताहरू",
      preferencesDesc: "एपको अनुभव अनुकूलित गर्नुहोस्",
      appearance: "रूपरंग",
      appearanceDesc: "सोलमेटको रङ छान्नुहोस्",
      light: "उज्यालो",
      dark: "अँध्यारो",
      system: "प्रणाली",
      editProfile: "प्रोफाइल सम्पादन",
      yourProfile: "तपाईंको प्रोफाइल",
      version: "संस्करण",
      accountPrivacy: "खाता गोपनीयता",
      changePassword: "पासवर्ड परिवर्तन",
      emailVerification: "इमेल र प्रमाणीकरण",
      photoVerification: "फोटो प्रमाणीकरण",
      safetyCenter: "सुरक्षा केन्द्र",
      inviteFriends: "साथीहरूलाई आमन्त्रण",
      notifications: "सूचनाहरू",
      payment: "भुक्तानी र सदस्यता",
      blockedUsers: "अवरुद्ध प्रयोगकर्ताहरू",
      language: "भाषा",
      helpSupport: "मद्दत र समर्थन",
      logout: "लग आउट",
      deleteAccount: "खाता मेटाउनुहोस्",
      logoutConfirmTitle: "लग आउट",
      logoutConfirmMessage: "के तपाईं निश्चित रूपमा सोलमेटबाट लग आउट गर्न चाहनुहुन्छ?",
    },
    languageScreen: {
      title: "भाषा",
      currentLanguage: "हालको भाषा",
      currentLanguageSubtitle: "एप हाल यस भाषामा छ:",
      supportedLanguages: "समर्थित भाषाहरू",
      supportedSubtitle: "सोलमेटको लागि आफ्नो मनपर्ने भाषा छान्नुहोस्",
      selectPrompt: "भाषा छान्नुहोस्",
      changedTitle: "भाषा परिवर्तन भयो",
      changedMessage: "एपको भाषा सफलतापूर्वक सेट गरियो:",
      helpTitle: "भाषा सम्बधी मद्दत चाहिन्छ?",
      helpDescription: "भाषा परिवर्तन गर्दा एपको सम्पूर्ण इन्टरफेस तत्काल नयाँ भाषामा रूपान्तरण हुन्छ।",
    },
  },

  hi: {
    tabs: {
      home: "होम",
      likes: "पसंद",
      chat: "बातचीत",
      settings: "सेटिंग्स",
    },
    common: {
      save: "सहेजें",
      cancel: "रद्द करें",
      done: "हो गया",
      edit: "संपादित करें",
      back: "वापस",
      loading: "लोड हो रहा है...",
      error: "त्रुटि",
      refresh: "ताज़ा करें",
      search: "खोजें",
      ok: "ठीक है",
    },
    homeHeader: {
      getNoticed: "ध्यान आकर्षित करें",
      boostActive: "बूस्ट सक्रिय — प्राथमिकता दृश्यता जारी",
      boostProfile: "⚡ मेरी प्रोफ़ाइल बूस्ट करें",
      rewindSwipe: "↩️ पिछला स्वाइप वापस लाएं",
    },
    discovery: {
      allCaughtUp: "सब कुछ देख लिया! 🎉",
      allCaughtUpSub: "आपने आस-पास के सभी प्रोफाइल देख लिए हैं। नए लोगों से मिलने के लिए खोज सीमा बढ़ाएं या अपने मैचों से बात करें!",
      widenPreferences: "खोज प्राथमिकताएं बढ़ाएं",
      rewind: "पिछला वापस लाएं",
      viewLikes: "लाइक्स देखें",
      yourMatches: "आपके मैच",
      sayHello: "नए लोगों के आने तक अपने मैचों को 'नमस्ते' कहें!",
      chat: "चैट",
      exploreProfiles: "प्रोफाइल खोजें",
      noOneNearby: "आस-पास कोई नया नहीं है",
      noOneNearbyDesc: "जल्द ही दोबारा जांचें, या अधिक लोगों को देखने के लिए अपनी प्राथमिकताएं बढ़ाएं।",
      lastSwipeUndone: "पिछला स्वाइप वापस लाया गया!",
      profileRestored: "प्रोफाइल दोबारा डेक में जोड़ दी गई है।",
      couldNotRewind: "वापस नहीं ला सके",
      superLike: "सुपर लाइक",
      match: "मैच",
      verified: "सत्यापित",
      boosted: "बूस्टेड",
    },
    likes: {
      title: "लाइक्स और मैच",
      likesYou: "जिन्होंने आपको पसंद किया",
      matches: "मैच",
      noLikesYet: "अभी तक कोई लाइक नहीं",
      noLikesYetDesc: "जब कोई आपकी प्रोफाइल पसंद करेगा, तो वे यहां दिखाई देंगे। अधिक दृश्यता के लिए स्वाइप करते रहें!",
      noMatchesYet: "अभी तक कोई मैच नहीं",
      noMatchesYetDesc: "जब आप दोनों एक-दूसरे को पसंद करते हैं, तो एक मैच बनता है! 'पसंद' टैब देखें या नए लोग खोजें।",
      findMatches: "मैच खोजें",
      peopleLikedYou: "लोगों ने आपको पसंद किया",
      personLikedYou: "व्यक्ति ने आपको पसंद किया",
      mutualMatches: "मैच",
      mutualMatch: "मैच",
      likedUser: "पसंद किया",
      failedToLike: "लाइक करने में असमर्थ",
      failedToPass: "खारिज करने में असमर्थ",
    },
    chatScreen: {
      title: "संदेश",
      unreadMessages: "अपठित संदेश",
      unreadMessage: "अपठित संदेश",
      allCaughtUp: "सब कुछ देख लिया",
      searchPlaceholder: "नाम से खोजें...",
      cancel: "रद्द करें",
      searchResults: "खोज परिणाम",
      recentConversations: "हाल की बातचीत",
      onlineNow: "अभी ऑनलाइन",
      noConversationsFound: "कोई बातचीत नहीं मिली",
      trySearchingDifferent: "कोई अन्य नाम खोजें",
      loadingChats: "चैट लोड हो रहे हैं...",
      chatSingular: "चैट",
      chatPlural: "चैट",
    },
    notificationsScreen: {
      title: "सूचनाएं",
      unreadCount: "अपठित",
      all: "सभी",
      unread: "अपठित",
      calls: "कॉल्स",
      likes: "पसंद",
      newSection: "नया",
      thisWeekSection: "इस सप्ताह",
      earlierSection: "पहले के",
      noNotifications: "अभी तक कोई सूचना नहीं",
      chatAction: "चैट",
      viewAction: "देखें",
      callBackAction: "वापस कॉल",
    },
    settings: {
      title: "सेटिंग्स",
      subtitle: "अपने खाते की प्राथमिकताएं प्रबंधित करें",
      accountSection: "खाता",
      accountDesc: "अपनी प्रोफ़ाइल और गोपनीयता प्रबंधित करें",
      safetySection: "सुरक्षा",
      safetyDesc: "मिलते समय सुरक्षित रहें",
      preferencesSection: "प्राथमिकताएं",
      preferencesDesc: "अपने ऐप अनुभव को अनुकूलित करें",
      appearance: "रूप-रंग",
      appearanceDesc: "सोलमेट का रंग चुनें",
      light: "लाइट",
      dark: "डार्क",
      system: "सिस्टम",
      editProfile: "प्रोफ़ाइल संपादित करें",
      yourProfile: "आपकी प्रोफ़ाइल",
      version: "संस्करण",
      accountPrivacy: "खाता गोपनीयता",
      changePassword: "पासवर्ड बदलें",
      emailVerification: "ईमेल और सत्यापन",
      photoVerification: "फोटो सत्यापन",
      safetyCenter: "सुरक्षा केंद्र",
      inviteFriends: "मित्रों को आमंत्रित करें",
      notifications: "सूचनाएं",
      payment: "भुगतान और सदस्यता",
      blockedUsers: "अवरुद्ध उपयोगकर्ता",
      language: "भाषा",
      helpSupport: "सहायता और समर्थन",
      logout: "लॉग आउट",
      deleteAccount: "खाता हटाएं",
      logoutConfirmTitle: "लॉग आउट",
      logoutConfirmMessage: "क्या आप वाकई सोलमेट से लॉग आउट करना चाहते हैं?",
    },
    languageScreen: {
      title: "भाषा",
      currentLanguage: "वर्तमान भाषा",
      currentLanguageSubtitle: "ऐप वर्तमान में इस भाषा में है:",
      supportedLanguages: "समर्थित भाषाएँ",
      supportedSubtitle: "सोलमेट के लिए अपनी पसंदीदा भाषा चुनें",
      selectPrompt: "भाषा चुनें",
      changedTitle: "भाषा अपडेट हो गई",
      changedMessage: "ऐप की भाषा सफलतापूर्वक सेट कर दी गई है:",
      helpTitle: "भाषा से संबंधित सहायता चाहिए?",
      helpDescription: "अपनी भाषा बदलने पर ऐप इंटरफेस तुरंत चयनित भाषा में अपडेट हो जाता है।",
    },
  },
};
