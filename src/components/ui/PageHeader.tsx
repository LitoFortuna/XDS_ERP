import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

// Cabecera común de las pantallas del ERP. El título nunca se parte por falta de sitio y las
// acciones pasan a una fila propia que se ajusta (flex-wrap) en vez de salirse de la pantalla:
// con las cabeceras antiguas (una sola fila sin wrap) los botones de la derecha -- incluido el
// principal, p. ej. "Añadir alumno" -- quedaban recortados e inalcanzables en móvil.
// En móvil las acciones forman una cuadrícula de 2 columnas: un botón solo ocupa todo el ancho y
// la acción principal puede ir primero y a ancho completo con `order-first col-span-2 md:order-last
// md:col-auto`. Los botones deben llevar `justify-center`.
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon, actions, className = '' }) => (
    <div className={`mb-5 sm:mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${className}`}>
        <div className="flex items-center gap-3 min-w-0">
            {icon}
            <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{title}</h2>
                {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
            </div>
        </div>
        {actions && <div className="grid grid-cols-2 gap-2 [&>:only-child]:col-span-2 md:flex md:flex-wrap md:items-center md:justify-end md:[&>:only-child]:col-auto">{actions}</div>}
    </div>
);

export default PageHeader;
