
import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { auth, functions } from '../../config/firebase';
import { getStudentById } from '../../services/domain/studentService';
import { Student } from '../../../types';

interface StudentLoginProps {
    onLoginSuccess: (student: Student) => void;
}

interface StudentLoginResult {
    token: string;
    studentId: string;
}

const StudentLogin: React.FC<StudentLoginProps> = ({ onLoginSuccess }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // El teléfono+contraseña se verifican en el servidor (Cloud Function studentLogin),
            // que emite un token real de Firebase Auth. Eso es lo que permite a firestore.rules
            // dejar leer a esta alumna su propio DNI/IBAN sin hacerlos públicos para todo el mundo.
            const studentLogin = httpsCallable<{ phone: string; password: string }, StudentLoginResult>(functions, 'studentLogin');
            const result = await studentLogin({ phone: phone.trim(), password });
            const { token, studentId } = result.data;

            await signInWithCustomToken(auth, token);

            // Se busca por el studentId que devuelve el propio login, NUNCA re-buscando por
            // teléfono: el teléfono no es único (hermanas, o el móvil de una madre repetido en
            // varias fichas) y un "primer resultado" de esa búsqueda podía devolver la ficha de
            // otra alumna, filtrando sus pagos/asistencia/datos a la persona equivocada.
            const student = await getStudentById(studentId);
            if (!student) {
                setError('No se encontró ningún alumno con ese teléfono.');
                setIsLoading(false);
                return;
            }

            localStorage.setItem('student_portal_id', studentId);
            onLoginSuccess(student);
        } catch (err: any) {
            console.error('[StudentLogin] Error:', err);
            if (err?.code === 'functions/not-found') {
                setError('No se encontró ningún alumno con ese teléfono.');
            } else if (err?.code === 'functions/permission-denied') {
                setError('Este alumno no está activo. Contacta con la administración.');
            } else if (err?.code === 'functions/unauthenticated') {
                setError('Contraseña incorrecta. (Pista: PrimerApellido2026)');
            } else {
                setError('Error de conexión. Inténtalo de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
            <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <img src="/pwa-192x192.png" alt="Xen Dance Space" width={80} height={80} className="mx-auto mb-4 h-20 w-20 rounded-2xl shadow-lg shadow-purple-900/40" />
                        <h1 className="text-3xl font-bold text-white mb-2">Portal del Alumno</h1>
                        <p className="text-gray-400">Accede a tus datos, clases y recibos</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="portal-phone" className="block text-sm font-medium text-gray-300 mb-1">Teléfono Móvil</label>
                            <input
                                id="portal-phone"
                                name="phone"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="Ej: 600123456"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="portal-password" className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
                            <div className="relative">
                                <input
                                    id="portal-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-4 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="Tu Apellido + 2026"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    aria-pressed={showPassword}
                                    className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-400 hover:text-white rounded-r-lg"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                                        {showPassword ? (
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
                        </div>

                        {error && (
                            <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full min-h-[48px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Verificando...' : 'Entrar al Portal'}
                        </button>
                    </form>
                </div>
                <div className="bg-gray-700/30 px-6 py-4 border-t border-gray-700 text-center">
                    <p className="text-xs text-gray-400">
                        ¿Problemas para entrar? Contacta con administración.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StudentLogin;
