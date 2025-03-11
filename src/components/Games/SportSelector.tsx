import React, { useState, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Sports, Sort, SportSelectorProps, ChevronButtonProps } from "./types";
import { addDays, getDateString } from "../../helpers";

const SportSelector: React.FC<SportSelectorProps> = ({ props }) => {
  const { selectedSports, setSelectedSports, selectedDate, setSelectedDate, sortBy, setSortBy } = props;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const today = getDateString(new Date());

  const [displayedDates, setDisplayedDates] = useState<Date[]>([
    addDays(selectedDate, -2),
    addDays(selectedDate, -1),
    selectedDate,
    addDays(selectedDate, 1),
    addDays(selectedDate, 2),
  ]);

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
      // Clear existing games data first by calling setSelectedSports
      // The useEffect in parent component will handle the loading state and data fetching
      setSelectedSports(
        (prev) =>
          prev.includes(sport)
            ? prev.filter((item) => item !== sport) // remove sport if already selected
            : [...prev, sport] // add sport if not selected
      );
    },
    [setSelectedSports]
  );

  const handleDateChange = useCallback(
    (date: Date) => {
      if (getDateString(date) < today) return;
      if (getDateString(date) === getDateString(selectedDate)) return;
      
      // Update displayed dates so date is in the middle
      setDisplayedDates([
        addDays(date, -2),
        addDays(date, -1),
        date,
        addDays(date, 1),
        addDays(date, 2),
      ]);
      
      // Update the date which will trigger the useEffect in parent component
      setSelectedDate(date);
    },
    [setSelectedDate, selectedDate, today]
  );

  const shiftDaysLeft = useCallback(() => {
    setDisplayedDates((prevDates) => {
      if (getDateString(prevDates[2]) !== today) {
        const newDates = prevDates.map((date) => addDays(date, -1));
        // Update selected date which will trigger the useEffect in parent component
        setSelectedDate(newDates[2]);
        return newDates;
      }
      return prevDates;
    });
  }, [setSelectedDate, today]);

  const shiftDaysRight = useCallback(() => {
    setDisplayedDates((prevDates) => {
      const newDates = prevDates.map((date) => addDays(date, 1));
      // Update selected date which will trigger the useEffect in parent component
      setSelectedDate(newDates[2]);
      return newDates;
    });
  }, [setSelectedDate]);

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

  return (
    <div className="flex flex-col items-center gap-4 mb-4">
      <div>
        <div className="flex flex-row items-center justify-center">
          <ChevronButton
            onClick={shiftDaysLeft}
            direction="left"
            blocked={getDateString(displayedDates[2]) === today}
          />

          {displayedDates.map((date, index) => {
            const isActive = getDateString(date) === getDateString(new Date(selectedDate));
            const isBlocked = getDateString(date) < today;
            const marginRight = index !== 4 ? "mr-4" : "";

            return (
              <button
                key={index}
                className={`w-20 h-12 bg-transparent border-none text-base flex flex-col justify-center items-center ${marginRight} 
                  ${isBlocked ? "text-gray-400 cursor-not-allowed" : "hover:text-blue-600 cursor-pointer"}
                  ${isActive ? "text-blue-600 font-bold" : "font-[500]"}
                `}
                onClick={() => handleDateChange(date)}
              >
                <div className="text-sm">
                  {new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="text-sm">
                  {new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </button>
            );
          })}

          <ChevronButton onClick={shiftDaysRight} direction="right" />
        </div>
      </div>

      <div className="flex flex-row justify-center gap-8">
        {Object.values(Sports).map((sport) => (
          <button
            key={sport}
            className={`w-32 h-auto px-0.5 py-3 cursor-pointer box-border border rounded-3xl flex flex-col items-center gap-2 transition-colors
              ${selectedSports.includes(sport)
                ? "border-2 border-blue-600 text-blue-600 bg-blue-50"
                : "border-gray-400 hover:border-blue-600 hover:border-3"}`}
            onClick={() => handleSportChange(sport)}
          >
            <img
              className={`w-16 h-16 flex-col items-center justify-self-start`}
              src={`i/leaguelogos/${sport}.png`}
              alt={`${sport} logo`}
            />
            <div className="grow flex flex-col justify-center">
              <span className="font-bold leading-none">{getSportDisplayName(sport)}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="w-full max-w-[50rem] flex justify-end items-center relative">
        <p className="font-sans text-base">Sorted by:&nbsp;</p>
        <div className="relative" ref={dropdownRef}>
          <button
            className="bg-transparent border-none font-bold cursor-pointer flex items-center text-base gap-0.5 text-blue-600"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {sortBy}
            <ChevronDown
              className={`text-gray-700 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              size={16}
            />
          </button>

          {isDropdownOpen && (
            <ul className="absolute right-4 bg-white border border-gray-400 rounded-lg mt-1 list-none shadow-md z-50 py-2 px-2 flex flex-col gap-2 items-end w-[7rem]">
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
    </div>
  );
};

const ChevronButton: React.FC<ChevronButtonProps> = ({ onClick, direction, blocked }) => (
  <button
    className={`bg-transparent border-none w-12 h-12 flex justify-center items-center 
      ${blocked ? "text-gray-400 cursor-not-allowed" : "hover:text-blue-600 cursor-pointer"}`}
    onClick={onClick}
  >
    {direction === "left" ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
  </button>
);

export default SportSelector;