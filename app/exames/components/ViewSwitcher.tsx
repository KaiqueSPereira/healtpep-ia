import React from 'react';
import { Button } from "@/app/_components/ui/button"; // Use Button from Shadcn/ui


interface ViewSwitcherProps {
  currentView: 'list' | 'charts';
  onViewChange: (view: 'list' | 'charts') => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  // Using Shadcn/ui Button variants for styling
  return (
    <div className="flex space-x-2"> {/* Adjusted spacing */}
      <Button
        variant={currentView === 'list' ? "default" : "outline"} // Use default or outline variant
        onClick={() => onViewChange('list')}
      >
        Todos os Exames
      </Button>
      <Button
        variant={currentView === 'charts' ? "default" : "outline"} // Use default or outline variant
        onClick={() => onViewChange('charts')}
      >
        Gráficos de Exames
      </Button>
    </div>
  );
};

export default ViewSwitcher;
