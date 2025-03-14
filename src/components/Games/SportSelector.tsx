import React, { useState, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Sports, Sort, SportSelectorProps, ChevronButtonProps } from "./types";
import { getDateString } from "../../helpers";

const SportSelector: React.FC<SportSelectorProps> = ({ props }) => {
  const { selectedSports, setSelectedSports, selectedDate, setSelectedDate, sortBy, setSortBy } = props;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const today = getDateString(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSportChange = useCallback(
    (sport: Sports) => {
      setSelectedSports(
        (prev) =>
          prev.includes(sport)
            ? prev.filter((item) => item !== sport) 
            : [...prev, sport] 
      );
    },
    [setSelectedSports]
  );

  const handleDateChange = useCallback(
    (date: Date) => {
      if (getDateString(date) < today) return;
      if (getDateString(date) === getDateString(selectedDate)) return;
      
      setSelectedDate(date);
    },
    [setSelectedDate, selectedDate, today]
  );

  const changeMonth = useCallback((direction: number) => {
    setCurrentMonth(prevMonth => new Date(prevMonth.getFullYear(), prevMonth.getMonth() + direction, 1));
  }, []);

  // Generate calendar days for the current month view
  const generateCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week of first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Total days in month
    const daysInMonth = lastDay.getDate();
    
    // Array to hold all calendar days
    const days: Array<{ date: Date, isCurrentMonth: boolean }> = [];
    
    // Add days from previous month to fill the first week
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonthDay = prevMonthLastDay - firstDayOfWeek + i + 1;
      days.push({ 
        date: new Date(year, month - 1, prevMonthDay),
        isCurrentMonth: false 
      });
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ 
        date: new Date(year, month, i),
        isCurrentMonth: true 
      });
    }
    
    // Add days from next month to complete the last week
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push({ 
          date: new Date(year, month + 1, i),
          isCurrentMonth: false 
        });
      }
    }
    
    return days;
  }, [currentMonth]);

  // Function to get display name for each sport
  const getSportDisplayName = (sport: Sports): string => {
    switch (sport) {
      case Sports.NBA:
        return "NBA";
      case Sports.NCAAMBB:
        return "NCAA Men's Basketball";
      default:
        return sport;
    }
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentMonthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className={`flex flex-col p-4 ml-20 bg-white rounded-lg shadow-sm w-[20vw]`}>
      {/* Selected date display */}
      <div className="bg-blue-50 p-2 rounded-lg mb-6 text-center">
        <p className="text-sm text-gray-600">Selected Date:</p>
        <p className="font-bold text-blue-700">
          {selectedDate.toLocaleDateString("en-US", {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>

      {/* Calendar month selector */}
      <div className="mb-6">
        <div className="flex flex-row items-center justify-between mb-4">
          <ChevronButton
            onClick={() => changeMonth(-1)}
            direction="left"
            blocked={currentMonth.getFullYear() === new Date().getFullYear() && 
                    currentMonth.getMonth() === new Date().getMonth()}
          />
          <span className="font-bold">{currentMonthName}</span>
          <ChevronButton onClick={() => changeMonth(1)} direction="right" />
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="text-xs font-semibold text-gray-500 py-1">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const dateStr = getDateString(day.date);
            const isToday = dateStr === today;
            const isSelected = dateStr === getDateString(selectedDate);
            const isPastDate = dateStr < today;
            
            return (
              <button
                key={index}
                className={`p-1 rounded-full text-xs h-7 w-7 flex items-center justify-center
                  ${!day.isCurrentMonth ? "text-gray-300" : isPastDate ? "text-gray-400" : ""}
                  ${isSelected ? "bg-blue-600 text-white" : ""}
                  ${isToday && !isSelected ? "border border-blue-600" : ""}
                  ${isPastDate ? "text-gray-300 cursor-not-allowed" : ""}
                  ${!day.isCurrentMonth ? "opacity-0" : ""}
                  ${!isPastDate && day.isCurrentMonth ? "hover:bg-blue-100" : ""}`}
                onClick={() => day.isCurrentMonth && !isPastDate && handleDateChange(day.date)}
                disabled={isPastDate || !day.isCurrentMonth}
              >
                {day.date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort selector */}
      <div className="w-full flex justify-between items-center relative mb-6">
        <p className="font-sans text-sm">Sort games by:</p>
        <div className="relative" ref={dropdownRef}>
          <button
            className="bg-transparent border-none font-bold cursor-pointer flex items-center text-sm gap-0.5 text-blue-600"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {sortBy}
            <ChevronDown
              className={`text-gray-700 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              size={16}
            />
          </button>
          {isDropdownOpen && (
            <ul className="absolute right-0 bg-white border border-gray-300 rounded-lg mt-1 list-none shadow-md z-50 py-2 px-2 flex flex-col gap-2 w-[7rem]">
              {Object.entries(Sort).map(([key, value]) => (
                <li
                  key={key}
                  className="cursor-pointer hover:text-blue-600 hover:font-bold"
                  onClick={() => {
                    setSortBy(value);
                    setIsDropdownOpen(false);
                  }}
                >
                  {value}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>


      {/* Sports selector */}
      <h2 className="text-lg font-semibold mb-3">Select Sports</h2>
      <div className="flex flex-col gap-3 mb-6">
        {Object.values(Sports).map((sport) => (
          <button
            key={sport}
            className={`p-3 cursor-pointer box-border border rounded-lg flex items-center gap-2 transition-colors
              ${selectedSports.includes(sport)
                ? "border-2 border-blue-600 text-blue-600 bg-blue-50"
                : "border border-gray-300 hover:border-blue-600"}`}
            onClick={() => handleSportChange(sport)}
          >
            <img
              className="w-10 h-10"
              src={`i/leaguelogos/${sport}.png`}
              alt={`${sport} logo`}
            />
            <span className="font-medium">{getSportDisplayName(sport)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ChevronButton: React.FC<ChevronButtonProps> = ({ onClick, direction, blocked }) => (
  <button
    className={`bg-transparent border-none w-8 h-8 flex justify-center items-center rounded-full hover:bg-gray-100
      ${blocked ? "text-gray-400 cursor-not-allowed" : "hover:text-blue-600 cursor-pointer"}`}
    onClick={onClick}
    disabled={blocked}
  >
    {direction === "left" ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
  </button>
);

export default SportSelector;