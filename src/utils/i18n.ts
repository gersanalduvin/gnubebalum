import { i18n } from '@configs/i18n'
import type { Locale } from '@configs/i18n'

export function getLocalizedUrl(url: string, locale: Locale): string {
  // Si la URL ya tiene un locale, reemplazarlo
  const segments = url.split('/')
  
  if (segments[1] && i18n.locales.includes(segments[1] as Locale)) {
    segments[1] = locale

    return segments.join('/')
  }
  
  // Si no tiene locale, agregarlo

  return `/${locale}${url}`
}

export function removeLocaleFromUrl(url: string): string {
  const segments = url.split('/')
  
  if (segments[1] && i18n.locales.includes(segments[1] as Locale)) {
    segments.splice(1, 1)

    return segments.join('/') || '/'
  }
  

  return url
}

export function getLocaleFromUrl(url: string): Locale {
  const segments = url.split('/')
  const potentialLocale = segments[1]
  
  if (potentialLocale && i18n.locales.includes(potentialLocale as Locale)) {
    return potentialLocale as Locale
  }
  
  return i18n.defaultLocale
}