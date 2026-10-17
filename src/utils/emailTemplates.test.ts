import { describe, it, expect } from 'vitest';
import { buildInstructorWelcomeEmail, escapeHtml, ERP_LOGIN_URL } from '../../functions/src/emailTemplates';

describe('buildInstructorWelcomeEmail', () => {
    const email = buildInstructorWelcomeEmail({ name: 'Carlos Ruiz Peña', email: 'carlos@correo.es', password: 'Ab3dEf7hJk9m' });

    it('incluye saludo, usuario, contraseña y botón de entrada', () => {
        expect(email.html).toContain('Hola <strong>Carlos</strong>');
        expect(email.html).toContain('carlos@correo.es');
        expect(email.html).toContain('Ab3dEf7hJk9m');
        expect(email.html).toContain(`href="${ERP_LOGIN_URL}"`);
        expect(email.html).toContain('Entrar a mi panel');
        expect(email.subject).toContain('Tu acceso al ERP');
    });

    it('trae versión de texto con las mismas credenciales', () => {
        expect(email.text).toContain('Usuario: carlos@correo.es');
        expect(email.text).toContain('Contraseña temporal: Ab3dEf7hJk9m');
        expect(email.text).toContain(ERP_LOGIN_URL);
    });

    it('escapa el HTML de los datos (nombre con etiquetas o comillas)', () => {
        const evil = buildInstructorWelcomeEmail({ name: '<script>alert(1)</script> Ana', email: 'a"b@x.es', password: 'p<&>w' });
        expect(evil.html).not.toContain('<script>');
        expect(evil.html).toContain('&lt;script&gt;');
        expect(evil.html).toContain('a&quot;b@x.es');
        expect(evil.html).toContain('p&lt;&amp;&gt;w');
    });

    it('sin nombre usa un saludo neutro', () => {
        expect(buildInstructorWelcomeEmail({ name: '  ', email: 'a@a.es', password: 'x' }).html).toContain('Hola <strong>profe</strong>');
    });
});

describe('escapeHtml', () => {
    it('escapa los cinco caracteres peligrosos', () => {
        expect(escapeHtml(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
    });
});
