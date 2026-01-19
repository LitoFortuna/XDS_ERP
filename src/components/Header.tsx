import React from 'react';
import ActivityNotificationBell from './ActivityNotificationBell';

interface HeaderProps {
  setIsOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setIsOpen }) => {
  return (
    <header className="lg:hidden bg-gray-800 border-b border-gray-700 p-4 flex items-center h-16 sticky top-0 z-10">
      <button onClick={() => setIsOpen(true)} className="text-gray-300 hover:text-white p-2 rounded-md -ml-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex-grow flex justify-center">
        <h1 className="text-xl font-bold text-white tracking-wider">Xen Dance Space</h1>
      </div>
      <ActivityNotificationBell />
    </header>
  );
};

export default Header;
