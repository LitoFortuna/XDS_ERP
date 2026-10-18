import React, { useState } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import Modal from '../Modal';
import { useToast } from '../ui/Feedback';
import { validatePasswordChange, passwordChangeErrorMessage, MIN_PASSWORD_LENGTH } from '../../utils/passwordChange';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const fieldClass = 'w-full bg-gray-700 border border-gray-600 rounded-lg pl-3 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500';

const PasswordField: React.FC<{
    id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string; shown: boolean; onToggle: () => void; hint?: string;
}> = ({ id, label, value, onChange, autoComplete, shown, onToggle, hint }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <div className="relative">
            <input
                id={id}
                type={shown ? 'text' : 'password'}
                value={value}
                onChange={e => onChange(e.target.value)}
                autoComplete={autoComplete}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                className={fieldClass}
            />
            <button
                type="button"
                onClick={onToggle}
                aria-label={shown ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={shown}
                className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-400 hover:text-white rounded-r-lg"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    {shown ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    ) : (
                        <>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </>
                    )}
                </svg>
            </button>
        </div>
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
);

// Cambio de contraseña del propio profesor: se vuelve a verificar la contraseña actual (Firebase lo
// exige para operaciones sensibles) y después se guarda la nueva. Las sesiones abiertas en otros
// dispositivos siguen hasta que caduque su token.
const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const toast = useToast();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [shown, setShown] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const close = () => {
        setCurrent(''); setNext(''); setConfirm(''); setShown(false); setError('');
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;
        const validation = validatePasswordChange(current, next, confirm);
        if (validation) { setError(validation); return; }

        const user = auth.currentUser;
        if (!user || !user.email) { setError(passwordChangeErrorMessage(undefined)); return; }

        setSaving(true);
        setError('');
        try {
            await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
            await updatePassword(user, next);
            toast('Contraseña cambiada correctamente.', 'success');
            close();
        } catch (err) {
            setError(passwordChangeErrorMessage((err as { code?: string } | null)?.code));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={close} title="Cambiar mi contraseña">
            <form onSubmit={handleSubmit} className="space-y-4">
                <PasswordField id="pw-current" label="Contraseña actual" value={current} onChange={setCurrent} autoComplete="current-password" shown={shown} onToggle={() => setShown(s => !s)} />
                <PasswordField id="pw-new" label="Nueva contraseña" value={next} onChange={setNext} autoComplete="new-password" shown={shown} onToggle={() => setShown(s => !s)} hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`} />
                <PasswordField id="pw-confirm" label="Repite la nueva contraseña" value={confirm} onChange={setConfirm} autoComplete="new-password" shown={shown} onToggle={() => setShown(s => !s)} />

                {error && (
                    <p role="alert" className="text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{error}</p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                    <button type="button" onClick={close} className="min-h-[48px] rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold">Cancelar</button>
                    <button type="submit" disabled={saving} className="min-h-[48px] rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold">
                        {saving ? 'Guardando…' : 'Cambiar contraseña'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ChangePasswordModal;
