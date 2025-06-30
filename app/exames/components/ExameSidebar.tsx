// components/ExameSidebar.tsx
import React from 'react';

interface ExameSidebarProps {
  onSelectExameType: (type: string | null) => void;
  selectedExameType: string | null;
}

const ExameSidebar: React.FC<ExameSidebarProps> = ({ onSelectExameType, selectedExameType }) => {
  return (
    <div className="w-1/4 p-4 border-r"> {/* Adicione classes de estilo conforme necessário */}
      <h3 className="text-lg font-bold mb-4">Tipos de Exame</h3>
      <ul>
        <li
          className={`cursor-pointer py-2 ${selectedExameType === null ? 'font-bold' : ''}`}
          onClick={() => onSelectExameType(null)}
        >
          Todos
        </li>
        <li
          className={`cursor-pointer py-2 ${selectedExameType === 'Sangue' ? 'font-bold' : ''}`}
          onClick={() => onSelectExameType('Sangue')}
        >
          Sangue
        </li>
        <li
          className={`cursor-pointer py-2 ${selectedExameType === 'Urina' ? 'font-bold' : ''}`}
          onClick={() => onSelectExameType('Urina')}
        >
          Urina
        </li>
        {/* Adicione outros tipos de exame conforme necessário */}
      </ul>
    </div>
  );
};

export default ExameSidebar;
