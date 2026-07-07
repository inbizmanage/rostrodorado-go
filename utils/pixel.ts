
// utils/pixel.ts

// Define the global fbq function type
type FbqEvent = 'track' | 'trackCustom' | 'init';
type StandardEvents =
    | 'PageView'
    | 'ViewContent'
    | 'Search'
    | 'AddToCart'
    | 'InitiateCheckout'
    | 'AddPaymentInfo'
    | 'Purchase'
    | 'Lead'
    | 'CompleteRegistration'
    | string; // allow pixel ID for init

interface PixelData {
    content_ids?: string[];
    content_name?: string;
    content_type?: string;
    contents?: { id: string; quantity: number }[];
    currency?: string;
    value?: number;
    [key: string]: any;
}

// Augment window interface
declare global {
    interface Window {
        fbq: (event: FbqEvent, eventName: StandardEvents, data?: PixelData) => void;
        _fbq: any;
    }
}

export const initPixel = () => {
    if (typeof window === 'undefined') return;
    const consent = localStorage.getItem('rd_cookie_consent');
    if (consent !== 'all') return;
    
    if (window.fbq && typeof window.fbq === 'function' && window._fbq) return;

    // @ts-ignore
    !function(f,b,e,v,n,t,s)
    // @ts-ignore
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    // @ts-ignore
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    // @ts-ignore
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    // @ts-ignore
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    // @ts-ignore
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    window.fbq('init', '834940366041575'); // Your Pixel ID
};

export const trackEvent = (eventName: StandardEvents, data?: PixelData) => {
    if (typeof window !== 'undefined' && window.fbq) {
        const consent = localStorage.getItem('rd_cookie_consent');
        if (consent === 'all') {
            // console.log(`📡 Pixel Event: ${eventName}`, data);
            window.fbq('track', eventName, data);
        } else {
            // console.warn(`⚠️ Pixel Blocked (No consent): ${eventName}`, data);
        }
    } else {
        console.warn(`⚠️ Pixel Ignored (Not loaded): ${eventName}`, data);
    }
};
