import React, { useEffect, useState } from 'react';

// Simple Add-to-Home-Screen prompt component that hides itself after install
export default function AddToHomeScreen() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  // Determine if app is already installed
  const isAppInstalled = () => {
    // iOS
    if (window.navigator && window.navigator.standalone) return true;
    // Display-mode
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    // Local flag from appinstalled event
    try {
      const flag = localStorage.getItem('campus_bus_installed');
      if (flag === '1') return true;
    } catch (e) {
      // ignore
    }
    return false;
  };

  useEffect(() => {
    if (isAppInstalled()) return; // don't listen if already installed

    // Detect iOS Safari (no beforeinstallprompt support)
    const ua = window.navigator.userAgent || '';
    const iOS = /iphone|ipad|ipod/i.test(ua) && !window.MSStream;
    setIsIos(iOS);

    const beforeInstallHandler = (e) => {
      console.log('[AddToHomeScreen] beforeinstallprompt event received');
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    const appInstalledHandler = () => {
      console.log('[AddToHomeScreen] appinstalled event received');
      try {
        localStorage.setItem('campus_bus_installed', '1');
      } catch (err) {
        // ignore storage errors
      }
      setVisible(false);
      setDeferredPrompt(null);
    };

    // Listen for custom event so other parts of the app can open this UI
    const openHandler = () => {
      setVisible(true);
    };

  window.addEventListener('beforeinstallprompt', beforeInstallHandler);
  window.addEventListener('appinstalled', appInstalledHandler);
  window.addEventListener('openAddToHome', openHandler);

    // In case the app was installed by other means while on the page
    const installedNow = isAppInstalled();
    console.log('[AddToHomeScreen] isAppInstalled() ->', installedNow);
    if (installedNow) {
      setVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
      window.removeEventListener('appinstalled', appInstalledHandler);
      window.removeEventListener('openAddToHome', openHandler);
    };
  }, []);

  const onAddClick = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        try { localStorage.setItem('campus_bus_installed', '1'); } catch (e) {}
      }
      setVisible(false);
      setDeferredPrompt(null);
      console.log('PWA install choice:', choice && choice.outcome);
    } catch (err) {
      console.error('Error showing install prompt', err);
    }
  };

  if (!visible) return null;

  return (
    <div style={styles.modalBackdrop}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-label="Install BusPass">
        <img src="/logo.png" alt="BusPass logo" style={styles.heroLogo} />
        <h3 style={{ margin: '10px 0 6px' }}>Install BusPass</h3>
        <p style={{ margin: 0, color: '#4B5563' }}>Add BusPass to your home screen for quick access.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
          {!isIos ? (
            <>
              <button onClick={onAddClick} style={styles.primaryBtn}>Install</button>
              <button onClick={() => setVisible(false)} style={styles.secondaryBtn}>Not now</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#111827', textAlign: 'center' }}>
                Open Safari • Share • Add to Home Screen
              </div>
              <button onClick={() => setVisible(false)} style={styles.primaryBtn}>Got it</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modal: {
    background: '#fff',
    width: '92vw',
    maxWidth: 420,
    borderRadius: 14,
    padding: 20,
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    textAlign: 'center',
  },
  heroLogo: {
    width: 84,
    height: 84,
    objectFit: 'contain',
    borderRadius: 16,
  },
  primaryBtn: {
    background: '#2563EB',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    minWidth: 100,
  },
  secondaryBtn: {
    background: '#F3F4F6',
    color: '#111827',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    minWidth: 100,
  }
};
