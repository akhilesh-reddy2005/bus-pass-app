import React, { useEffect, useState } from 'react';

export default function PwaDebugStatus() {
  const [swStatus, setSwStatus] = useState('unknown');
  const [manifestOk, setManifestOk] = useState('unknown');
  const [promptStatus, setPromptStatus] = useState('none');
  const [displayMode, setDisplayMode] = useState('browser');

  useEffect(() => {
    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) setSwStatus('registered');
        else setSwStatus('not-registered');
      }).catch(() => setSwStatus('error'));
    } else {
      setSwStatus('unsupported');
    }

    // Check manifest fetch
    fetch('/manifest.json', { cache: 'no-store' }).then(res => {
      if (res.ok) setManifestOk('ok');
      else setManifestOk('missing');
    }).catch(() => setManifestOk('error'));

    // Detect display mode
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) setDisplayMode('standalone');
      else if (window.navigator && window.navigator.standalone) setDisplayMode('standalone');
      else setDisplayMode('browser');
    } catch (e) {
      setDisplayMode('unknown');
    }

    // Listen for beforeinstallprompt
    const beforeHandler = (e) => {
      setPromptStatus('prompt-available');
      // expose for manual use in dev tools
      try { window.__deferredPrompt = e; } catch (err) {}
    };
    const appInstalledHandler = () => setPromptStatus('installed');

    window.addEventListener('beforeinstallprompt', beforeHandler);
    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeHandler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  const color = (s) => {
    if (s === 'ok' || s === 'registered' || s === 'prompt-available' || s === 'standalone') return '#10b981';
    if (s === 'unknown' || s === 'none') return '#6b7280';
    return '#ef4444';
  };

  return (
    <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999 }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 10px', boxShadow: '0 6px 18px rgba(0,0,0,0.12)', fontSize: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <strong style={{ fontSize: 12 }}>PWA</strong>
          <div style={{ width: 8, height: 8, borderRadius: 8, background: color(manifestOk) }} title={`manifest: ${manifestOk}`} />
          <div style={{ width: 8, height: 8, borderRadius: 8, background: color(swStatus) }} title={`service worker: ${swStatus}`} />
          <div style={{ width: 8, height: 8, borderRadius: 8, background: color(promptStatus) }} title={`prompt: ${promptStatus}`} />
        </div>
        <div style={{ marginTop: 6, color: '#374151' }}>
          <div>manifest: {manifestOk}</div>
          <div>service worker: {swStatus}</div>
          <div>prompt: {promptStatus}</div>
          <div>display-mode: {displayMode}</div>
        </div>
      </div>
    </div>
  );
}
