import React, { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Sports, SportSelectorProps, ChevronButtonProps } from "./types";
import { getDateString } from "../../helpers";
import { FirebaseImg } from "../General/FirebaseImg";
import { useAuth } from "../../contexts/AuthContext";

const SportSelector: React.FC<SportSelectorProps> = ({ props }) => {
  const { selectedSports, setSelectedSports, selectedDate, setSelectedDate, setGamesLoading } = props;
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
        return "NCAA Men's Basketball";
      default:
        return sport;
    }
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentMonthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed left-0 top-20 bottom-0 w-[20vw]">
      <div className="flex flex-col h-full bg-white shadow-md top-4 bottom-0">
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 flex flex-col gap-4">
            {/* Calendar month selector */}
            <div className="flex flex-col gap-4 mt-4">
              <h2 className="text-lg font-semibold">Date</h2>
              <div>
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
            </div>

            <div className="w-full border-b border-gray-200"></div>

            {/* Broadcast settings section */}
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Broadcast Settings</h2>
              <div className="flex flex-row items-center gap-1">
                <button
                  onClick={toggleShowOnlyAvailableBroadcasts}
                  className="flex items-center gap-2 cursor-pointer px-1 rounded-md"
                >
                  <div className={`w-5 h-5 flex items-center justify-center rounded border ${userPreferences.showOnlyAvailableBroadcasts
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300'
                    }`}>
                    {userPreferences.showOnlyAvailableBroadcasts && (<Check size={14} className="text-white" />)}
                  </div>
                </button>
                <span className="text-sm">Only show available broadcasts</span>
              </div>
            </div>

            <div className="w-full border-b border-gray-200"></div>

            <div className="flex flex-col gap-4">
              {/* Sports selector */}
              <h2 className="text-lg font-semibold">Sports</h2>
              <div className="flex flex-col gap-2">
                {Object.values(Sports).map((sport) => (
                  <button
                    key={sport}
                    className={`p-1 cursor-pointer box-border border-2 rounded-lg flex items-center gap-2 transition-colors
                    ${selectedSports.includes(sport)
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-gray-300 hover:bg-blue-50"}`}
                    onClick={() => handleSportChange(sport)}
                  >
                    <div className="w-8 h-8">
                      <FirebaseImg
                        src={`i/leaguelogos/${sport}.png`}
                        alt={`${sport} logo`}
                      />
                    </div>
                    <span className="font-medium">{getSportDisplayName(sport)}</span>
                  </button>
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
    className={`bg-transparent border-none w-8 h-8 flex justify-center items-center rounded-full hover:bg-gray-100
      ${blocked ? "text-gray-400 cursor-not-allowed" : "hover:text-blue-600 cursor-pointer"}`}
    onClick={onClick}
    disabled={blocked}
  >
    {direction === "left" ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
  </button>
);

export default SportSelector;