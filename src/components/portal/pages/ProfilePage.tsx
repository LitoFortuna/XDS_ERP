import React from 'react';
import { Student, Payment, ChangeRequest } from '../../../../types';

interface ProfilePageProps {
    student: Student;
    payments: Payment[];
    changeRequests: ChangeRequest[];
    onRequestChange: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
    student,
    payments,
    changeRequests,
    onRequestChange
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            {/* Personal Data */}
            <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        Mis Datos Personales
                    </h3>
                    <button
                        onClick={onRequestChange}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Solicitar Cambio
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-gray-400 text-xs uppercase mb-1">Nombre</p>
                        <p className="text-white font-medium">{student.name}</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-gray-400 text-xs uppercase mb-1">Teléfono</p>
                        <p className="text-white font-medium">{student.phone}</p>
                    </div>
                    {student.birthDate && (
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                            <p className="text-gray-400 text-xs uppercase mb-1">Fecha de Nacimiento</p>
                            <p className="text-white font-medium">{formatDate(student.birthDate)}</p>
                        </div>
                    )}
                    {student.email && (
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                            <p className="text-gray-400 text-xs uppercase mb-1">Email</p>
                            <p className="text-white font-medium break-all">{student.email}</p>
                        </div>
                    )}
                    {student.dni && (
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                            <p className="text-gray-400 text-xs uppercase mb-1">DNI</p>
                            <p className="text-white font-medium">{student.dni}</p>
                        </div>
                    )}
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                        <p className="text-gray-400 text-xs uppercase mb-1">Fecha de Inscripción</p>
                        <p className="text-white font-medium">{formatDate(student.enrollmentDate)}</p>
                    </div>
                </div>
            </section>

            {/* Change Requests */}
            {changeRequests.length > 0 && (
                <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Solicitudes de Cambio</h3>
                    <div className="space-y-3">
                        {changeRequests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-sm text-gray-400">{formatDate(request.requestDate)}</p>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${request.status === 'Aprobada'
                                                ? 'bg-green-500/20 text-green-400'
                                                : request.status === 'Rechazada'
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : 'bg-yellow-500/20 text-yellow-400'
                                            }`}
                                    >
                                        {request.status}
                                    </span>
                                </div>
                                {request.reviewNotes && (
                                    <p className="text-sm text-gray-300 mt-2">{request.reviewNotes}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Payment History */}
            <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                    Historial de Pagos ({new Date().getFullYear()})
                </h3>
                {payments.length > 0 ? (
                    <div className="space-y-2">
                        {payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg"
                            >
                                <div>
                                    <p className="text-white font-medium">{formatCurrency(payment.amount)}</p>
                                    <p className="text-xs text-gray-400">{formatDate(payment.date)}</p>
                                </div>
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                                    Pagado
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-4">No hay pagos registrados este año</p>
                )}
            </section>
        </div>
    );
};

export default ProfilePage;
