import React, { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AddToHomeButton({ profile, onDone }) {
  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(profile && profile.installedPwa);

  useEffect(() => {
    setInstalled(profile && profile.installedPwa);
  }, [profile]);

  useEffect(() => {
    const check = () => {
      // beforeinstallprompt may be stored on window for dev; otherwise not available in iOS
      const dp = window.__deferredPrompt || null;
      setAvailable(!!dp);
    };
    check();

    const handler = (e) => {
      setAvailable(true);
      try { window.__deferredPrompt = e; } catch (err) {}
    };
    const installedHandler = () => setInstalled(true);

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const onClick = async () => {
    if (installed) return;
    const dp = window.__deferredPrompt || null;
    if (!dp) {
      // No native deferred prompt available (likely iOS). Open the in-app overlay instead of showing a native alert.
      try {
        window.dispatchEvent(new Event('openAddToHome'));
      } catch (err) {
        // fallback to alert if dispatch fails
        alert('On iPhone/iPad: tap Share → Add to Home Screen');
      }
      return;
    }

    try {
      dp.prompt();
      const choice = await dp.userChoice;
      if (choice && choice.outcome === 'accepted') {
        // Persist flag in Firestore if profile exists
        if (profile && profile.uid) {
          try {
            const userRef = doc(db, 'users', profile.uid);
            await updateDoc(userRef, { installedPwa: true });
          } catch (err) {
            console.error('Failed to update installedPwa flag:', err);
          }
        } else {
          try { localStorage.setItem('campus_bus_installed', '1'); } catch (err) {}
        }
        setInstalled(true);
        if (onDone) onDone();
      }
    } catch (err) {
      console.error('Error during prompt:', err);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={installed}
      title={installed ? 'App installed' : (available ? 'Add to Home Screen' : 'Add to Home Screen (not available)')}
      style={{
        background: installed ? '#9CA3AF' : '#10B981',
        color: '#fff',
        border: 'none',
        padding: '8px 10px',
        borderRadius: 8,
        cursor: installed ? 'not-allowed' : 'pointer',
        fontWeight: 700,
      }}
    >
      {installed ? 'Installed' : 'Add to Home'}
    </button>
  );
}
