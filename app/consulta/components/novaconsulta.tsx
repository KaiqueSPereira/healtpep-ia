"use client";
import { Button } from "@/app/_components/ui/button";
import { Calendar } from "@/app/_components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/app/_components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/_components/ui/sheet";
import { ptBR } from "date-fns/locale";
import { Check, ChevronsUpDown } from "lucide-react";
import React, { useEffect } from "react";
import { useState } from "react";

const TIME_LIST = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
];

const NovaConsulta = () => {
  useEffect(() => {
    async function fetchConsultaTipos() {
      const response = await fetch("/api/consultas/type");
      const data = await response.json();
      setConsultaTipos(data);
    }

    fetchConsultaTipos();
  }, []);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined,);
  const [consultaTipos, setConsultaTipos] = useState<string[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<string | undefined>(undefined,);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDay(date);
  };

  const handleTimeSelect = (time: string | undefined) => {
    setSelectedTime(time);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSelectedTime(undefined); 
  };
   const handleTipoSelect = (tipo: string) => {
     setSelectedTipo(tipo);
     setOpen(false); 
   };
  return (
    <div>
      <Sheet>
        <SheetTrigger asChild>
          <Button>Nova Consulta</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nova Consulta</SheetTitle>
          </SheetHeader>
          <div className="border-b border-solid py-5">
            <Calendar
              mode="single"
              locale={ptBR}
              selected={selectedDay}
              onSelect={handleDateSelect}
              styles={{
                head_cell: {
                  width: "100%",
                  textTransform: "capitalize",
                },
                caption: {
                  textTransform: "capitalize",
                },
              }}
            />
          </div>
          {selectedDay && (
            <div className="flex flex-col gap-3 p-5">
              <div className="flex gap-3 overflow-auto [&::-webkit-scrollbar]:hidden">
                {TIME_LIST.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => handleTimeSelect(time)}
                    disabled={inputValue !== ""} // Desabilita os botões se o input não estiver vazio
                  >
                    {time}
                  </Button>
                ))}
              </div>
              <input
                type="time"
                placeholder="Digite a hora"
                className="rounded border bg-black p-2 text-white"
                onChange={handleInputChange}
                value={inputValue}
              />
            </div>
          )}
          <div>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-[200px] justify-between"
                >
                  {selectedTipo || "Select tipo..."}
                  <Check className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <div>
                  {consultaTipos.map((tipo) => (
                    <Button
                      key={tipo}
                      onClick={() => handleTipoSelect(tipo)}
                      variant={selectedTipo === tipo ? "default" : "outline"}
                      className="w-full p-2 text-left"
                    >
                      {tipo}
                      {selectedTipo === tipo && (
                        <Check className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};


export default NovaConsulta;
