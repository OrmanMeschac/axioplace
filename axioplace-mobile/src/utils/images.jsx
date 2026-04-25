import { API_STORAGE_URL, API_BASE_URL } from '../config';

// Placeholder image par défaut (icône neutre)
const PLACEHOLDER = require('../../assets/favicon.png');

/**
 * Resolves the URI for an image path returned by the Laravel API.
 *
 * Handles:
 * 1. Null / undefined / non-string → placeholder
 * 2. Already absolute HTTP/HTTPS URL → return as-is (with emulator fix)
 * 3. Path that includes "storage/" prefix → strip & rebuild
 * 4. Windows-style backslashes → normalized
 * 5. Leading slash stripped to avoid double slashes
 * 6. forceRefresh=true → ajoute un timestamp dans l'URL pour vider le cache Android
 *    (NOTE: `cache: 'reload'` n'est PAS un prop standard de <Image> sur Android)
 *
 * @param {string|null} path  - Le `chemin` renvoyé par l'API (ex: "annonces/xyz.jpg")
 * @param {boolean} forceRefresh - Si true, ajoute `?t=timestamp` pour contourner le cache
 * @returns {{ uri: string } | require}
 */
export const getImageUri = (path, forceRefresh = false) => {
    if (!path || typeof path !== 'string' || path.trim() === '') return PLACEHOLDER;

    // 1. Normalise les backslashes Windows
    let cleanPath = path.replace(/\\/g, '/');

    // 2. Si c'est déjà une URL absolue, on corrige uniquement le routage émulateur
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        cleanPath = cleanPath
            .replace('http://127.0.0.1:', `${API_BASE_URL.startsWith('https') ? 'https' : 'http'}://10.0.2.2:`)
            .replace('http://localhost:', 'http://10.0.2.2:');

        const finalUri = forceRefresh
            ? `${cleanPath}?t=${Date.now()}`
            : cleanPath;
        return { uri: finalUri };
    }

    // 3. Supprime le préfixe "storage/" ou "/storage/" (évite les doubles chemins)
    cleanPath = cleanPath.replace(/^\/?storage\//, '');

    // 4. Supprime tout slash de début restant
    cleanPath = cleanPath.replace(/^\//, '');

    // 5. Construit l'URL finale
    const fullUrl = `${API_STORAGE_URL}${cleanPath}`;

    // 6. Cache-busting via timestamp dans l'URL (compatible Android + iOS + web)
    const finalUri = forceRefresh
        ? `${fullUrl}?t=${Date.now()}`
        : fullUrl;

    return { uri: finalUri };
};

/**
 * Récupère une source d'image avec garantie de fallback en cas d'erreur.
 */
export const getSafeImageSource = (path, forceRefresh = false) => {
    try {
        return getImageUri(path, forceRefresh);
    } catch {
        return PLACEHOLDER;
    }
};
