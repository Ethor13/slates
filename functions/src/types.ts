export enum Sports {
  NBA = "nba",
  NCAAMBB = "ncaambb",
  MLB = "mlb"
}

// always have a stat/metric be a key
export type TeamMetric = Record<string, any>;
export type GameMetric = Record<string, any>;
export type Metric = TeamsMetric | GamesMetric;

// always have an id be a key
export type TeamsMetric = Record<string, TeamMetric>;
export type GamesMetric = Record<string, GameMetric>;

// always have a metric name be the key
export type TeamsMetrics = Record<string, TeamsMetric>;
export type GamesMetrics = Record<string, GamesMetric>;
export type Metrics = TeamsMetrics | GamesMetrics;

export type GameTeams = {
    home: TeamsMetrics;
    away: TeamsMetrics;
}

// always have game info as a key
export type ParsedGame = Record<string, any>;
// always have a gameId be a key
export type ParsedGames = Record<string, ParsedGame>;
// always have a gameId be a key
export type GameScores = Record<string, number>;

// always have a teamId be a key
export type ParsedTeams = Record<string, TeamsMetrics>;

// always have a Sports enum be the key
export type GamesData = Record<string, ParsedGames>;
export type TeamsData = Record<string, ParsedTeams>;
