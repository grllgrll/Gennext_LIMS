// Internationalization utilities for Gennext LIMS
// This is a basic implementation that can be extended with libraries like react-i18next

type TranslationKey = 
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.edit'
  | 'common.create'
  | 'common.required'
  | 'navigation.dashboard'
  | 'navigation.intake'
  | 'navigation.qc'
  | 'navigation.plate'
  | 'navigation.runs'
  | 'navigation.prs'
  | 'navigation.settings'
  | 'qc.pass'
  | 'qc.warn' 
  | 'qc.fail'
  | 'qc.pending'
  | 'validation.required'
  | 'validation.invalid'
  | 'validation.min_length'
  | 'validation.max_length'
  | 'validation.invalid_format'

type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'zh'

interface Translations {
  [key: string]: {
    [locale in SupportedLocale]?: string
  }
}

const translations: Translations = {
  'common.loading': {
    en: 'Loading...',
    es: 'Cargando...',
    fr: 'Chargement...',
    de: 'Laden...',
    zh: '加载中...'
  },
  'common.error': {
    en: 'Error',
    es: 'Error',
    fr: 'Erreur',
    de: 'Fehler',
    zh: '错误'
  },
  'common.success': {
    en: 'Success',
    es: 'Éxito',
    fr: 'Succès',
    de: 'Erfolgreich',
    zh: '成功'
  },
  'common.save': {
    en: 'Save',
    es: 'Guardar',
    fr: 'Enregistrer',
    de: 'Speichern',
    zh: '保存'
  },
  'common.cancel': {
    en: 'Cancel',
    es: 'Cancelar',
    fr: 'Annuler',
    de: 'Abbrechen',
    zh: '取消'
  },
  'common.delete': {
    en: 'Delete',
    es: 'Eliminar',
    fr: 'Supprimer',
    de: 'Löschen',
    zh: '删除'
  },
  'common.edit': {
    en: 'Edit',
    es: 'Editar',
    fr: 'Modifier',
    de: 'Bearbeiten',
    zh: '编辑'
  },
  'common.create': {
    en: 'Create',
    es: 'Crear',
    fr: 'Créer',
    de: 'Erstellen',
    zh: '创建'
  },
  'common.required': {
    en: 'Required',
    es: 'Requerido',
    fr: 'Requis',
    de: 'Erforderlich',
    zh: '必填'
  },
  'navigation.dashboard': {
    en: 'Dashboard',
    es: 'Panel de Control',
    fr: 'Tableau de Bord',
    de: 'Dashboard',
    zh: '仪表板'
  },
  'navigation.intake': {
    en: 'Sample Intake',
    es: 'Ingreso de Muestras',
    fr: 'Réception d\'Échantillons',
    de: 'Probeneingang',
    zh: '样品接收'
  },
  'navigation.qc': {
    en: 'DNA QC',
    es: 'Control de Calidad DNA',
    fr: 'Contrôle Qualité ADN',
    de: 'DNA-Qualitätskontrolle',
    zh: 'DNA质控'
  },
  'navigation.plate': {
    en: 'Plate Builder',
    es: 'Constructor de Placas',
    fr: 'Constructeur de Plaques',
    de: 'Platten-Builder',
    zh: '板构建器'
  },
  'navigation.runs': {
    en: 'Genotyping Runs',
    es: 'Corridas de Genotipado',
    fr: 'Analyses de Génotypage',
    de: 'Genotyping-Läufe',
    zh: '基因型分析'
  },
  'navigation.prs': {
    en: 'PRS Analysis',
    es: 'Análisis PRS',
    fr: 'Analyse PRS',
    de: 'PRS-Analyse',
    zh: 'PRS分析'
  },
  'navigation.settings': {
    en: 'Settings',
    es: 'Configuración',
    fr: 'Paramètres',
    de: 'Einstellungen',
    zh: '设置'
  },
  'qc.pass': {
    en: 'Pass',
    es: 'Aprobado',
    fr: 'Réussi',
    de: 'Bestanden',
    zh: '通过'
  },
  'qc.warn': {
    en: 'Warning',
    es: 'Advertencia',
    fr: 'Avertissement',
    de: 'Warnung',
    zh: '警告'
  },
  'qc.fail': {
    en: 'Fail',
    es: 'Fallido',
    fr: 'Échec',
    de: 'Fehlgeschlagen',
    zh: '失败'
  },
  'qc.pending': {
    en: 'Pending',
    es: 'Pendiente',
    fr: 'En Attente',
    de: 'Ausstehend',
    zh: '待定'
  },
  'validation.required': {
    en: 'This field is required',
    es: 'Este campo es obligatorio',
    fr: 'Ce champ est requis',
    de: 'Dieses Feld ist erforderlich',
    zh: '此字段为必填项'
  },
  'validation.invalid': {
    en: 'Invalid value',
    es: 'Valor inválido',
    fr: 'Valeur invalide',
    de: 'Ungültiger Wert',
    zh: '无效值'
  },
  'validation.min_length': {
    en: 'Minimum length not met',
    es: 'Longitud mínima no alcanzada',
    fr: 'Longueur minimale non atteinte',
    de: 'Mindestlänge nicht erreicht',
    zh: '未达到最小长度'
  },
  'validation.max_length': {
    en: 'Maximum length exceeded',
    es: 'Longitud máxima excedida',
    fr: 'Longueur maximale dépassée',
    de: 'Maximale Länge überschritten',
    zh: '超过最大长度'
  },
  'validation.invalid_format': {
    en: 'Invalid format',
    es: 'Formato inválido',
    fr: 'Format invalide',
    de: 'Ungültiges Format',
    zh: '格式无效'
  }
}

// Get user's preferred language from browser or localStorage
export function getPreferredLocale(): SupportedLocale {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('gennext_locale') as SupportedLocale
    if (stored && isValidLocale(stored)) {
      return stored
    }
    
    // Fall back to browser language
    const browserLang = navigator.language.split('-')[0]
    if (isValidLocale(browserLang)) {
      return browserLang as SupportedLocale
    }
  }
  
  return 'en' // Default fallback
}

// Set user's preferred language
export function setPreferredLocale(locale: SupportedLocale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gennext_locale', locale)
  }
}

// Check if locale is supported
function isValidLocale(locale: string): boolean {
  return ['en', 'es', 'fr', 'de', 'zh'].includes(locale)
}

// Main translation function
export function t(key: TranslationKey, locale?: SupportedLocale): string {
  const targetLocale = locale || getPreferredLocale()
  
  const translation = translations[key]
  if (!translation) {
    console.warn(`Translation key "${key}" not found`)
    return key
  }
  
  const localizedText = translation[targetLocale] || translation.en
  if (!localizedText) {
    console.warn(`Translation for key "${key}" not found in locale "${targetLocale}"`)
    return key
  }
  
  return localizedText
}

// Hook for React components
import { useState, useEffect } from 'react'

export function useTranslation() {
  const [locale, setLocale] = useState<SupportedLocale>(getPreferredLocale())
  
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gennext_locale' && e.newValue && isValidLocale(e.newValue)) {
        setLocale(e.newValue as SupportedLocale)
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }
  }, [])
  
  const changeLocale = (newLocale: SupportedLocale) => {
    setLocale(newLocale)
    setPreferredLocale(newLocale)
  }
  
  const translate = (key: TranslationKey) => t(key, locale)
  
  return {
    locale,
    changeLocale,
    t: translate,
    supportedLocales: ['en', 'es', 'fr', 'de', 'zh'] as const
  }
}

// Utility function for formatting numbers based on locale
export function formatNumber(
  number: number, 
  locale: SupportedLocale = getPreferredLocale(),
  options?: Intl.NumberFormatOptions
): string {
  const localeMap = {
    en: 'en-US',
    es: 'es-ES', 
    fr: 'fr-FR',
    de: 'de-DE',
    zh: 'zh-CN'
  }
  
  return new Intl.NumberFormat(localeMap[locale], options).format(number)
}

// Utility function for formatting dates based on locale
export function formatDate(
  date: Date | string, 
  locale: SupportedLocale = getPreferredLocale(),
  options?: Intl.DateTimeFormatOptions
): string {
  const localeMap = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR', 
    de: 'de-DE',
    zh: 'zh-CN'
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(localeMap[locale], options).format(dateObj)
}

// Export types for use in other files
export type { TranslationKey, SupportedLocale }