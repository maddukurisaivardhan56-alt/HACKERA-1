import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppCMSConfig, CMSThemeConfig } from '../types';
import { DEFAULT_THEME_CONFIG } from '../data/defaultCMSData';
import { CMSService } from '../services/cmsService';

interface CMSContextType {
  config: AppCMSConfig;
  isLoading: boolean;
  error: string | null;
  refreshCMSConfig: () => Promise<void>;
  updateSection: <K extends keyof AppCMSConfig>(section: K, data: AppCMSConfig[K]) => Promise<boolean>;
  saveAllConfig: (newConfig: AppCMSConfig, sectionLabel?: string) => Promise<boolean>;
  resetThemeToDefault: () => void;
  previewTheme: CMSThemeConfig | null;
  setPreviewTheme: (theme: CMSThemeConfig | null) => void;
  applyThemePreview: (themePartial: Partial<CMSThemeConfig>) => void;
  cancelThemePreview: () => void;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export const CMSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppCMSConfig>(() => CMSService.getInstantConfig());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<CMSThemeConfig | null>(null);

  // Apply CSS variables whenever config.theme or previewTheme changes
  useEffect(() => {
    const activeTheme = previewTheme || config.theme;
    CMSService.applyThemeVariables(activeTheme);
  }, [config.theme, previewTheme]);

  // Initial fetch from backend
  const refreshCMSConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await CMSService.getCMSConfig();
      setConfig(fetched);
    } catch (err: any) {
      console.warn('Failed to load remote CMS config, using cached version:', err);
      setError('Using cached CMS configuration.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCMSConfig();

    const handleConfigUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<AppCMSConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      }
    };

    window.addEventListener('fg_cms_config_updated', handleConfigUpdated);
    return () => {
      window.removeEventListener('fg_cms_config_updated', handleConfigUpdated);
    };
  }, [refreshCMSConfig]);

  const updateSection = async <K extends keyof AppCMSConfig>(
    section: K,
    data: AppCMSConfig[K]
  ): Promise<boolean> => {
    const newConfig: AppCMSConfig = {
      ...config,
      [section]: data,
      updatedAt: new Date().toISOString(),
    };

    const res = await CMSService.saveCMSConfig(newConfig, `Updated ${String(section)}`);
    if (res.success && res.config) {
      setConfig(res.config);
      if (section === 'theme') {
        setPreviewTheme(null);
      }
      return true;
    }
    return false;
  };

  const saveAllConfig = async (newConfig: AppCMSConfig, sectionLabel?: string): Promise<boolean> => {
    const updated: AppCMSConfig = {
      ...newConfig,
      updatedAt: new Date().toISOString(),
    };

    const res = await CMSService.saveCMSConfig(updated, sectionLabel);
    if (res.success && res.config) {
      setConfig(res.config);
      setPreviewTheme(null);
      return true;
    }
    return false;
  };

  const resetThemeToDefault = () => {
    setPreviewTheme({ ...DEFAULT_THEME_CONFIG });
  };

  const applyThemePreview = (themePartial: Partial<CMSThemeConfig>) => {
    const currentBase = previewTheme || config.theme;
    const merged: CMSThemeConfig = { ...currentBase, ...themePartial };
    setPreviewTheme(merged);
  };

  const cancelThemePreview = () => {
    setPreviewTheme(null);
    CMSService.applyThemeVariables(config.theme);
  };

  return (
    <CMSContext.Provider
      value={{
        config,
        isLoading,
        error,
        refreshCMSConfig,
        updateSection,
        saveAllConfig,
        resetThemeToDefault,
        previewTheme,
        setPreviewTheme,
        applyThemePreview,
        cancelThemePreview,
      }}
    >
      {children}
    </CMSContext.Provider>
  );
};

export const useCMS = (): CMSContextType => {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
};
