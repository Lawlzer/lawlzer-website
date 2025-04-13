import type React from 'react';
import * as ascentLineups from '../maps/ascent/lineups';
import Ascent from '../maps/ascent/map';
import * as bindLineups from '../maps/bind/lineups';
import Bind from '../maps/bind/map';
import * as breezeLineups from '../maps/breeze/lineups';
import Breeze from '../maps/breeze/map';
import * as havenLineups from '../maps/haven/lineups';
import Haven from '../maps/haven/map';
import * as iceboxLineups from '../maps/icebox/lineups';
import Icebox from '../maps/icebox/map';
import * as lotusLineups from '../maps/lotus/lineups';
import Lotus from '../maps/lotus/map';
import * as splitLineups from '../maps/split/lineups';
import Split from '../maps/split/map';

import type { Lineup } from '../types';

interface AreaFrom {
	title: string;
	x: number;
	y: number;
	width: number;
	height: number;
}
interface AreaTo {
	title: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

// Define the type for the Map SVG Component
type MapSvgComponent = React.ComponentType<{
	className?: string; // Add optional className to the type
	newBuildTo: () => React.ReactNode;
	newBuildFrom: () => React.ReactNode;
}>;

// Define the structure for map data
interface MapData {
	svgComponent: MapSvgComponent | React.ComponentType<any>; // Allow Todo component type
	lineups: Lineup<string, string>[];
	areasFrom: AreaFrom[];
	areasTo: AreaTo[];
}

// Define the map data object OUTSIDE the hook function for stable reference
const mapDataDefinition: Record<string, MapData> = {
	Ascent: {
		svgComponent: Ascent,
		...ascentLineups,
	},
	Bind: {
		svgComponent: Bind,
		...bindLineups,
	},
	Breeze: {
		svgComponent: Breeze,
		...breezeLineups,
	},
	Haven: {
		svgComponent: Haven,
		...havenLineups,
	},
	Icebox: {
		svgComponent: Icebox,
		...iceboxLineups,
	},
	Lotus: {
		svgComponent: Lotus,
		...lotusLineups,
	},
	Split: {
		svgComponent: Split,
		...splitLineups,
	},
};

// Hook now simply returns the stable map data object
export const useMapMap = (): Record<string, MapData> => {
	return mapDataDefinition;
};
