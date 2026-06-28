"use client";

import React, { useEffect, useState } from 'react';

export interface TestGardenProviderProps {
  /**
   * Overrides the Test Garden dashboard server URL.
   * Defaults to production URL: 'https://test-garden-ten.vercel.app'
   */
  host?: string;
  /**
   * Enables or disables the automatic testing auth bypass.
   * It is highly recommended to enable this only in development and staging environments.
   * Example: process.env.NODE_ENV !== 'production'
   */
  enableAutoAuth?: boolean;
  /**
   * Async callback executed when Test Garden requests automatic authentication.
   * This callback should perform the login programmatically in the client
   * (e.g. calling your auth provider's client-side login function)
   * and return a promise that resolves when the session is active.
   */
  onAuthenticate?: (role: string) => Promise<void>;
}

export function TestGardenProvider({
  host = 'https://test-garden-ten.vercel.app',
  enableAutoAuth = false,
  onAuthenticate
}: TestGardenProviderProps): React.JSX.Element | null {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Inject the main Test Garden tracker / recorder script
    const script = document.createElement('script');
    script.src = `${host}/js/testgarden-recorder.js`;
    script.async = true;
    document.head.appendChild(script);

    // 2. Handle automatic testing authentication (Auto-Auth Bypass)
    let isMounted = true;

    const handleAutoAuth = async () => {
      if (!enableAutoAuth || !onAuthenticate) return;

      const urlParams = new URLSearchParams(window.location.search);
      const role = urlParams.get('tg_auth_role');
      const token = urlParams.get('tg_token') || sessionStorage.getItem('tg_token');

      if (role && token) {
        setIsAuthenticating(true);
        console.log(`[Test Garden React SDK] Starting automatic authentication for role: ${role}`);

        try {
          // Run the developer's client-side authentication callback
          await onAuthenticate(role);

          console.log('[Test Garden React SDK] Authentication completed successfully.');

          // Send the TG_READY handshake message to the parent dashboard window
          window.parent.postMessage({
            type: 'TG_READY',
            token: token,
            url: window.location.href,
            auth_success: true
          }, '*');

          // Clean url query parameters to prevent token leaking and maintain clean UI
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('tg_auth_role');
          window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search);
        } catch (err: any) {
          console.error('[Test Garden React SDK] Auto-authentication error:', err);
          window.parent.postMessage({
            type: 'PLAY_STEP_ERROR',
            token: token,
            error: err.message || 'onAuthenticate callback failed'
          }, '*');
        } finally {
          if (isMounted) {
            setIsAuthenticating(false);
          }
        }
      }
    };

    handleAutoAuth();

    return () => {
      isMounted = false;
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [host, enableAutoAuth, onAuthenticate]);

  // Render a minimal full-screen loader overlay inside the iframe during authentication
  if (isAuthenticating) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #F0FDF4',
          borderTopColor: '#166534',
          borderRadius: '50%',
          animation: 'tg-spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes tg-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{
          marginTop: '16px',
          color: '#166534',
          fontSize: '14px',
          fontWeight: 600,
          margin: '16px 0 0 0'
        }}>
          Autenticando usuario de pruebas...
        </p>
      </div>
    );
  }

  return null;
}
