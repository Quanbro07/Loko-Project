import React, { createContext, useContext, useState, useEffect } from 'react';
import vietnameseTranslations from './Vietnamese.json';
import englishTranslations from './English.json';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('vi'); // Default to Vietnamese
    const [translations, setTranslations] = useState(vietnameseTranslations);

    useEffect(() => {
        if (language === 'vi') {
            setTranslations(vietnameseTranslations);
        } else if (language === 'en') {
            setTranslations(englishTranslations);
        }
    }, [language]);

    const translate = (key) => {
        return translations[key] || key; // Fallback to key if translation not found
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, translate }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    return useContext(LanguageContext);
};

