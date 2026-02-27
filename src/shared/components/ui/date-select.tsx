'use client';

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { Label } from "./label";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { cn } from "@/shared/lib/utils";
import "react-day-picker/style.css";
import { createPortal } from "react-dom";

interface DateSelectProps {
  label?: string;
  id?: string;
  name?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  className?: string;
  labelClassName?: string;
  triggerClassName?: string;
  yearRange?: 'past' | 'future';
}

export function DateSelect({
  label,
  id,
  name,
  value,
  onChange,
  placeholder = "Select date",
  required = false,
  min,
  max,
  className,
  labelClassName,
  triggerClassName,
  yearRange = 'past',
}: DateSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(value || new Date());
  const [portalRoot, setPortalRoot] = React.useState<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    setPortalRoot(root);
    return () => {
      document.body.removeChild(root);
    };
  }, []);

  React.useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
  }, [open]);

  React.useLayoutEffect(() => {
    if (!open) return;
    const scrollToTrigger = () => {
      triggerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    };
    const id = window.setTimeout(scrollToTrigger, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const currentYear = new Date().getFullYear();
  const years = yearRange === 'future' 
    ? Array.from({ length: 20 }, (_, i) => currentYear + i)
    : Array.from({ length: 120 }, (_, i) => currentYear - i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = new Date(month);
    newMonth.setMonth(parseInt(monthIndex));
    setMonth(newMonth);
  };

  const handleYearChange = (year: string) => {
    const newMonth = new Date(month);
    newMonth.setFullYear(parseInt(year));
    setMonth(newMonth);
  };

  const overlay =
    portalRoot && open
      ? createPortal(
          <div className="date-picker-popup fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
            <div
              className="absolute inset-0 bg-black/60"
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <div className="relative z-10 w-fit rounded-2xl border border-white/20 bg-gray-900/95 backdrop-blur-md p-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex flex-wrap gap-2 mb-3 justify-between">
                <Select value={month.getMonth().toString()} onValueChange={handleMonthChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white min-w-30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20 text-white max-h-55">
                    {months.map((m, idx) => (
                      <SelectItem key={idx} value={idx.toString()} className="text-white hover:bg-white/10">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={month.getFullYear().toString()} onValueChange={handleYearChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white min-w-30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20 text-white max-h-55">
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()} className="text-white hover:bg-white/10">
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DayPicker
                mode="single"
                selected={value}
                onSelect={(date) => {
                  onChange?.(date);
                  setOpen(false);
                }}
                month={month}
                onMonthChange={setMonth}
                className="dark-calendar"
              />
            </div>
          </div>,
          portalRoot
        )
      : null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <Label htmlFor={id} className={labelClassName}>{label}</Label>}
      <div className="relative">
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          className={cn(
            "date-picker-button w-full justify-start text-left font-normal bg-white/5 border-white/10 hover:bg-white/10",
            value ? "text-white" : "text-white/60",
            triggerClassName
          )}
          onClick={() => setOpen((prev) => !prev)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
        {overlay}
      </div>
      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          id={id}
          name={name}
          value={value ? value.toISOString().split('T')[0] : ''}
          required={required}
        />
      )}
      <style jsx global>{`
        .dark-calendar {
          color: white;
        }
        .dark-calendar .rdp-root {
          /* Updated accent color variable to transparent to prevent default fills */
          --rdp-accent-color: transparent;
          --rdp-background-color: rgba(255, 255, 255, 0.1);
          --rdp-outline: 2px solid white;
        }
        .dark-calendar .rdp-month_caption {
          display: none;
        }
        .dark-calendar .rdp-nav {
          display: none;
        }
        .dark-calendar .rdp-weekday {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.875rem;
          font-weight: 500;
        }
        .dark-calendar .rdp-day {
          color: white;
        }
        .dark-calendar .rdp-day_button {
          border-radius: 0.375rem;
          border: 2px solid transparent; /* Reserve space for border to prevent layout shift */
        }
        .dark-calendar .rdp-day_button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .dark-calendar .rdp-day_button:focus-visible {
          outline: 2px solid white;
          outline-offset: 2px;
        }
        /* --- CHANGED SELECTED STYLE HERE --- */
        .dark-calendar .rdp-day_selected .rdp-day_button {
          background-color: transparent !important; /* Remove solid fill */
          border: 2px solid #a855f7 !important;     /* Add Purple Border (Tailwind purple-500) */
          color: white !important;                  /* Keep text white */
          font-weight: 600;
        }
        .dark-calendar .rdp-day_today {
          font-weight: 600;
        }
        .dark-calendar .rdp-day_outside {
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}