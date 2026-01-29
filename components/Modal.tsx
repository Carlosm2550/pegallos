
import React from 'react';
import { XIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  size?: 'default' | 'wide';
  headerContent?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'default', headerContent }) => {
  if (!isOpen) return null;

  // Cambiado: 'wide' ahora es mucho más ancho (7xl) para aprovechar pantallas grandes
  const widthClass = size === 'wide' ? 'max-w-7xl' : 'max-w-lg';

  return (
    // Cambiado: Estructura para permitir scroll si el modal es muy alto y evitar corte superior
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-70 transition-opacity" onClick={onClose}></div>
      
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className={`relative bg-gray-800 rounded-2xl shadow-2xl w-full ${widthClass} border border-gray-700 transform transition-all text-left my-8`}>
          <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-800/95 backdrop-blur rounded-t-2xl sticky top-0 z-10">
            <div className="text-xl font-bold text-amber-400 flex items-center flex-grow min-w-0">{title}</div>
            <div className="flex items-center space-x-4 ml-4">
              {headerContent}
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
