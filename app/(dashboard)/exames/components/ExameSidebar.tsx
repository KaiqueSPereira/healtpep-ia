'use client';

import Link from 'next/link';
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { ExameTypeFilter } from "./ExameTypeFilter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/_components/ui/tooltip";
import { List, LineChart, Plus, ChevronsLeft, Calendar, Beaker, ClipboardList } from "lucide-react";
import { cn } from '@/app/_lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/app/_components/ui/dropdown-menu";

interface ExameSidebarProps {
  currentView: 'list' | 'charts';
  onViewChange: (view: 'list' | 'charts') => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  examTypeOptions: string[];
  selectedExamTypes: string[];
  onExamTypeChange: (types: string[]) => void;
  chartCategoryOptions: string[];
  selectedChartCategory: string;
  onChartCategoryChange: (category: string) => void;
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
  examTypeOptions,
  selectedExamTypes,
  onExamTypeChange,
  chartCategoryOptions,
  selectedChartCategory,
  onChartCategoryChange,
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
                          {isCollapsed && (<TooltipContent side="right"><p>Lista</p></TooltipContent>)}
                      </Tooltip>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size={isCollapsed ? "icon" : "default"} onClick={() => onViewChange('charts')} className={cn("w-full", isCollapsed ? "justify-center" : "justify-start", { "text-red-500": currentView === 'charts' })}>
                                  <LineChart className={cn("h-4 w-4", { "mr-2": !isCollapsed })} />
                                  {!isCollapsed && "Gráficos"}
                              </Button>
                          </TooltipTrigger>
                          {isCollapsed && (<TooltipContent side="right"><p>Gráficos</p></TooltipContent>)}
                      </Tooltip>
                  </div>
              </div>

              {!isCollapsed && (
                <div className="flex flex-col gap-8 mt-8 w-full flex-1 overflow-y-auto pr-2">
                  
                  <div>
                      <h3 className="text-md font-semibold mb-3">Filtros Gerais</h3>
                      <div className="space-y-3">
                          <div>
                              <h4 className="text-sm font-medium mb-2">Período</h4>
                              <Input type="date" id="startDate" value={startDate} onChange={e => onStartDateChange(e.target.value)} aria-label="Data Inicial"/>
                              <Input type="date" id="endDate" className='mt-2' value={endDate} onChange={e => onEndDateChange(e.target.value)} aria-label="Data Final"/>
                          </div>
                          {examTypeOptions.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium mb-2 mt-4">Tipo de Exame</h4>
                                <ExameTypeFilter allTypes={examTypeOptions} selectedTypes={selectedExamTypes} onTypeChange={onExamTypeChange} title="Filtrar por Tipo" />
                            </div>
                          )}
                      </div>
                  </div>

                  {currentView === 'list' && (
                    <div>
                      <h3 className="text-md font-semibold mb-3">Filtros de Lista</h3>
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

                  {currentView === 'charts' && (
                      <div>
                          <h3 className="text-md font-semibold mb-3">Filtros de Gráfico</h3>
                          <div className="space-y-4">
                              {chartCategoryOptions.length > 1 && (
                                  <div>
                                      <h4 className="text-sm font-medium mb-2">Categoria do Biomarcador</h4>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="outline" className="w-full justify-start">
                                            {selectedChartCategory}
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                          <DropdownMenuRadioGroup value={selectedChartCategory} onValueChange={onChartCategoryChange}>
                                            {chartCategoryOptions.map(category => (
                                              <DropdownMenuRadioItem key={category} value={category}>
                                                {category}
                                              </DropdownMenuRadioItem>
                                            ))}
                                          </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                  </div>
                              )}

                              {chartComponentOptions.length > 0 && (
                                  <div>
                                      <h4 className="text-sm font-medium mb-2">Biomarcadores</h4>
                                      <ExameTypeFilter allTypes={chartComponentOptions} selectedTypes={selectedChartComponents} onTypeChange={onChartComponentChange} title="Filtrar Biomarcadores"/>
                                  </div>
                              )}
                          </div>
                      </div>
                  )}
                </div>
              )}
          </div>
      </aside>
    </TooltipProvider>
  );
};