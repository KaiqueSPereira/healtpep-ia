'use client';

import Link from 'next/link';
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { ExameTypeFilter } from "./ExameTypeFilter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/_components/ui/tooltip";
import { List, LineChart, Plus, ChevronsLeft, Calendar, Beaker, ClipboardList } from "lucide-react";
import { cn } from '@/app/_lib/utils';

interface ExameSidebarProps {
  currentView: 'list' | 'charts';
  onViewChange: (view: 'list' | 'charts') => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  listFilterOptions: string[];
  selectedListTypes: string[];
  onListTypeChange: (types: string[]) => void;
  selectedChartType: 'Sangue' | 'Urina';
  onChartTypeChange: (type: 'Sangue' | 'Urina') => void;
  chartComponentOptions: string[];
  selectedChartComponents: string[];
  onChartComponentChange: (components: string[]) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  listStatusFilter: 'todos' | 'agendados' | 'realizados' | 'pendentes';
  onListStatusFilterChange: (filter: 'todos' | 'agendados' | 'realizados' | 'pendentes') => void;
}

export const ExameSidebar: React.FC<ExameSidebarProps> = ({
  currentView,
  onViewChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  listFilterOptions,
  selectedListTypes,
  onListTypeChange,
  selectedChartType,
  onChartTypeChange,
  chartComponentOptions,
  selectedChartComponents,
  onChartComponentChange,
  isCollapsed,
  setIsCollapsed,
  listStatusFilter,
  onListStatusFilterChange
}) => {

  const statusFilters: { key: 'todos' | 'agendados' | 'realizados' | 'pendentes', label: string, icon: React.ElementType }[] = [
    { key: 'todos', label: 'Todos', icon: ClipboardList },
    { key: 'agendados', label: 'Agendados', icon: Calendar },
    { key: 'realizados', label: 'Realizados', icon: Beaker },
    { key: 'pendentes', label: 'Pendentes', icon: List },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
          "flex-shrink-0 bg-background transition-all duration-300 ease-in-out border-r",
          isCollapsed ? "w-[80px]" : "w-[300px]"
      )}>
          <div className={cn("flex flex-col h-full p-4", {"items-center": isCollapsed})}>
              <div className={cn("flex items-center w-full", isCollapsed ? "justify-center" : "justify-between")}>
                  {!isCollapsed && <span className='text-lg font-semibold'>Filtros</span>}
                  <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
                      <ChevronsLeft className={cn("h-5 w-5 transition-transform", { "rotate-180": isCollapsed })} />
                  </Button>
              </div>

              <div className="mt-6 w-full">
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Link href="/exames/novo">
                              <Button variant="ghost" size={isCollapsed ? "icon" : "default"} className={cn("w-full text-red-500", isCollapsed ? "justify-center" : "justify-start")}>
                                  <Plus className={cn("h-5 w-5", { "mr-2": !isCollapsed })} />
                                  {!isCollapsed && "Novo Exame"}
                              </Button>
                          </Link>
                      </TooltipTrigger>
                      {isCollapsed && (
                          <TooltipContent side="right">
                              <p>Novo Exame</p>
                          </TooltipContent>
                      )}
                  </Tooltip>
              </div>

              <div className="mt-8 w-full">
                  {!isCollapsed && <h3 className="text-md font-semibold mb-3">Visualização</h3>}
                  <div className="space-y-2 flex flex-col items-center">
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size={isCollapsed ? "icon" : "default"} onClick={() => onViewChange('list')} className={cn("w-full", isCollapsed ? "justify-center" : "justify-start", { "text-red-500": currentView === 'list' })}>
                                  <List className={cn("h-4 w-4", { "mr-2": !isCollapsed })} />
                                  {!isCollapsed && "Lista"}
                              </Button>
                          </TooltipTrigger>
                          {isCollapsed && (
                              <TooltipContent side="right">
                                  <p>Lista</p>
                              </TooltipContent>
                          )}
                      </Tooltip>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size={isCollapsed ? "icon" : "default"} onClick={() => onViewChange('charts')} className={cn("w-full", isCollapsed ? "justify-center" : "justify-start", { "text-red-500": currentView === 'charts' })}>
                                  <LineChart className={cn("h-4 w-4", { "mr-2": !isCollapsed })} />
                                  {!isCollapsed && "Gráficos"}
                              </Button>
                          </TooltipTrigger>
                          {isCollapsed && (
                              <TooltipContent side="right">
                                  <p>Gráficos</p>
                              </TooltipContent>
                          )}
                      </Tooltip>
                  </div>
              </div>

              {!isCollapsed && (
                <div className="flex flex-col gap-8 mt-8 w-full flex-1 overflow-y-auto pr-2">
                  {currentView === 'list' && (
                    <div>
                      <h3 className="text-md font-semibold mb-3">Estado</h3>
                      <div className="space-y-2">
                        {statusFilters.map(({ key, label, icon: Icon }) => (
                          <Button 
                            key={key} 
                            variant={listStatusFilter === key ? 'secondary' : 'ghost'} 
                            onClick={() => onListStatusFilterChange(key)} 
                            className="w-full justify-start">
                              <Icon className="h-4 w-4 mr-2"/>
                              {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                      <h3 className="text-md font-semibold mb-3">Período</h3>
                      <div className="space-y-3">
                          <Input type="date" id="startDate" value={startDate} onChange={e => onStartDateChange(e.target.value)} aria-label="Data Inicial"/>
                          <Input type="date" id="endDate" value={endDate} onChange={e => onEndDateChange(e.target.value)} aria-label="Data Final"/>
                      </div>
                  </div>

                  <div>
                      <h3 className="text-md font-semibold mb-3">Filtros Avançados</h3>
                      {currentView === 'list' && listFilterOptions.length > 0 && (
                            <ExameTypeFilter allTypes={listFilterOptions} selectedTypes={selectedListTypes} onTypeChange={onListTypeChange} />
                      )}
                      {currentView === 'charts' && (
                          <div className="space-y-4">
                              <div>
                                  <h4 className="text-sm font-medium mb-2">Tipo de Exame</h4>
                                  <div className="flex items-center gap-2">
                                      <Button variant={selectedChartType === 'Sangue' ? 'secondary' : 'ghost'} onClick={() => onChartTypeChange('Sangue')} className="flex-1">Sangue</Button>
                                      <Button variant={selectedChartType === 'Urina' ? 'secondary' : 'ghost'} onClick={() => onChartTypeChange('Urina')} className="flex-1">Urina</Button>
                                  </div>
                              </div>
                              {chartComponentOptions.length > 0 && (
                                  <div>
                                      <h4 className="text-sm font-medium mb-2">Componentes</h4>
                                      <ExameTypeFilter allTypes={chartComponentOptions} selectedTypes={selectedChartComponents} onTypeChange={onChartComponentChange} />
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
                </div>
              )}
          </div>
      </aside>
    </TooltipProvider>
  );
};