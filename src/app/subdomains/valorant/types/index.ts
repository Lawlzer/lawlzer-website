import type { StaticImageData } from 'next/image';

import GekkoImage from '../assets/Gekko.png';
import MoshPitImage from '../assets/MoshPit.png';
import PoisonCloudImage from '../assets/PoisonCloud.png';
import ReconDartImage from '../assets/ReconDart.png';
import ShockDartImage from '../assets/ShockDart.png';
import SnakeBiteImage from '../assets/SnakeBite.png';
import SovaImage from '../assets/Sova.png';
import ViperImage from '../assets/Viper.png';

export const imageMap = {
	Gekko: GekkoImage,
	Sova: SovaImage,
	Viper: ViperImage,
	'Mosh Pit': MoshPitImage,
	'Shock Dart': ShockDartImage,
	'Recon Dart': ReconDartImage, // todo
	'Snake Bite': SnakeBiteImage,
	'Poison Cloud': PoisonCloudImage,
} as const;

export const agentUtilityMap = {
	Gekko: ['Mosh Pit'],
	Sova: ['Shock Dart', 'Recon Dart'],
	Viper: ['Snake Bite', 'Poison Cloud'],
} as const;

export type Agent = keyof typeof agentUtilityMap;
export type Utility = (typeof agentUtilityMap)[Agent][number];
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export interface MapArea<Titles extends string> {
	title: Titles;
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface LineupImage {
	notes: [] | [string, string, string] | [string, string] | [string];
	image: StaticImageData;
}

export interface Lineup<FromAreaTitles, ToAreaTitles> {
	agent: Agent;
	util: Utility;

	fromTitle: FromAreaTitles;
	toTitle: ToAreaTitles;

	imageStuff: LineupImage[];
}

export const agents = Object.keys(agentUtilityMap) as Agent[];
