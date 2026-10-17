// Validación y normalización de URLs de imagen pegadas a mano (cartel de eventos, fotos de la
// tienda). Solo se aceptan direcciones http(s): nada de javascript:, data: ni archivos locales.

const DRIVE_FILE = /^https?:\/\/drive\.google\.com\/file\/d\/([\w-]+)/i;
const DRIVE_OPEN = /^https?:\/\/drive\.google\.com\/open\?(?:.*&)?id=([\w-]+)/i;

// Devuelve la URL lista para usar en <img>, o null si no es una dirección válida.
// Convierte los enlaces de "compartir" que NO son una imagen directa:
//  - Google Drive (/file/d/ID/view) -> enlace directo de visualización.
//  - Dropbox (?dl=0) -> ?raw=1.
export const normalizeImageUrl = (input: string): string | null => {
    const value = (input || '').trim();
    if (!value) return null;

    let url: URL;
    try {
        url = new URL(value);
    } catch {
        // Sin protocolo ("www.ejemplo.es/foto.jpg"): se prueba con https.
        if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(value)) {
            try { url = new URL('https://' + value); } catch { return null; }
        } else {
            return null;
        }
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!url.hostname.includes('.')) return null;

    const href = url.toString();
    const drive = DRIVE_FILE.exec(href) || DRIVE_OPEN.exec(href);
    if (drive) return `https://drive.google.com/uc?export=view&id=${drive[1]}`;

    if (/(^|\.)dropbox\.com$/i.test(url.hostname)) {
        url.searchParams.delete('dl');
        url.searchParams.set('raw', '1');
        return url.toString();
    }
    return href;
};

export const isDataUrl = (value: string | undefined): boolean => !!value && value.startsWith('data:');
