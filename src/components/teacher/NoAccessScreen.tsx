import React from 'react';

interface NoAccessScreenProps {
    email: string;
    onLogout: () => void;
}

// Cuenta con sesión iniciada que no es de administración ni tiene acceso de profesor.
const NoAccessScreen: React.FC<NoAccessScreenProps> = ({ email, onLogout }) => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 text-gray-200">
        <div className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-xl p-8 text-center shadow-2xl">
            <p className="text-4xl mb-3" aria-hidden="true">🔒</p>
            <h1 className="text-xl font-bold text-white mb-2">Esta cuenta no tiene acceso</h1>
            <p className="text-sm text-gray-400 mb-1">Has iniciado sesión como</p>
            <p className="text-sm font-mono text-purple-300 mb-4 break-all">{email}</p>
            <p className="text-sm text-gray-400 mb-6">
                Si eres profesor o profesora de Xen Dance Space, pide a la administración que te cree el acceso.
            </p>
            <button
                onClick={onLogout}
                className="w-full min-h-[48px] bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg"
            >
                Cerrar sesión
            </button>
        </div>
    </div>
);

export default NoAccessScreen;
