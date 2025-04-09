
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDays, isAfter } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DateTimeSelectorProps {
  date: Date | undefined;
  time: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
}

export const DateTimeSelector = ({ 
  date, 
  time, 
  onDateChange, 
  onTimeChange 
}: DateTimeSelectorProps) => {
  // Calculate the max date (30 days from now)
  const maxDate = addDays(new Date(), 30);
  
  // Function to validate if selected date is within 30 days
  const validateDate = (selectedDate: Date | undefined): boolean => {
    if (!selectedDate) return true;
    return !isAfter(selectedDate, maxDate);
  };
  
  // Handle date change with validation
  const handleDateChange = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium block mb-2">Reveal Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-background backdrop-blur-sm" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              disabled={(day) => isAfter(day, maxDate)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        {date && !validateDate(date) && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>Set a reveal date within 30 days!</AlertDescription>
          </Alert>
        )}
      </div>
      
      <div>
        <label className="text-sm font-medium block mb-2">Reveal Time</label>
        <Input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
        />
      </div>
    </div>
  );
};
