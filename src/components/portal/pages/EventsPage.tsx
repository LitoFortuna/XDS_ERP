import React from 'react';
import { DanceEvent, DanceClass, Student } from '../../../../types';

interface EventsPageProps {
    student: Student;
    studentEvents: DanceEvent[];
    allClasses: DanceClass[];
}

const EventsPage: React.FC<EventsPageProps> = ({ student, studentEvents, allClasses }) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getWeeklySchedule = () => {
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const schedule: { [key: string]: DanceClass[] } = {};

        // Filter classes to show only enrolled ones
        const enrolledClasses = allClasses.filter(c => student.enrolledClassIds.includes(c.id));

        dayNames.forEach((day) => {
            schedule[day] = enrolledClasses
                .filter((c) => c.days.includes(day))
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
        });

        return schedule;
    };

    const weeklySchedule = getWeeklySchedule();

    return (
        <div className="space-y-6">
            {/* My Events */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                    </svg>
                    Mis Eventos
                </h2>
                {studentEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {studentEvents.map((event) => (
                            <div
                                key={event.id}
                                className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-purple-500/50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold text-lg mb-2">{event.name}</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {formatDate(event.date)}
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center text-sm text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {event.location}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium">
                                        {event.type}
                                    </span>
                                </div>

                                {event.description && (
                                    <p className="text-gray-400 text-sm mb-4">{event.description}</p>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                                    <span className="text-gray-400 text-sm">Tus entradas</span>
                                    <span className="bg-gray-900/50 px-3 py-1 rounded-lg text-white font-bold">
                                        {event.ticketsPerStudent || 1}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
                        <div className="text-5xl mb-3">🎭</div>
                        <p className="text-gray-400">No estás inscrito en ningún evento actualmente</p>
                    </div>
                )}
            </section>

            {/* Weekly Schedule */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Horario Semanal
                </h2>
                <div className="space-y-4">
                    {Object.entries(weeklySchedule).map(([day, classes]) => (
                        <div key={day} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                            <h3 className="text-white font-bold mb-3">{day}</h3>
                            {classes.length > 0 ? (
                                <div className="space-y-2">
                                    {classes.map((danceClass) => (
                                        <div
                                            key={danceClass.id}
                                            className="bg-gray-900/50 p-3 rounded-lg flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="text-white font-medium">{danceClass.name}</p>
                                                <p className="text-sm text-gray-400">{danceClass.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-mono text-sm">
                                                    {danceClass.startTime} - {danceClass.endTime}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No hay clases programadas</p>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default EventsPage;
