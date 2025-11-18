import React from 'react';
import { View } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { UsersIcon } from './icons/UsersIcon';
import { BookIcon } from './icons/BookIcon';
import { IdentificationIcon } from './icons/IdentificationIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { HeartIcon } from './icons/HeartIcon';
import { ShoppingBagIcon } from './icons/ShoppingBagIcon';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen }) => {
  const navItems = [
    { view: View.DASHBOARD, label: 'Dashboard', icon: DashboardIcon },
    { view: View.STUDENTS, label: 'Alumnos', icon: UsersIcon },
    { view: View.CLASSES, label: 'Clases', icon: BookIcon },
    { view: View.INSTRUCTORS, label: 'Profesores', icon: IdentificationIcon },
    { view: View.INTERACTIVE_SCHEDULE, label: 'Horario', icon: CalendarIcon },
    { view: View.NUPTIAL_DANCES, label: 'Bailes Nupciales', icon: HeartIcon },
    { view: View.BILLING, label: 'Facturación', icon: CreditCardIcon },
    { view: View.MERCHANDISING, label: 'Merchandising', icon: ShoppingBagIcon },
    { view: View.DATA_MANAGEMENT, label: 'Gestión de Datos', icon: DatabaseIcon },
  ];

  const handleNavItemClick = (view: View) => {
    setView(view);
    setIsOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 z-20 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-gray-800 shadow-md flex-shrink-0 flex flex-col w-64 z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-700 px-4">
           <h1 className="text-2xl font-bold text-white tracking-wider">Xen Dance Space</h1>
        </div>
        <nav className="flex-1 px-2 py-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.view}>
                <button
                  onClick={() => handleNavItemClick(item.view)}
                  className={`w-full flex items-center px-4 py-2 my-1 rounded-md text-sm font-medium transition-colors duration-150 ${
                    currentView === item.view
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-center text-gray-400">Xen Dance Space | 2026</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;