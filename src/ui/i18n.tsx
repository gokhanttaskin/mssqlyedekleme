import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'tr' | 'en';

type I18nContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const resources: Record<string, { tr: string; en: string }> = {
  'app.title': { tr: 'ITCONF SQL Yedekleme', en: 'ITCONF SQL Backup' },
  'app.subtitle': { tr: 'Bağlan, veritabanlarını yönet ve güvenle .bak yedekleri al.', en: 'Connect, manage databases and safely take .bak backups.' },
  'steps.connection': { tr: 'Bağlantı', en: 'Connection' },
  'steps.databases': { tr: 'Veritabanları', en: 'Databases' },
  'steps.target': { tr: 'Hedef Klasör', en: 'Target Folder' },
  'steps.backup': { tr: 'Yedekleme', en: 'Backup' },
  'labels.server': { tr: 'Sunucu (IP veya HOST\\INSTANCE)', en: 'Server (IP or HOST\\INSTANCE)' },
  'labels.username': { tr: 'Kullanıcı Adı', en: 'Username' },
  'labels.password': { tr: 'Şifre', en: 'Password' },
  'labels.folderPath': { tr: 'Klasör Yolu', en: 'Folder Path' },
  'buttons.testConnection': { tr: 'Bağlantıyı Test Et', en: 'Test Connection' },
  'buttons.testing': { tr: 'Test Ediliyor...', en: 'Testing...' },
  'chips.connected': { tr: 'Bağlantı Başarılı', en: 'Connected' },
  'labels.sqlServer': { tr: 'SQL Server', en: 'SQL Server' },
  'errors.dbListFail': { tr: 'Veritabanı listesi alınamadı', en: 'Failed to fetch database list' },
  'errors.connectionFail': { tr: 'Bağlantı başarısız', en: 'Connection failed' },
  'sections.databases': { tr: 'Veritabanları', en: 'Databases' },
  'chips.total': { tr: 'toplam', en: 'total' },
  'search.label': { tr: 'Ara', en: 'Search' },
  'search.placeholder': { tr: 'Veritabanı adı', en: 'Database name' },
  'table.name': { tr: 'Ad', en: 'Name' },
  'info.needConnection': { tr: 'Bağlantı kurmadan liste alınamaz.', en: 'Cannot list without connection.' },
  'sections.targetFolder': { tr: 'Hedef Klasör', en: 'Target Folder' },
  'tooltip.backupInfo': { tr: 'SQL Server, yedek dosyayı sunucuda oluşturur. Sunucunun erişebildiği bir yol seçin.', en: 'SQL Server creates backup file on the server. Choose a path accessible to the server.' },
  'buttons.pickFolder': { tr: 'Klasör Seç', en: 'Pick Folder' },
  'caption.examples': { tr: 'Örn. Sunucu diski: C:\\\\SQLBackups veya paylaşım: \\\\SUNUCU\\\\Paylasim\\\\Yedekler', en: 'Ex. Server disk: C:\\\\SQLBackups or share: \\\\SERVER\\\\Share\\\\Backups' },
  'sections.backup': { tr: 'Yedekleme', en: 'Backup' },
  'chips.selected': { tr: 'Seçili', en: 'Selected' },
  'buttons.backupSelected': { tr: 'Seçili Veritabanlarını Yedekle', en: 'Backup Selected Databases' },
  'buttons.backingUp': { tr: 'Yedekleniyor...', en: 'Backing up...' },
  'errors.backupFailed': { tr: 'Yedekleme sırasında hata oluştu', en: 'Error occurred during backup' },
  'sections.results': { tr: 'Sonuçlar', en: 'Results' },
  'ok': { tr: 'OK', en: 'OK' },
  'error': { tr: 'HATA', en: 'ERROR' },
  'lang.turkish': { tr: 'Türkçe', en: 'Türkçe' },
  'lang.english': { tr: 'English', en: 'English' },
};

const I18nContext = createContext<I18nContextType>({ lang: 'tr', setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('lang');
    return (saved === 'en' || saved === 'tr') ? (saved as Lang) : 'tr';
  });

  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);

  const t = useMemo(() => {
    return (key: string) => {
      const entry = resources[key];
      if (!entry) return key;
      return entry[lang] ?? key;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}