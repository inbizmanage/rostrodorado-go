import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SESSION_KEY = 'rd_analytics_session_id';

export const useAnalytics = () => {
    const location = useLocation();
    const isSessionInit = useRef(false);
    // Track consent state so we can react immediately if they click "Aceptar Todo"
    const [hasConsent, setHasConsent] = useState(() => {
        return typeof window !== 'undefined' ? localStorage.getItem('rd_cookie_consent') === 'all' : false;
    });

    // Listen for consent grant event from CookieBanner
    useEffect(() => {
        const handleConsent = () => setHasConsent(true);
        window.addEventListener('cookieConsentGranted', handleConsent);
        return () => window.removeEventListener('cookieConsentGranted', handleConsent);
    }, []);

    useEffect(() => {
        if (!hasConsent) return; // Do not initialize session if no consent

        const initSession = async () => {
            if (isSessionInit.current) return;
            isSessionInit.current = true;

            const { db } = await import('../firebase');
            const { setDoc, doc, serverTimestamp, updateDoc } = await import('firebase/firestore');

            let sessionId = sessionStorage.getItem(SESSION_KEY);
            const isNewSession = !sessionId;

            if (isNewSession) {
                const generateUUID = () => {
                    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                        return crypto.randomUUID();
                    }
                    // Fallback for non-secure contexts (HTTP / localhost)
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                        const r = Math.random() * 16 | 0;
                        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                    });
                };
                sessionId = generateUUID();
                sessionStorage.setItem(SESSION_KEY, sessionId);

                // Detect Device Type
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

                // Get Source (UTM > Referrer > Direct)
                const searchParams = new URLSearchParams(window.location.search);
                const utmSource = searchParams.get('utm_source');
                const utmMedium = searchParams.get('utm_medium');

                let source = document.referrer;
                // Clean referrer logic
                if (utmSource) {
                    source = utmSource; // Prioritize UTM tags
                } else if (!source) {
                    source = 'Directo';
                } else if (source.includes(window.location.hostname)) {
                    source = 'Interno'; // Self-referral
                } else {
                    const lower = source.toLowerCase();
                    // Facebook (all variants: fb, l.facebook, lm.facebook, m.facebook, web.facebook)
                    if (lower.includes('facebook') || lower.includes('fb.com') || lower === 'fb') source = 'Facebook';
                    else if (lower.includes('instagram') || lower.includes('instagr.am') || lower === 'ig') source = 'Instagram';
                    else if (lower.includes('google')) source = 'Google';
                    else if (lower.includes('t.co') || lower.includes('twitter') || lower.includes('x.com')) source = 'X (Twitter)';
                    else if (lower.includes('tiktok')) source = 'TikTok';
                    else if (lower.includes('whatsapp')) source = 'WhatsApp';
                    else if (lower.includes('youtube') || lower.includes('youtu.be')) source = 'YouTube';
                    else if (lower.includes('pinterest')) source = 'Pinterest';
                }

                // create session doc
                try {
                    await setDoc(doc(db, 'analytics_sessions', sessionId), {
                        startTime: serverTimestamp(),
                        lastActive: serverTimestamp(),
                        referrer: source,
                        utmMedium: utmMedium || '',
                        userAgent: navigator.userAgent,
                        device: isMobile ? 'Mobile' : 'Desktop',
                        screenResolution: `${window.screen.width}x${window.screen.height}`,
                        path: location.pathname,
                        pageViews: 0 // Will increment shortly
                    });
                } catch (e) {
                    console.error("Analytics Error (Session):", e);
                }
            } else {
                // Update last active on existing session
                try {
                    await updateDoc(doc(db, 'analytics_sessions', sessionId!), {
                        lastActive: serverTimestamp()
                    });
                } catch (e) {
                    // Session might have been deleted or expired, fallback silently
                }
            }
        };

        initSession();
    }, [hasConsent]); // Dependency added to run immediately after consent is granted

    // Track Page Views
    useEffect(() => {
        if (!hasConsent) return; // Do not track views if no consent

        const trackView = async () => {
            const sessionId = sessionStorage.getItem(SESSION_KEY);
            if (!sessionId) return; // Should exist from initSession

            try {
                const { db } = await import('../firebase');
                const { collection, addDoc, serverTimestamp, updateDoc, doc, increment } = await import('firebase/firestore');
                // Log the individual view
                await addDoc(collection(db, 'analytics_views'), {
                    sessionId,
                    path: location.pathname,
                    timestamp: serverTimestamp(),
                    title: document.title
                });

                // Increment session page counter
                await updateDoc(doc(db, 'analytics_sessions', sessionId), {
                    pageViews: increment(1),
                    lastActive: serverTimestamp(),
                    lastPath: location.pathname
                });

                // Meta Pixel: PageView (SPA Support)
                import('../utils/pixel').then(({ initPixel, trackEvent }) => {
                    initPixel();
                    trackEvent('PageView');
                });

                // Google Analytics: PageView
                import('../utils/gtag').then(({ pageview }) => {
                    pageview(location.pathname);
                });

                // console.log(`📊 Tracked View: ${location.pathname}`);
            } catch (error) {
                console.error("Analytics Error (View):", error);
            }
        };

        // Small timeout to allow route transition to complete and title to potentially update
        const timeout = setTimeout(trackView, 1000);
        return () => clearTimeout(timeout);
    }, [location.pathname, hasConsent]); // Re-run if path or consent changes
};
