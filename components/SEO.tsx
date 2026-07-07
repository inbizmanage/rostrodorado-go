import React, { useEffect } from 'react';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'product';
    schema?: any;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    image = 'https://i.imgur.com/3BrRxvZ.jpeg', // Default OpenGraph Image
    url = window.location?.href || 'https://rostrodorado.com',
    type = 'website',
    schema
}) => {
    const siteTitle = `${title} | Rostro Dorado Clinic`;
    const metaDescription = description || "Clínica privada de Medicina Estética en Riohacha. Dra. Isaura Dorado. Tratamientos de Armonización Facial, Botox y Cuidado de la Piel.";

    useEffect(() => {
        document.title = siteTitle;
        
        // A minimal implementation for document head.
        // Full SSR SEO needs to happen at the framework level or using a properly typed library.
        // We set the title directly to resolve type build errors with react-helmet-async
        const updateMetaTag = (name: string, content: string, isProperty = false) => {
            let element = document.querySelector(
                isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`
            );
            if (!element) {
                element = document.createElement('meta');
                if (isProperty) {
                    element.setAttribute('property', name);
                } else {
                    element.setAttribute('name', name);
                }
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        updateMetaTag('description', metaDescription);
        if (keywords) updateMetaTag('keywords', keywords);
        
        updateMetaTag('og:title', siteTitle, true);
        updateMetaTag('og:description', metaDescription, true);
        updateMetaTag('og:image', image, true);
        updateMetaTag('og:url', url, true);
        updateMetaTag('og:type', type, true);

    }, [siteTitle, metaDescription, keywords, image, url, type]);

    return null;
};

export default SEO;
