import type { Lineup, MapArea, Writeable } from '../../types';
import image1 from './images/1.png';
import image2 from './images/2.png';
import image3 from './images/3.png';
import image4 from './images/4.png';

const tempAreasFrom = [
	{
		title: 'C Mound',
		x: 210,
		y: 477,
		width: 25,
		height: 25,
	},
	{
		title: 'B Pillar Stairs',
		x: 416,
		y: 543,
		width: 25,
		height: 25,
	},
	{
		title: 'A Lobby Door',
		x: 533,
		y: 489,
		width: 25,
		height: 25,
	},
] as const; // We have to declare as const to type-check the titles.

export const areasFrom: MapArea<string>[] = tempAreasFrom as Writeable<typeof tempAreasFrom>;

const tempAreasTo = [
	{
		title: 'C Spike Long',
		x: 74,
		y: 332,
		width: 25,
		height: 25,
	},
	{
		title: 'A Default',
		x: 720,
		y: 227,
		width: 25,
		height: 25,
	},
	{
		title: 'B Site Towards Link',
		x: 369,
		y: 251,
		width: 25,
		height: 25,
	},
	{
		title: 'A Stairs Door',
		x: 613,
		y: 208,
		width: 25,
		height: 25,
	},
] as const;
export const areasTo: MapArea<string>[] = tempAreasTo as Writeable<typeof tempAreasTo>;

export const lineups: Lineup<FromAreaTitles, ToAreaTitles>[] = [
	{
		agent: 'Viper',
		util: 'Snake Bite',

		fromTitle: 'C Mound',
		toTitle: 'C Spike Long',

		imageStuff: [
			{
				image: image1,
				notes: ['Insta-jump throw', 'C in this seam'],
			},
			{
				image: image2,
				notes: ['Stand centered on the big <thing>'],
			},
		],
	},
	{
		agent: 'Viper',
		util: 'Poison Cloud',

		fromTitle: 'B Pillar Stairs',
		toTitle: 'B Site Towards Link',

		imageStuff: [
			{
				image: image3,
				notes: ['Insta-jump throw', 'Q above 5th "seam"', 'Stand on the first stair'],
			},
		],
	},
	{
		agent: 'Viper',
		util: 'Poison Cloud',

		fromTitle: 'A Lobby Door',
		toTitle: 'A Stairs Door',

		imageStuff: [
			{
				image: image4,
				notes: ['Pre-round, stand against the corner', 'Viper Poison Bar (left side) aligned with the leaf'],
			},
		],
	},
];

export type FromAreaTitles = (typeof areasFrom)[number]['title'];
export type ToAreaTitles = (typeof areasTo)[number]['title'];
export type AllAreaTitles = FromAreaTitles;
