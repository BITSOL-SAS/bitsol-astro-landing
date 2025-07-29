export function getLanguage(pathname: string): 'es' | 'en' {
  const isEnglish = pathname.startsWith('/en/') || pathname === '/en';
  return isEnglish ? 'en' : 'es';
}

export function getCurrentPathWithoutLang(pathname: string): string {
  return pathname.replace(/^\/(en|es)/, '') || '/';
}

export function getOppositeLanguage(pathname: string): 'es' | 'en' {
  const currentLang = getLanguage(pathname);
  return currentLang === 'en' ? 'es' : 'en';
}

export function getLocalizedPath(path: string, lang: 'es' | 'en'): string {
  if (lang === 'en') {
    return path.startsWith('/es/') ? path.replace('/es/', '/en/') : `/en${path}`;
  } else {
    return path.startsWith('/en/') ? path.replace('/en/', '/es/') : `/es${path}`;
  }
} 