import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface YearMonthPickerProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  fromYear?: number;
  toYear?: number;
  className?: string;
}

export function YearMonthPicker({
  selected,
  onSelect,
  disabled,
  fromYear = 1980,
  toYear = new Date().getFullYear(),
  className,
}: YearMonthPickerProps) {
  const [currentYear, setCurrentYear] = React.useState(
    selected ? selected.getFullYear() : new Date().getFullYear()
  );
  const [currentMonth, setCurrentMonth] = React.useState(
    selected ? selected.getMonth() : new Date().getMonth()
  );

  const selectedDate = selected
    ? new Date(selected.getFullYear(), selected.getMonth(), 1)
    : undefined;

  const handleYearChange = (year: number) => {
    setCurrentYear(year);
    const newDate = new Date(year, currentMonth, 1);
    if (!disabled || !disabled(newDate)) {
      onSelect?.(newDate);
    }
  };

  const handleMonthChange = (month: number) => {
    setCurrentMonth(month);
    const newDate = new Date(currentYear, month, 1);
    if (!disabled || !disabled(newDate)) {
      onSelect?.(newDate);
    }
  };

  const handleYearPrev = () => {
    if (currentYear > fromYear) {
      const newYear = currentYear - 1;
      setCurrentYear(newYear);
      const newDate = new Date(newYear, currentMonth, 1);
      if (!disabled || !disabled(newDate)) {
        onSelect?.(newDate);
      }
    }
  };

  const handleYearNext = () => {
    if (currentYear < toYear) {
      const newYear = currentYear + 1;
      setCurrentYear(newYear);
      const newDate = new Date(newYear, currentMonth, 1);
      if (!disabled || !disabled(newDate)) {
        onSelect?.(newDate);
      }
    }
  };

  const months = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ];

  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i);

  // 현재 선택된 날짜가 변경되면 내부 상태 업데이트
  React.useEffect(() => {
    if (selected) {
      setCurrentYear(selected.getFullYear());
      setCurrentMonth(selected.getMonth());
    }
  }, [selected]);

  return (
    <div className={cn("p-4 space-y-4 min-w-[280px]", className)}>
      {/* 연도 선택 헤더 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleYearPrev}
          disabled={currentYear <= fromYear}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <Button
            variant="ghost"
            className="text-base font-semibold hover:bg-accent px-4 py-2"
            onClick={() => {
              // 연도 선택을 위한 드롭다운 또는 모달을 여기서 구현할 수 있음
              // 현재는 클릭해도 동작하지 않지만, 필요시 확장 가능
            }}
          >
            {currentYear}년
          </Button>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleYearNext}
          disabled={currentYear >= toYear}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 연도 선택 드롭다운 (선택적) */}
      <div className="flex justify-center">
        <select
          value={currentYear}
          onChange={(e) => handleYearChange(Number(e.target.value))}
          className="text-sm font-medium bg-background border border-input rounded-md px-3 py-1.5 cursor-pointer text-foreground hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}년
            </option>
          ))}
        </select>
      </div>

      {/* 월 선택 그리드 */}
      <div className="grid grid-cols-3 gap-2">
        {months.map((month, index) => {
          const monthDate = new Date(currentYear, index, 1);
          const isDisabled = disabled ? disabled(monthDate) : false;
          const isSelected =
            selectedDate &&
            selectedDate.getFullYear() === currentYear &&
            selectedDate.getMonth() === index;

          return (
            <Button
              key={index}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "h-10 text-sm font-medium",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                !isSelected && "hover:bg-accent",
                isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
              )}
              onClick={() => !isDisabled && handleMonthChange(index)}
              disabled={isDisabled}
            >
              {month}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
