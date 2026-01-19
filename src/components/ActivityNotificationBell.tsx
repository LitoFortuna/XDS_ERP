
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { markAllActivitiesAsRead } from '../services/domain/activityLogService';

const ActivityNotificationBell: React.FC = () => {
    const { activityLogs, userProfile } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);

    // Only SuperAdmins see this component
    if (!userProfile || userProfile.role !== 'SuperAdmin' || activityLogs.length === 0) {
        return null;
    }

    const handleMarkAllRead = async () => {
        await markAllActivitiesAsRead(activityLogs);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                title="Notificaciones de Actividad"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {activityLogs.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                        {activityLogs.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="p-3 bg-gray-700/50 border-b border-gray-600 flex justify-between items-center">
                        <h3 className="text-white font-bold text-sm">Actividad Reciente</h3>
                        <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] text-purple-400 hover:text-purple-300 font-bold uppercase"
                        >
                            Marcar leídas
                        </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {activityLogs.map((log) => (
                            <div key={log.id} className="p-3 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${log.type === 'payment' ? 'bg-green-500/20 text-green-400' :
                                            log.type === 'cost' ? 'bg-red-500/20 text-red-400' :
                                                'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {log.type === 'payment' ? '💰' :
                                            log.type === 'cost' ? '📤' :
                                                '📋'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm leading-tight truncate">{log.description}</p>
                                        <p className="text-gray-500 text-[10px] mt-1">
                                            {log.actorEmail} · {new Date(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityNotificationBell;
