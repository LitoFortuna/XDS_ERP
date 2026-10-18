export const MIN_PASSWORD_LENGTH = 8;

// Devuelve el mensaje de error del formulario de cambio de contraseña, o null si todo está bien.
export const validatePasswordChange = (current: string, next: string, confirm: string): string | null => {
    if (!current) return 'Escribe tu contraseña actual.';
    if (next.length < MIN_PASSWORD_LENGTH) return `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    if (next === current) return 'La nueva contraseña debe ser distinta de la actual.';
    if (next !== confirm) return 'Las dos contraseñas nuevas no coinciden.';
    return null;
};

// Traduce los códigos de error de Firebase Auth a un mensaje claro para la persona.
export const passwordChangeErrorMessage = (code: string | undefined): string => {
    switch (code) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
            return 'La contraseña actual no es correcta.';
        case 'auth/weak-password':
            return 'La nueva contraseña es demasiado débil. Usa letras y números.';
        case 'auth/too-many-requests':
            return 'Demasiados intentos. Espera unos minutos y vuelve a probar.';
        case 'auth/requires-recent-login':
            return 'Por seguridad, cierra sesión, vuelve a entrar e inténtalo de nuevo.';
        case 'auth/network-request-failed':
            return 'No hay conexión. Inténtalo de nuevo.';
        default:
            return 'No se pudo cambiar la contraseña. Inténtalo de nuevo.';
    }
};
