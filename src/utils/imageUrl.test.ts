import { describe, it, expect } from 'vitest';
import { normalizeImageUrl, isDataUrl } from './imageUrl';

describe('normalizeImageUrl', () => {
    it('acepta URLs http(s) normales y recorta espacios', () => {
        expect(normalizeImageUrl('  https://ejemplo.es/cartel.jpg ')).toBe('https://ejemplo.es/cartel.jpg');
        expect(normalizeImageUrl('http://ejemplo.es/a.png')).toBe('http://ejemplo.es/a.png');
    });
    it('añade https cuando falta el protocolo', () => {
        expect(normalizeImageUrl('www.ejemplo.es/foto.jpg')).toBe('https://www.ejemplo.es/foto.jpg');
    });
    it('rechaza vacíos, texto suelto y protocolos peligrosos', () => {
        for (const bad of ['', '   ', 'hola', 'javascript:alert(1)', 'data:image/png;base64,AAAA', 'file:///C:/foto.jpg', 'ftp://x.es/a.png', 'https://localhost/a.png']) {
            expect(normalizeImageUrl(bad)).toBeNull();
        }
    });
    it('convierte enlaces de compartir de Google Drive en enlace directo', () => {
        expect(normalizeImageUrl('https://drive.google.com/file/d/1AbC_dEf-123/view?usp=sharing'))
            .toBe('https://drive.google.com/uc?export=view&id=1AbC_dEf-123');
        expect(normalizeImageUrl('https://drive.google.com/open?id=XYZ987'))
            .toBe('https://drive.google.com/uc?export=view&id=XYZ987');
    });
    it('convierte enlaces de Dropbox a descarga directa', () => {
        expect(normalizeImageUrl('https://www.dropbox.com/s/abc/foto.jpg?dl=0')).toBe('https://www.dropbox.com/s/abc/foto.jpg?raw=1');
    });
});

describe('isDataUrl', () => {
    it('distingue una imagen incrustada de una URL', () => {
        expect(isDataUrl('data:image/png;base64,AAA')).toBe(true);
        expect(isDataUrl('https://x.es/a.png')).toBe(false);
        expect(isDataUrl(undefined)).toBe(false);
    });
});
