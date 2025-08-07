import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files - simplified for now
const enTranslation = {
  appTitle: "AI Quran Recitation Assistant",
  startNewSession: "Start New Session",
  selectSurah: "Select Surah",
  startRecitation: "Start Recitation",
  listening: "Listening...",
  processing: "Processing...",
  speakNow: "Speak now or type your recitation",
  requestFeedback: "Request Feedback",
  microphone: "Microphone",
  microphoneOn: "Microphone On",
  microphoneOff: "Microphone Off",
  greeting: "Assalamu alaikum! I'm your AI Quran teacher. Which Surah would you like to practice today?"
};

const arTranslation = {
  appTitle: "مساعد تلاوة القرآن الذكي",
  startNewSession: "بدء جلسة جديدة",
  selectSurah: "اختر السورة",
  startRecitation: "بدء التلاوة",
  listening: "أستمع...",
  processing: "جاري المعالجة...",
  speakNow: "اتل الآن أو اكتب تلاوتك",
  requestFeedback: "طلب التقييم",
  microphone: "الميكروفون",
  microphoneOn: "الميكروفون مفعل",
  microphoneOff: "الميكروفون مغلق",
  greeting: "السلام عليكم! أنا معلم القرآن الذكي. أي سورة تريد أن تمارسها اليوم؟"
};

const resources = {
  en: {
    translation: enTranslation,
  },
  ar: {
    translation: arTranslation,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
