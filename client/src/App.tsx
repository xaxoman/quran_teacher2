import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RecitationInterface } from './components/RecitationInterface';
import { LanguageSelector } from './components/LanguageSelector';
import { useAppStore } from './stores/appStore';
import './i18n';
import './App.css';

function App() {
  const { t } = useTranslation();
  const { currentLanguage } = useAppStore();

  useEffect(() => {
    // Set initial language
    if (currentLanguage) {
      document.documentElement.lang = currentLanguage;
      document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    }
  }, [currentLanguage]);

  return (
    <div className={`app-container ${
      currentLanguage === 'ar' ? 'font-arabic' : ''
    }`}>
      <header className="app-header">
        <div className="container">
          <h1 className="app-title">
            <span className="icon">🕌</span>
            {t('appTitle')}
          </h1>
          <LanguageSelector />
        </div>
      </header>

      <main className="main-content">
        <RecitationInterface />
      </main>

      <footer style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', marginTop: '3rem', padding: '1.5rem 0', textAlign: 'center', color: '#6b7280' }}>
        <p>{t('appTitle')} - Your AI companion for Quran memorization</p>
      </footer>
    </div>
  );
}

export default App;
