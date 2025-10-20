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
    <div style={styles.overlay}>
      <div style={styles.card} role="dialog" aria-modal="true" aria-label="Add to Home Screen">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Campus bus" style={styles.logo} />
          <div style={{ marginLeft: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Add Campus bus to your device</div>
            <div style={{ fontSize: 13, color: '#444' }}>Quick access from your home screen</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {!isIos && (
            <>
              <button onClick={onAddClick} style={styles.addBtn}>Add</button>
              <button onClick={() => setVisible(false)} style={styles.cancelBtn}>Maybe later</button>
            </>
          )}

          {isIos && (
            <div style={{ fontSize: 13, color: '#111827' }}>
              <div style={{ marginBottom: 6 }}>On iPhone/iPad: tap Share → Add to Home Screen</div>
              <button onClick={() => setVisible(false)} style={styles.addBtn}>Got it</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 20,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  card: {
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-start',
    background: '#fff',
    padding: '12px 14px',
    borderRadius: 10,
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
    width: 360,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 10,
    objectFit: 'cover',
  },
  addBtn: {
    background: '#2563EB',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
  cancelBtn: {
    background: '#F3F4F6',
    color: '#111827',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
  }
};
