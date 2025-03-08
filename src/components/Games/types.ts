import { DocumentData } from "firebase/firestore";

export enum Sort {
    TIME = 'Time',
    SCORE = 'Slate Score',
}

export enum Sport {
    NBA = 'nba',
    NCAAMBB = 'ncaambb',
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
  shortName: string;
  record: string;
  logo: string;
  matchupQualities?: {
    teampredwinpct: number;
  };
}

export interface GameCardProps {
  game: DocumentData;
  showGameTime: boolean;
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
  games: ScheduleResponse;
}

export interface SportSelectorProps {
  props: {
    selectedSports: Sport[];
    setSelectedSports: (callback: (prev: Sport[]) => Sport[]) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    sortBy: Sort;
    setSortBy: (sort: Sort) => void;
    fetchGamesData: () => Promise<void>;
  }
}

export interface ChevronButtonProps {
  onClick: () => void;
  direction: "left" | "right";
  blocked?: boolean;
}