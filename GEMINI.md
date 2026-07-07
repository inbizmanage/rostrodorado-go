# Antigravity Workspace Rules — Rostro Dorado Clinic

## 🛠️ Stack Tecnológico
*   **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion (para animaciones), Vite, React Router DOM.
*   **Backend & Base de Datos:** Firebase (Firestore, Cloud Functions, Hosting, Authentication).
*   **Analítica:** Panel de analíticas propio en Firestore (`useAnalytics.tsx`, `AdminAnalytics.tsx`), Integración de Meta Pixel (`utils/pixel.ts`).
*   **Seguridad y Anti-Spam:** Cloudflare Turnstile CAPTCHA (formulario de contacto).

## 🚀 Reglas Clave y Guías de Desarrollo

### 1. Diseño y Estilos (UI/UX)
*   **Mantenimiento de Marca:** Mantener siempre la estética premium y elegante de una clínica estética (tema oscuro `bg-charcoal` o similar, detalles dorados `#C6A87C`, tipografía fina y legible).
*   **CSS:** Usar **únicamente** clases de utilidad de Tailwind CSS. Evitar estilos en línea (`style={{...}}`) a menos que sean estrictamente necesarios para valores calculados de forma dinámica.
*   **Animaciones:** Todas las transiciones de página, apariciones en scroll y cambios de modales deben utilizar `framer-motion` para verse fluidas y de alta calidad. Evita animaciones exageradas; prefiere fundidos lentos y movimientos sutiles.

### 2. Base de Datos (Firebase Firestore)
*   **Captura de Leads:** Emplear el sistema progresivo actual (`createDoc` en el primer paso, `updateDoc` en los siguientes) para asegurar que el cliente que abandone el proceso a la mitad igual quede registrado en la base de datos de clientes potenciales (`leads`).
*   **Seguridad:** Respetar estrictamente el archivo `firestore.rules`. Colecciones sensibles (análisis, métricas) solo accesibles si el admin está autenticado. La colección de clientes (`leads`) debe ser públicamente escribible para crear registros nuevos, pero de lectura privada (solo admins).
*   **Analíticas Propias:** Todo visitante nuevo se le genera un UUID y se guarda en `sessionStorage` para registrar la sesión y el referrer limpio. Las lecturas/vistas de página individuales van a la subcollección/documentos de `analytics_views`.

### 3. Analítica Externa y Privacidad (Legal)
*   **Protección de Datos:** Las cookies comerciales de rastreo (Pixel de Meta) y Analíticas (FireStore) **ESTÁN RESTRINGIDAS** hasta que el usuario dé su consentimiento a través del componente global `CookieBanner`. 
*   **Consent Mode:** NUNCA modificar `utils/pixel.ts` o el hook `useAnalytics.tsx` de forma que se salten la validación `localStorage.getItem('rd_cookie_consent') === 'all'`.
*   Las cookies puramente funcionales (Carrito de compras en localStorage) están exentas y se pueden usar siempre.

### 4. Arquitectura y Código
*   **TypeScript:** Seguir convenciones estrictas de tipado en interfaces y type alias. Evitar `any` a menos que sea un mockeo/prueba rápida.
*   **Componentes Modulares:** Todo código en `components/` debe ser altamente reutilizable, priorizando hooks como `useState` y `useEffect`. 
*   **Archivos Globales:** Datos fijos (como departamentos de Colombia, menús de tratamientos, tarifas) van en la carpeta `constants/`.

### 5. Despliegue en Producción
*   **Pasos estrictos de build:** `npm run build` seguido de `npx firebase deploy --only hosting`.
*   Nunca olvidar regenerar o compilar manualmente si se cambian variables de entorno críticas en los archivos `.env` (como las llaves de Cloudflare).
*   Si se tocan Cloud Functions (archivo `functions/index.js`): probar localmente con Firebase Emulators y subir solo con `firebase deploy --only functions`.

---
*Nota: Este conjunto de reglas asegura que Antigravity actúe de manera predictible y respete la arquitectura establecida en las sesiones previas para este proyecto.*
