import type { Lineup, MapArea, Writeable } from '../../types';

import image1 from './images/1.png';
import image2 from './images/2.png';
import image3 from './images/3.png';
import image4 from './images/4.png';

const tempAreasFrom = [
	{
		title: 'A CT',
		x: 639 - 64,
		y: 524 - 48.5,
		width: 17,
		height: 17,
	},
	{
		title: 'B Garage',
		x: 257 - 64,
		y: 516 - 48.5,
		width: 17,
		height: 17,
	},
] as const; // We have to declare as const to type-check the titles.

export const areasFrom: MapArea<string>[] = tempAreasFrom as Writeable<typeof tempAreasFrom>;

const tempAreasTo = [
	{
		title: 'A Site Top Plant',
		x: 612 - 64,
		y: 253 - 48.5,
		width: 17,
		height: 17,
	},
	{
		title: 'A Site Lower Long Plant',
		x: 640 - 64,
		y: 253 - 48.5,
		width: 17,
		height: 17,
	},
	{
		title: 'A Default Plant',
		x: 630 - 64,
		y: 272 - 48.5,
		width: 17,
		height: 17,
	},
	{
		title: 'B Default Plant',
		x: 148 - 64,
		y: 378 - 48.5,
		width: 17,
		height: 17,
	},
] as const;
export const areasTo: MapArea<string>[] = tempAreasTo as Writeable<typeof tempAreasTo>;

export const lineups: Lineup<FromAreaTitles, ToAreaTitles>[] = [
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A CT',
		toTitle: 'A Site Top Plant',

		imageStuff: [
			{
				image: image1,
				notes: ['Aim under the red arrow, against this horizontal line'],
			},
			{
				image: image2,
				notes: ['Stand in this corner'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A CT',
		toTitle: 'A Site Lower Long Plant',

		imageStuff: [
			{
				image: image3,
				notes: ['Shift-walk 0.25s-delay-throw'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'B Garage',
		toTitle: 'B Default Plant',

		imageStuff: [
			{
				image: image4,
				notes: ['Run throw', 'Aim in the open', 'Crosshair vertically in the middle of the green box'],
			},
		],
	},
];

export type FromAreaTitles = (typeof areasFrom)[number]['title'];
export type ToAreaTitles = (typeof areasTo)[number]['title'];
export type AllAreaTitles = FromAreaTitles;
