
import React, { useEffect, useId, useRef, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'xl';
}

const openModals: object[] = [];

// Cierra con Escape. Con varios diálogos apilados (p.ej. una confirmación sobre un formulario)
// solo reacciona el de arriba, el último que se abrió.
export const useEscapeToClose = (onClose: () => void) => {
  const token = useRef<object>({});
  useEffect(() => {
    const mine = token.current;
    openModals.push(mine);
    return () => { openModals.splice(openModals.indexOf(mine), 1); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openModals[openModals.length - 1] === token.current) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
};

// En móvil se muestra como hoja que sube desde abajo (se maneja con el pulgar y deja ver la
// pantalla de fondo); desde `sm` es un diálogo centrado. Se monta solo mientras está abierto, así
// la animación de entrada se reproduce cada vez. Cierra con Escape o pulsando el fondo.
const OpenModal: React.FC<Omit<ModalProps, 'isOpen'>> = ({ onClose, title, children, size = 'md' }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const mouseDownTarget = useRef<EventTarget | null>(null);
  const titleId = useId();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEscapeToClose(onClose);

  // Capturamos dónde empieza el clic
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownTarget.current = e.target;
  };

  // Solo cerramos si el clic EMPEZÓ y TERMINÓ en el fondo oscuro (overlay)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && mouseDownTarget.current === overlayRef.current) {
      onClose();
    }
    // Reseteamos el target para evitar estados inconsistentes
    mouseDownTarget.current = null;
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end sm:items-center"
      onMouseDown={handleMouseDown}
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-gray-800 shadow-xl w-full sm:m-4 rounded-t-2xl sm:rounded-lg flex flex-col max-h-[92dvh] sm:max-h-[90vh] transition-transform duration-200 ease-out motion-reduce:transition-none ${entered ? 'translate-y-0' : 'translate-y-full sm:translate-y-0'} ${size === 'xl' ? 'sm:max-w-5xl' : 'sm:max-w-2xl'}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()} // Importante: evita que el clic inicial dentro del modal se registre en el overlay
      >
        <div className="sm:hidden pt-2 flex justify-center flex-shrink-0" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-gray-600" />
        </div>
        <div className="flex justify-between items-center px-4 py-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
          <h3 id={titleId} className="text-lg sm:text-xl font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-gray-400 bg-transparent hover:bg-gray-700 hover:text-white rounded-lg text-sm p-2.5 sm:p-1.5 -mr-1.5 sm:mr-0 ml-auto inline-flex items-center"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>
        <div className="p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6 overflow-y-auto overscroll-contain min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
};

const Modal: React.FC<ModalProps> = ({ isOpen, ...rest }) => {
  if (!isOpen) return null;
  return <OpenModal {...rest} />;
};

export default Modal;
