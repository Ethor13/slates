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

interface InterestLevel {
    label: string;
    className: string;
    rating: string;
}

export const getInterestLevel = (score: number): InterestLevel => {
    const rating = score >= 0 ? (100 * score).toFixed(0) : "?";
    if (score >= 0.8) return { label: "Must Watch", className: "must-watch", rating };
    if (score >= 0.6) return { label: "High Interest", className: "high-interest", rating };
    if (score >= 0.4) return { label: "Decent", className: "decent", rating };
    if (score >= 0) return { label: "Low Interest", className: "low-interest", rating };
    return { label: "Unknown", className: "unknown-interest", rating };
};

export const getDateString = (date: Date): string => {
  return date.toLocaleDateString("en-CA").slice(0, 10);
};

export const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

export const getInternalImageUrl = (src: string): string => {
  if (!src) throw new Error('Image source is required');
  return src.split(".com/").at(-1) as string;
}
