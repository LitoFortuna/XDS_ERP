import React, { useState } from 'react';
import { Student } from '../../../types';
import { getStudentCelebrations } from '../../utils/celebrations';
import { toIsoLocal } from '../../utils/plannerUtils';

const DISMISSED_KEY = 'xds-portal-celebration-dismissed';

interface CelebrationCardProps {
    student: Student;
}

// Felicitación al abrir el Portal el día del cumpleaños o del aniversario de matrícula. Se puede
// cerrar y no vuelve a salir ese día en este dispositivo (se recuerda la fecha, no un "para siempre").
const CelebrationCard: React.FC<CelebrationCardProps> = ({ student }) => {
    const todayIso = toIsoLocal(new Date());
    const dismissKey = `${student.id}_${todayIso}`;
    const [dismissed, setDismissed] = useState(() => {
        try { return localStorage.getItem(DISMISSED_KEY) === dismissKey; } catch { return false; }
    });

    const celebrations = getStudentCelebrations(student);
    if (dismissed || celebrations.length === 0) return null;

    const firstName = student.name.split(' ')[0];
    const birthday = celebrations.find(c => c.kind === 'birthday');
    const anniversary = celebrations.find(c => c.kind === 'anniversary');

    const dismiss = () => {
        try { localStorage.setItem(DISMISSED_KEY, dismissKey); } catch { /* sin almacenamiento */ }
        setDismissed(true);
    };

    return (
        <section
            aria-label="Felicitación"
            className="relative overflow-hidden rounded-xl border border-pink-400/40 bg-gradient-to-br from-pink-600/30 via-fuchsia-700/30 to-purple-800/40 p-5"
        >
            <div aria-hidden="true" className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-pink-400/20 blur-2xl" />
            <button
                onClick={dismiss}
                aria-label="Cerrar felicitación"
                className="absolute top-2 right-2 p-2.5 rounded-full text-pink-100/70 hover:text-white hover:bg-white/10 touch-manipulation"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="relative pr-8">
                {birthday && (
                    <>
                        <p className="text-3xl mb-1" aria-hidden="true">🎂🎉</p>
                        <h2 className="text-xl font-bold text-white">¡Feliz cumpleaños, {firstName}!</h2>
                        <p className="text-pink-100/90 text-sm mt-1">
                            Hoy cumples {birthday.years} años. Todo el equipo de Xen Dance Space te desea un día lleno de ritmo y alegría. 💃
                        </p>
                    </>
                )}
                {anniversary && (
                    <div className={birthday ? 'mt-4 pt-4 border-t border-pink-300/20' : ''}>
                        {!birthday && <p className="text-3xl mb-1" aria-hidden="true">💃✨</p>}
                        <h2 className={`font-bold text-white ${birthday ? 'text-base' : 'text-xl'}`}>
                            {anniversary.years === 1 ? '¡Un año bailando con nosotras!' : `¡${anniversary.years} años bailando con nosotras!`}
                        </h2>
                        <p className="text-pink-100/90 text-sm mt-1">
                            Hoy hace {anniversary.years === 1 ? 'un año' : `${anniversary.years} años`} que empezaste en Xen Dance Space. Gracias por tu energía y por cada paso. 🫶
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default CelebrationCard;
