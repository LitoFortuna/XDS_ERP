import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../Modal';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    message: string;
    kind: ToastKind;
}

export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
}

interface FeedbackApi {
    toast: (message: string, kind?: ToastKind) => void;
    confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

const TOAST_STYLE: Record<ToastKind, string> = {
    success: 'bg-emerald-900/95 border-emerald-500/50 text-emerald-50',
    error: 'bg-rose-900/95 border-rose-500/50 text-rose-50',
    info: 'bg-gray-800/95 border-purple-400/40 text-gray-50',
};

// El código existente usa alert() con mensajes sueltos; en vez de reescribir cada llamada, el
// proveedor reemplaza window.alert y deduce el tono por el texto para no mostrar un error en verde.
const guessKind = (text: string): ToastKind => {
    if (/error|no se pudo|no se pudieron|fall[óo]|incorrect|inválid|invalid|ya existe|no hay /i.test(text)) return 'error';
    if (/guardad|aprobad|rechazad|registrad|actualizad|eliminad|restaurad|importad|correctamente|creado|añadid|enviad/i.test(text)) return 'success';
    return 'info';
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [pending, setPending] = useState<{ options: ConfirmOptions; resolve: (value: boolean) => void } | null>(null);
    const nextId = useRef(0);
    const pendingRef = useRef(pending);
    pendingRef.current = pending;

    const dismiss = useCallback((id: number) => setToasts(list => list.filter(t => t.id !== id)), []);

    const toast = useCallback((message: string, kind: ToastKind = 'info') => {
        const id = ++nextId.current;
        setToasts(list => [...list.slice(-2), { id, message, kind }]);
        window.setTimeout(() => dismiss(id), kind === 'error' ? 8000 : 4500);
    }, [dismiss]);

    const confirm = useCallback((options: ConfirmOptions | string) => new Promise<boolean>(resolve => {
        // Si ya hubiera otra pregunta abierta, se da por cancelada antes de mostrar la nueva.
        pendingRef.current?.resolve(false);
        setPending({ options: typeof options === 'string' ? { message: options } : options, resolve });
    }), []);

    const answer = (value: boolean) => {
        pending?.resolve(value);
        setPending(null);
    };

    useEffect(() => {
        const original = window.alert;
        window.alert = (message?: unknown) => {
            const text = String(message ?? '');
            toast(text, guessKind(text));
        };
        return () => { window.alert = original; };
    }, [toast]);

    const api = useMemo<FeedbackApi>(() => ({ toast, confirm }), [toast, confirm]);
    const options = pending?.options;

    return (
        <FeedbackContext.Provider value={api}>
            {children}

            <div className="fixed z-[60] top-[4.75rem] inset-x-0 px-4 flex flex-col items-center gap-2 pointer-events-none sm:top-6 sm:inset-x-auto sm:right-6 sm:left-auto sm:px-0 sm:items-end">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        role={t.kind === 'error' ? 'alert' : 'status'}
                        className={`pointer-events-auto w-full sm:w-auto sm:max-w-sm rounded-xl border px-4 py-3 shadow-2xl backdrop-blur flex items-start gap-3 text-sm ${TOAST_STYLE[t.kind]}`}
                    >
                        <p className="flex-1 whitespace-pre-line break-words">{t.message}</p>
                        <button
                            onClick={() => dismiss(t.id)}
                            aria-label="Cerrar aviso"
                            className="-m-1 p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 flex-shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                ))}
            </div>

            <Modal isOpen={!!pending} onClose={() => answer(false)} title={options?.title || 'Confirmar'}>
                <p className="text-gray-200 whitespace-pre-line break-words">{options?.message}</p>
                <div className="grid grid-cols-2 sm:flex sm:justify-end gap-3 mt-6">
                    <button
                        onClick={() => answer(false)}
                        className="min-h-[44px] px-5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold"
                    >
                        {options?.cancelLabel || 'Cancelar'}
                    </button>
                    <button
                        onClick={() => answer(true)}
                        autoFocus
                        className={`min-h-[44px] px-5 rounded-lg text-white text-sm font-bold ${options?.destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                    >
                        {options?.confirmLabel || 'Aceptar'}
                    </button>
                </div>
            </Modal>
        </FeedbackContext.Provider>
    );
};

// Sin proveedor (tests o pantallas montadas aparte) se cae al cuadro nativo, para no romper nada.
const nativeConfirm = async (options: ConfirmOptions | string) =>
    window.confirm(typeof options === 'string' ? options : options.message);

export const useConfirm = () => useContext(FeedbackContext)?.confirm ?? nativeConfirm;
export const useToast = () => useContext(FeedbackContext)?.toast ?? ((message: string) => window.alert(message));
