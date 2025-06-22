import type { Lineup, MapArea, Writeable } from '../../types';

import image1 from './images/1.png';
import image2 from './images/2.png';
import image3 from './images/3.png';
import image4 from './images/4.png';
import image5 from './images/5.png';
import image6 from './images/6.png';
import image7 from './images/7.png';
import image8 from './images/8.png';
import image9 from './images/9.png';

const tempAreasFrom = [
	{
		title: 'B Lobby Boxes',
		x: 106,
		y: 487,
		width: 40,
		height: 40,
	},

	{
		title: 'A Lobby Boxes',
		x: 693,
		y: 493,
		width: 40,
		height: 40,
	},
	{
		title: 'A Main Triangle',
		x: 731,
		y: 459,
		width: 40,
		height: 40,
	},
	{
		title: 'A Under Rafters',
		x: 602,
		y: 266,
		width: 40,
		height: 40,
	},
	// {
	// 	title: '',
	// 	x: ,
	// 	y: ,
	// 	width: 40,
	// 	height: 40,
	// },
] as const; // We have to declare as const to type-check the titles.

export const areasFrom: MapArea<string>[] = tempAreasFrom as Writeable<typeof tempAreasFrom>;

const tempAreasTo = [
	{
		title: 'B Site Entrance',
		x: 68,
		y: 288,
		width: 50,
		height: 50,
	},
	{
		title: 'B Tower',
		x: 167,
		y: 270,
		width: 50,
		height: 50,
	},
	{
		title: 'B Alley',
		x: 119,
		y: 172,
		width: 50,
		height: 50,
	},
	{
		title: 'A Open',
		x: 722,
		y: 229,
		width: 30,
		height: 30,
	},
	{
		title: 'A Site Box',
		x: 696,
		y: 194,
		width: 30,
		height: 30,
	},
	{
		title: 'A Lobby Entrance',
		x: 695,
		y: 408,
		width: 50,
		height: 50,
	},
	// {
	// 	title: '',
	// 	x: ,
	// 	y: ,
	// 	width: 50,
	// 	height: 50,
	// },
] as const;
export const areasTo: MapArea<string>[] = tempAreasTo as Writeable<typeof tempAreasTo>;

export type FromAreaTitles = (typeof tempAreasFrom)[number]['title'];
export type ToAreaTitles = (typeof tempAreasTo)[number]['title'];
export type AllAreaTitles = FromAreaTitles;

export const lineups: Lineup<FromAreaTitles, ToAreaTitles>[] = [
	{
		agent: 'Viper',
		util: 'Poison Cloud',

		fromTitle: 'B Lobby Boxes',
		toTitle: 'B Site Entrance',

		imageStuff: [
			{
				image: image1,
				notes: ['Right side of Viper utility bar -> barely covering this area'],
			},
		],
	},
	{
		agent: 'Viper',
		util: 'Poison Cloud',

		fromTitle: 'B Lobby Boxes',
		toTitle: 'B Tower',

		imageStuff: [
			{
				image: image3,
				notes: ['E goes on this bolt'],
			},
			{
				image: image2,
				notes: ['Stand here'],
			},
		],
	},
	{
		agent: 'Viper',
		util: 'Snake Bite',

		fromTitle: 'B Lobby Boxes',
		toTitle: 'B Alley',

		imageStuff: [
			{
				image: image4,
				notes: ['E goes here (under both of the above things)'],
			},
		],
	},
	{
		agent: 'Viper',
		util: 'Poison Cloud',

		fromTitle: 'A Lobby Boxes',
		toTitle: 'A Site Box',

		imageStuff: [
			{
				image: image5,
				notes: ['Stand on bottom of both boxes', 'Aim to right of line, and equal with the two lines to the right'],
			},
		],
	},
	{
		agent: 'Viper',
		util: 'Poison Cloud',

		fromTitle: 'A Main Triangle',
		toTitle: 'A Site Box',

		imageStuff: [
			{
				image: image6,
				notes: ['Stand in front of the triangle', 'Jump 100ms-delay throw', 'Aim in the gap between these two leaves'],
			},
		],
	},
	{
		agent: 'Viper',
		util: 'Snake Bite',

		fromTitle: 'A Main Triangle',
		toTitle: 'A Site Box',

		imageStuff: [
			{
				image: image7,
				notes: ['Stand-throw', 'Stand in front of the triangle', 'Aim at the topright corner of the special building'],
			},
			{
				image: image8,
				notes: ['Insta-jump throw', 'Stand in front of the triangle', 'X in between the right and middle of the W'],
			},
		],
	},
	{
		agent: 'Viper',
		util: 'Poison Cloud',

		fromTitle: 'A Under Rafters',
		toTitle: 'A Lobby Entrance',

		imageStuff: [
			{
				image: image9,
				notes: ['Stand-throw', 'C in this corner'],
			},
		],
	},
];
