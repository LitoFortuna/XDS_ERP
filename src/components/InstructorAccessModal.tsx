import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Instructor } from '../../types';
import Modal from './Modal';
import { useConfirm, useToast } from './ui/Feedback';
import { manageInstructorAccount } from '../services/domain/teacherService';

interface InstructorAccessModalProps {
    instructor: Instructor | null;
    onClose: () => void;
}

// Gestión del acceso de un profesor al ERP (panel de profesor): crear cuenta, restablecer
// contraseña o quitar el acceso. La contraseña temporal se muestra UNA vez, aquí, para que la
// administración se la entregue; el servidor no la guarda ni la puede volver a mostrar.
const InstructorAccessModal: React.FC<InstructorAccessModalProps> = ({ instructor, onClose }) => {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const toast = useToast();
    const [busy, setBusy] = useState(false);
    const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const close = () => {
        setCredentials(null);
        setCopied(false);
        onClose();
    };

    const run = async (action: 'create' | 'reset' | 'revoke') => {
        if (!instructor || busy) return;
        setBusy(true);
        try {
            const result = await manageInstructorAccount(action, instructor.id);
            await queryClient.invalidateQueries({ queryKey: ['instructors'] });
            if (action === 'revoke') {
                toast(`Acceso de ${instructor.name} eliminado.`, 'success');
                close();
            } else if (result.email && result.password) {
                setCredentials({ email: result.email, password: result.password });
            }
        } catch (error) {
            const message = (error as { message?: string } | null)?.message;
            toast(message || 'No se pudo completar la operación. Inténtalo de nuevo.', 'error');
        } finally {
            setBusy(false);
        }
    };

    const handleRevoke = async () => {
        if (!instructor) return;
        const accepted = await confirm({
            title: 'Quitar acceso',
            message: `${instructor.name} dejará de poder entrar al ERP. Podrás crearle un acceso nuevo cuando quieras.`,
            confirmLabel: 'Quitar acceso',
            destructive: true,
        });
        if (accepted) run('revoke');
    };

    const handleCopy = async () => {
        if (!credentials) return;
        try {
            await navigator.clipboard.writeText(`Acceso al ERP de Xen Dance Space\nUsuario: ${credentials.email}\nContraseña temporal: ${credentials.password}`);
            setCopied(true);
        } catch {
            toast('No se pudo copiar. Selecciona el texto y cópialo a mano.', 'error');
        }
    };

    return (
        <Modal isOpen={!!instructor} onClose={close} title={`Acceso al ERP · ${instructor?.name || ''}`}>
            {credentials ? (
                <div className="space-y-4">
                    <p className="text-sm text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
                        Apunta o copia estos datos ahora: <strong>la contraseña no se volverá a mostrar</strong>. Si se pierde, podrás generar otra.
                    </p>
                    <dl className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 space-y-3 text-sm">
                        <div>
                            <dt className="text-xs text-gray-400">Usuario</dt>
                            <dd className="font-mono text-white break-all select-all">{credentials.email}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-400">Contraseña temporal</dt>
                            <dd className="font-mono text-lg text-purple-200 select-all">{credentials.password}</dd>
                        </div>
                    </dl>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleCopy} className="min-h-[44px] rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold">
                            {copied ? '✓ Copiado' : 'Copiar datos'}
                        </button>
                        <button onClick={close} className="min-h-[44px] rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold">Hecho</button>
                    </div>
                    <p className="text-xs text-gray-400">Entra en la misma dirección del ERP con ese usuario y contraseña; verá solo su panel de profesor.</p>
                </div>
            ) : instructor?.hasAccess ? (
                <div className="space-y-4">
                    <p className="text-sm text-gray-300">
                        <strong className="text-green-300">Tiene acceso</strong> con el usuario <span className="font-mono text-white break-all">{instructor.email}</span>.
                        Ve su panel con sus clases, su asistencia, sus alumnas y su horario.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button disabled={busy} onClick={() => run('reset')} className="min-h-[44px] rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold">
                            Restablecer contraseña
                        </button>
                        <button disabled={busy} onClick={handleRevoke} className="min-h-[44px] rounded-lg bg-red-500/10 border border-red-500/40 text-red-300 hover:bg-red-500/20 disabled:opacity-50 font-semibold">
                            Quitar acceso
                        </button>
                    </div>
                    <p className="text-xs text-gray-400">Si cambias el email de la ficha, el usuario de acceso no cambia: quita el acceso y créalo de nuevo.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-gray-300">
                        Crea un usuario para que {instructor?.name} entre al ERP con un panel limitado: solo verá <strong>sus clases</strong>, pasará <strong>asistencia</strong> de ellas y tendrá un resumen con sus alumnas.
                        No ve pagos, cuotas ni datos de contacto.
                    </p>
                    <p className="text-sm text-gray-300">
                        Usuario: {instructor?.email
                            ? <span className="font-mono text-white break-all">{instructor.email}</span>
                            : <span className="text-amber-300">la ficha no tiene email; añádelo con «Editar» antes de crear el acceso.</span>}
                    </p>
                    <button
                        disabled={busy || !instructor?.email}
                        onClick={() => run('create')}
                        className="w-full min-h-[48px] rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold"
                    >
                        {busy ? 'Creando…' : 'Crear acceso'}
                    </button>
                </div>
            )}
        </Modal>
    );
};

export default InstructorAccessModal;
