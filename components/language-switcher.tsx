"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  const languages = [
    { code: 'en', name: 'English', flag: '/united-kingdom.png', alt: 'English' },
    { code: 'km', name: 'ខ្មែរ', flag: '/flag.png', alt: 'ភាសាខ្មែរ' }
  ] as const

  const handleLanguageChange = (langCode: 'en' | 'km') => {
    setLanguage(langCode)
  }


  return (
    <div className="flex items-center space-x-1">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant="ghost"
          size="sm"
          onClick={() => handleLanguageChange(lang.code as 'en' | 'km')}
          className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
            language === lang.code ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
          }`}
          title={lang.name}
        >
          <img
            src={lang.flag}
            alt={lang.alt}
            className="w-6 h-4 rounded-sm border border-gray-200 dark:border-gray-600"
          />
        </Button>
      ))}
    </div>
  )
}
