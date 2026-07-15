/**
 * Normaliza cualquier URL de imagen de Google Drive a un formato embebible públicamente.
 * Convierte:
 *   https://lh3.google.com/d/FILE_ID
 *   https://drive.google.com/file/d/FILE_ID/view
 *   https://drive.google.com/open?id=FILE_ID
 * → https://lh3.googleusercontent.com/d/FILE_ID  (proxy estable de Google)
 */
export function normalizeImageUrl(url: string | null | undefined): string {
    if (!url) return '';

    // Extraer FILE_ID de cualquier variante de URL de Google Drive
    let fileId: string | null = null;

    // https://lh3.google.com/d/FILE_ID  o  https://lh3.googleusercontent.com/d/FILE_ID
    const lh3Match = url.match(/lh3\.google(?:usercontent)?\.com\/d\/([a-zA-Z0-9_-]+)/);
    if (lh3Match) fileId = lh3Match[1];

    // https://drive.google.com/file/d/FILE_ID/view
    if (!fileId) {
        const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (driveFileMatch) fileId = driveFileMatch[1];
    }

    // https://drive.google.com/open?id=FILE_ID  o  ?export=view&id=FILE_ID
    if (!fileId) {
        const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch) fileId = idMatch[1];
    }

    // https://drive.google.com/uc?export=view&id=FILE_ID (ya está en formato correcto)
    if (!fileId) {
        const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
        if (ucMatch) fileId = ucMatch[1];
    }

    if (fileId) {
        // Usar el proxy de googleusercontent que no bloquea embeds
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    // Si no es URL de Drive, devolverla tal cual
    return url;
}
