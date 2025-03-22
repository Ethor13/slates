import { Star } from "lucide-react";

export const formatGameTime = (timeString: string): string => {
    const date = new Date(timeString);
    return date.toLocaleString("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
        // weekday: 'short',
        // month: 'short',
        // day: 'numeric',
        hour12: true,
    });
};

export interface InterestLevel {
    className: string;
    rating: string | JSX.Element;
}

export const getInterestLevel = (score: number, isFavoriteGame: boolean): InterestLevel => {
    if (isFavoriteGame) return { className: "favorite", rating: <Star className="text-yellow-500" /> };

    const rating = score >= 0 ? (100 * score).toFixed(0) : "?";
    if (score >= 0.8) return { className: "must-watch", rating };
    if (score >= 0.6) return { className: "high-interest", rating };
    if (score >= 0.4) return { className: "decent", rating };
    if (score >= 0) return { className: "low-interest", rating };
    return { className: "unknown-interest", rating };
};

export const getDateString = (date: Date): string => {
  return date.toLocaleDateString("en-CA").slice(0, 10);
};

export const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};
