
import React, { useState } from 'react';
import { findStudentByPhone } from '../../services/domain/studentService';
import { Student } from '../../../types';

interface StudentLoginProps {
    onLoginSuccess: (student: Student) => void;
}

const StudentLogin: React.FC<StudentLoginProps> = ({ onLoginSuccess }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const checkPassword = (studentName: string, inputPass: string): boolean => {
        const parts = studentName.trim().split(/\s+/);
        // Si tiene más de una palabra, asumimos que la segunda es el primer apellido.
        // Si solo tiene una, usamos esa.
        const surname = parts.length > 1 ? parts[1] : parts[0];

        // Contraseña esperada: Apellido + 2026 (Case insensitive)
        const expectedPass = `${surname}2026`.toLowerCase();

        // Contraseña introducida también a minúsculas para comparar
        return inputPass.toLowerCase() === expectedPass;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const student = await findStudentByPhone(phone.trim());

            if (!student) {
                setError('No se encontró ningún alumno con ese teléfono.');
                setIsLoading(false);
                return;
            }

            if (!student.active) {
                setError('Este alumno no está activo. Contacta con la administración.');
                setIsLoading(false);
                return;
            }

            if (checkPassword(student.name, password)) {
                localStorage.setItem('student_portal_id', student.id);
                onLoginSuccess(student);
            } else {
                setError('Contraseña incorrecta. (Pista: PrimerApellido2026)');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
            <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Portal del Alumno</h1>
                        <p className="text-gray-400">Accede a tus datos, clases y recibos</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono Móvil</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="Ej: 600123456"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="Tu Apellido + 2026"
                                required
                            />
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
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Verificando...' : 'Entrar al Portal'}
                        </button>
                    </form>
                </div>
                <div className="bg-gray-700/30 px-6 py-4 border-t border-gray-700 text-center">
                    <p className="text-xs text-gray-500">
                        ¿Problemas para entrar? Contacta con administración.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StudentLogin;
