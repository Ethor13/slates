import { DocumentData } from "firebase/firestore";

export enum Sort {
    TIME = 'Time',
    SCORE = 'Slate Score',
}

export enum Sports {
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
    selectedSports: Sports[];
    setSelectedSports: (callback: (prev: Sports[]) => Sports[]) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    sortBy: Sort;
    setSortBy: (sort: Sort) => void;
  }
}

export interface ChevronButtonProps {
  onClick: () => void;
  direction: "left" | "right";
  blocked?: boolean;
}