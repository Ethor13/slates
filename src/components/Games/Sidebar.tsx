import React, { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Sports, SportSelectorProps, ChevronButtonProps } from "./types";
import { getDateString } from "../../helpers";
import { useAuth } from "../../contexts/AuthContext";

const SportSelector: React.FC<SportSelectorProps> = ({ props }) => {
  const { selectedSports, setSelectedSports, selectedDate, setSelectedDate, setGamesLoading, sidebarOpen, setSidebarOpen } = props;
  const { userPreferences, updateUserPreferences } = useAuth();
  const today = getDateString(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

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

      setGamesLoading(true);
      setSelectedDate(date);
    },
    [setSelectedDate, setGamesLoading, selectedDate, today]
  );

  const changeMonth = useCallback((direction: number) => {
    setCurrentMonth(prevMonth => new Date(prevMonth.getFullYear(), prevMonth.getMonth() + direction, 1));
  }, []);

  const toggleShowOnlyAvailableBroadcasts = useCallback(() => {
    updateUserPreferences({ showOnlyAvailableBroadcasts: !userPreferences.showOnlyAvailableBroadcasts });
  }, [userPreferences.showOnlyAvailableBroadcasts, updateUserPreferences]);

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
        return "NCAAMBB";
      case Sports.MLB:
        return "MLB";
      case Sports.NHL:
        return "NHL";
      case Sports.NFL:
        return "NFL";
      case Sports.NCAAF:
        return "NCAAF";
      default:
        return sport;
    }
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentMonthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className={`fixed left-0 top-20 bottom-0 w-full md:w-[15rem] z-40 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="flex flex-col h-full top-4 bottom-0">
        {/* Close button - only visible on mobile */}
        {setSidebarOpen && (
          <button
            className="md:hidden absolute top-4 right-4 p-2 rounded-full bg-slate-light hover:bg-slate-deep transition-colors duration-200"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} className="text-white" />
          </button>
        )}

        <div className="flex-1 overflow-y-auto text-white hide-scrollbar">
          <div className="px-4 flex flex-col gap-4">
            {/* Calendar month selector */}
            <div className="flex flex-col gap-4 mt-4">
              <h2 className="font-semibold text-xl sm:text-lg">Date</h2>
              <div>
                <div className="flex flex-row items-center justify-between mb-4">
                  <ChevronButton
                    onClick={() => changeMonth(-1)}
                    direction="left"
                    blocked={currentMonth.getFullYear() === new Date().getFullYear() &&
                      currentMonth.getMonth() === new Date().getMonth()}
                  />
                  <span className="font-bold text-xl sm:text-base">{currentMonthName}</span>
                  <ChevronButton onClick={() => changeMonth(1)} direction="right" />
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Week day headers */}
                  {weekDays.map(day => (
                    <div key={day} className="text-xl sm:text-xs font-semibold py-1 text-center">
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
                      <div key={index} className="aspect-square w-full flex justify-center items-center">
                        <button
                          className={`aspect-square rounded-full text-xl sm:text-xs w-full flex items-center justify-center
                          ${!day.isCurrentMonth && isPastDate ? "text-gray-300" : ""}
                          ${isSelected ? "bg-slate-light text-white" : ""}
                          ${isToday && !isSelected ? "border border-slate-light" : ""}
                          ${isPastDate ? "text-gray-300 cursor-not-allowed" : ""}
                          ${!day.isCurrentMonth ? "hidden" : ""}
                          ${!isPastDate && day.isCurrentMonth ? "hover:bg-slate-deep transition-colors duration-200" : ""}`}
                          onClick={() => {
                            if (day.isCurrentMonth && !isPastDate) {
                              handleDateChange(day.date);
                              // Close sidebar on mobile when a date is selected
                              if (setSidebarOpen) {
                                setSidebarOpen(false);
                              }
                            }
                          }}
                          disabled={isPastDate || !day.isCurrentMonth}
                        >
                          {day.date.getDate()}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="w-full border-b border-gray-200"></div>

            {/* Broadcast settings section */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl sm:text-lg font-semibold">Broadcast Settings</h2>
              <div className="flex flex-row items-center gap-1">
                <button
                  onClick={toggleShowOnlyAvailableBroadcasts}
                  className="flex items-center gap-2 cursor-pointer px-1 rounded-md"
                >
                  <div className={`w-5 h-5 flex items-center justify-center rounded border ${userPreferences.showOnlyAvailableBroadcasts
                    ? 'bg-slate-light border-slate-light'
                    : 'border-gray-300'
                    }`}>
                    {userPreferences.showOnlyAvailableBroadcasts && (<Check size={14} className="text-white" />)}
                  </div>
                </button>
                <span className="text-lg sm:text-base">Only show available broadcasts</span>
              </div>
            </div>

            <div className="w-full border-b border-gray-200"></div>

            {/* Print settings section */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl sm:text-lg font-semibold">Display Settings</h2>
              <div className="flex flex-col gap-2">
                <div className="flex flex-row items-center gap-1">
                  <button
                    onClick={() => props.setIncludeGamePulseInPrint(!props.includeGamePulseInPrint)}
                    className="flex items-center gap-2 cursor-pointer px-1 rounded-md"
                  >
                    <div className={`w-5 h-5 flex items-center justify-center rounded border ${props.includeGamePulseInPrint
                      ? 'bg-slate-light border-slate-light'
                      : 'border-gray-300'
                      }`}>
                      {props.includeGamePulseInPrint && (<Check size={14} className="text-white" />)}
                    </div>
                  </button>
                  <span className="text-lg sm:text-base">Include Game Pulse</span>
                </div>
                {/* Minimum Slate Score Input (checkbox style) */}
                <div className="flex flex-row items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={userPreferences.minSlateScore}
                    onChange={(e) => {
                      let val = parseInt(e.target.value, 10);
                      if (isNaN(val)) val = 0;
                      if (val < 0) val = 0;
                      if (val > 100) val = 100;
                      updateUserPreferences({ minSlateScore: val });
                    }}
                    className="flex items-center gap-2 cursor-pointer rounded mx-1 w-[22px] text-center text-sm font-semibold bg-transparent outline-none border border-gray-300 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label="Minimum slate score filter (0-100)"
                  />
                  <span className="text-lg sm:text-base">Min. Slate Score</span>
                </div>
              </div>
            </div>

            <div className="w-full border-b border-gray-200"></div>

            <div className="flex flex-col gap-4 mb-6">
              {/* Sports selector */}
              <h2 className="text-xl sm:text-lg font-semibold">Sports</h2>
              <div className="flex flex-col gap-2">
                {Object.values(Sports).map((sport) => (
                  <div key={sport} className="flex flex-row items-center gap-1">
                    <button
                      onClick={() => { handleSportChange(sport); }}
                      className="flex items-center gap-2 cursor-pointer px-1 rounded-md"
                    >
                      <div className={`w-5 h-5 flex items-center justify-center rounded border ${selectedSports.includes(sport)
                        ? 'bg-slate-light border-slate-light'
                        : 'border-gray-300'
                        }`}>
                        {selectedSports.includes(sport) && (<Check size={14} className="text-white" />)}
                      </div>
                    </button>
                    <span className="text-lg sm:text-base">{getSportDisplayName(sport)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChevronButton: React.FC<ChevronButtonProps> = ({ onClick, direction, blocked }) => (
  <button
    className={`p-2 flex justify-center items-center rounded-full transition-colors duration-200
      ${blocked ? "text-black cursor-not-allowed" : "hover:bg-slate-deep cursor-pointer"}`}
    onClick={onClick}
    disabled={blocked}
  >
    {direction === "left" ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
  </button>
);

export default SportSelector;