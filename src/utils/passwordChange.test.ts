import { describe, it, expect } from 'vitest';
import { validatePasswordChange, passwordChangeErrorMessage } from './passwordChange';

describe('validatePasswordChange', () => {
    it('acepta un cambio correcto', () => {
        expect(validatePasswordChange('Vieja1234', 'Nueva5678', 'Nueva5678')).toBeNull();
    });
    it('exige la actual, mínimo 8 caracteres, distinta y confirmada', () => {
        expect(validatePasswordChange('', 'Nueva5678', 'Nueva5678')).toMatch(/actual/);
        expect(validatePasswordChange('Vieja1234', 'corta', 'corta')).toMatch(/al menos 8/);
        expect(validatePasswordChange('Vieja1234', 'Vieja1234', 'Vieja1234')).toMatch(/distinta/);
        expect(validatePasswordChange('Vieja1234', 'Nueva5678', 'Otra5678')).toMatch(/no coinciden/);
    });
});

describe('passwordChangeErrorMessage', () => {
    it('traduce los errores habituales de Firebase', () => {
        expect(passwordChangeErrorMessage('auth/invalid-credential')).toMatch(/actual no es correcta/);
        expect(passwordChangeErrorMessage('auth/wrong-password')).toMatch(/actual no es correcta/);
        expect(passwordChangeErrorMessage('auth/too-many-requests')).toMatch(/Demasiados intentos/);
        expect(passwordChangeErrorMessage('auth/requires-recent-login')).toMatch(/vuelve a entrar/);
        expect(passwordChangeErrorMessage(undefined)).toMatch(/No se pudo/);
    });
});
