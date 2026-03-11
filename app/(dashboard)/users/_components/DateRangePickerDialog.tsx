'use client';

import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/_components/ui/dialog';
import { Button } from '@/app/_components/ui/button';
import { Calendar } from '@/app/_components/ui/calendar';

interface DateRangePickerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDateChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  currentRange: { from: Date | undefined; to: Date | undefined };
}

const DateRangePickerDialog = ({
  isOpen,
  onOpenChange,
  onDateChange,
  currentRange,
}: DateRangePickerDialogProps) => {
  const [range, setRange] = useState<DateRange | undefined>(currentRange);

  useEffect(() => {
    setRange(currentRange);
  }, [currentRange]);

  const handleApply = () => {
    if (range) {
      onDateChange({ from: range.from, to: range.to });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Selecione o Período</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            initialFocus
            numberOfMonths={1}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DateRangePickerDialog;
