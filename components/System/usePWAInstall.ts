/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

const checkIsAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const navData = (window.navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData;
  const platform = navData?.platform?.toLowerCase() || '';
  return /android/.test(ua) || platform === 'android';
};

const checkIsIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
  );
};

const checkIsMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (checkIsAndroid() || checkIsIOS()) return true;
  const ua = window.navigator.userAgent.toLowerCase();
  return (
    /mobile|phone|silk|blackberry|opera mini/.test(ua) ||
    window.matchMedia('(max-width: 768px)').matches ||
    (window.matchMedia('(pointer: coarse)').matches && window.navigator.maxTouchPoints > 0)
  );
};

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredPrompt) {
      return window.__deferredPrompt;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });

  const [isIOS] = useState<boolean>(checkIsIOS);
  const [isAndroid] = useState<boolean>(checkIsAndroid);
  const [isMobile] = useState<boolean>(checkIsMobile);

  useEffect(() => {
    const updateStatus = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);

      // Pick up deferred prompt if captured earlier in global window object
      if (window.__deferredPrompt) {
        setDeferredPrompt(window.__deferredPrompt);
      }
    };

    updateStatus();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      console.log('[PWA] beforeinstallprompt event captured and ready');
    };

    const handlePromptReady = () => {
      if (window.__deferredPrompt) {
        setDeferredPrompt(window.__deferredPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        window.__deferredPrompt = null;
      }
      console.log('[PWA] App successfully installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, []);

  /**
   * Directly triggers the native Chrome install prompt dialog.
   * If deferredPrompt is not yet set, waits briefly for beforeinstallprompt.
   */
  const install = async (): Promise<boolean> => {
    let promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPrompt : null);
    
    // If not immediately available on Android / Chrome, wait up to 1200ms
    if (!promptEvent && typeof window !== 'undefined') {
      promptEvent = await new Promise<BeforeInstallPromptEvent | null>((resolve) => {
        let timer: ReturnType<typeof setTimeout>;
        const onReady = () => {
          cleanup();
          resolve(window.__deferredPrompt || null);
        };
        const cleanup = () => {
          clearTimeout(timer);
          window.removeEventListener('pwa-prompt-ready', onReady);
          window.removeEventListener('beforeinstallprompt', onReady);
        };
        window.addEventListener('pwa-prompt-ready', onReady, { once: true });
        window.addEventListener('beforeinstallprompt', onReady, { once: true });
        timer = setTimeout(() => {
          cleanup();
          resolve(window.__deferredPrompt || null);
        }, 1200);
      });
    }

    if (!promptEvent) {
      console.warn('[PWA] No deferred install prompt available yet');
      return false;
    }

    try {
      console.log('[PWA] Calling deferredPrompt.prompt() directly...');
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      console.log('[PWA] User choice outcome:', choice?.outcome);

      // Consume prompt
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        window.__deferredPrompt = null;
      }

      if (choice?.outcome === 'accepted') {
        setIsInstalled(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[PWA] Error executing prompt():', err);
      return false;
    }
  };

  const isInstallable = !!(deferredPrompt || (typeof window !== 'undefined' && window.__deferredPrompt));

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isMobile,
    install,
    deferredPrompt
  };
}
