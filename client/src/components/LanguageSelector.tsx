import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../stores/appStore';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const { currentLanguage, setLanguage } = useAppStore();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];

  const handleLanguageChange = (languageCode: string) => {
    setLanguage(languageCode);
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="language-selector">
      <select
        value={currentLanguage}
        onChange={(e) => handleLanguageChange(e.target.value)}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};
