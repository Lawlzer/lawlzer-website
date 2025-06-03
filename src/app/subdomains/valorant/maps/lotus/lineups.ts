import type { Lineup, MapArea } from '../../types';

export const areasFrom: MapArea<string>[] = [];
export const areasTo: MapArea<string>[] = [];
export const lineups: Lineup<string, string>[] = [];

export type FromAreaTitles = string;
export type ToAreaTitles = string;
export type AllAreaTitles = FromAreaTitles;
