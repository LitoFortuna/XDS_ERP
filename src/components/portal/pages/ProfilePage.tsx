import React from 'react';
import { Student, DanceClass, ChangeRequest } from '../../../../types';

interface ProfilePageProps {
    student: Student;
    allClasses: DanceClass[];
    changeRequests: ChangeRequest[];
    onRequestChange: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
    student,
    allClasses,
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

            {/* Enrolled Classes */}
            <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                    Mis Clases
                </h3>
                {allClasses.filter(c => student.enrolledClassIds.includes(c.id)).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allClasses.filter(c => student.enrolledClassIds.includes(c.id)).map((danceClass) => (
                            <div
                                key={danceClass.id}
                                className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white">{danceClass.name}</h4>
                                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                                        {danceClass.days.join(', ')}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-400 space-y-1">
                                    <p className="flex items-center">
                                        <span className="mr-2">🕒</span>
                                        {danceClass.startTime} - {danceClass.endTime}
                                    </p>
                                    <p className="flex items-center">
                                        <span className="mr-2">🏷️</span>
                                        {danceClass.category}
                                    </p>
                                    <p className="flex items-center">
                                        <span className="mr-2">👨‍🏫</span>
                                        {danceClass.instructorName}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-4">No estás inscrito en ninguna clase</p>
                )}
            </section>
        </div>
    );
};

export default ProfilePage;
