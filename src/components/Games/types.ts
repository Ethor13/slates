import { DocumentData } from "firebase/firestore";

export enum Sort {
    TIME = 'Time',
    SCORE = 'Slate Score',
    SPORT = 'Sport', // Added new sort option
}

export enum Sports {
    NBA = 'nba',
    NCAAMBB = 'ncaambb',
    MLB = 'mlb',
    NHL = 'nhl',
}

export interface Game {
  id: string;
  date: string;
  slateScore: number;
  sport: string;
  away: any;
  home: any;
  broadcasts: Record<string, any>;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  record?: string;
  logo?: string;
  matchupQualities?: Record<string, number>;
  colors: {
    primary: string;
    alternate: string;
  };
}

export interface GameCardProps {
  game: DocumentData;
}

export interface TeamInfoProps {
  homeAway: "home" | "away";
  team: Team;
  opponent?: Team;
}

export interface BroadcastsProps {
  broadcasts: Record<string, any>;
}

export interface ScheduleResponse {
  [x: string]: DocumentData;
}

export interface GamesListProps {
  sortBy: Sort;
  setSortBy: (sort: Sort) => void;
  secondarySort: Sort;
  setSecondarySort: (sort: Sort) => void;
  games: ScheduleResponse;
  selectedDate: Date;
}

export interface SportSelectorProps {
  props: {
    selectedSports: Sports[];
    setSelectedSports: (callback: (prev: Sports[]) => Sports[]) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    setGamesLoading: (loading: boolean) => void;
    sidebarOpen?: boolean;
    setSidebarOpen?: (open: boolean) => void;
    includeGamePulseInPrint: boolean;
    setIncludeGamePulseInPrint: (val: boolean) => void;
  };
}

export interface ChevronButtonProps {
  onClick: () => void;
  direction: "left" | "right";
  blocked?: boolean;
}