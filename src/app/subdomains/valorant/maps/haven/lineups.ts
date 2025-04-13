import type { Lineup, MapArea, Writeable } from '../../types';
import image1 from './images/1.png';
import image10 from './images/10.png';
import image11 from './images/11.png';
import image12 from './images/12.png';
import image13 from './images/13.png';
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
		title: 'C Link Corner',
		x: 300,
		y: 286,
		width: 18,
		height: 18,
	},
	{
		title: 'A Long Bricks Corner',
		x: 702,
		y: 529,
		width: 16,
		height: 16,
	},
	{
		title: 'A Link Barrel',
		x: 491,
		y: 355,
		width: 18,
		height: 18,
	},
	{
		title: 'A Garden Left Corner',
		x: 441,
		y: 703,
		width: 18,
		height: 18,
	},
	{
		title: 'C Long Right Corner',
		x: 127,
		y: 661,
		width: 18,
		height: 18,
	},
	{
		title: 'Courtyard Left Corner',
		x: 350,
		y: 571,
		width: 18,
		height: 18,
	},
	{
		title: 'CT... Something',
		x: 386,
		y: 100,
		width: 18,
		height: 18,
	},
	{
		title: 'A Long Sandbags',
		x: 609,
		y: 582,
		width: 18,
		height: 18,
	},
] as const; // We have to declare as const to type-check the titles.

export const areasFrom: MapArea<string>[] = tempAreasFrom as Writeable<typeof tempAreasFrom>;

const tempAreasTo = [
	{
		title: 'B Left Corner',
		x: 375,
		y: 358,
		width: 16,
		height: 16,
	},
	{
		title: 'B Right Corner',
		x: 418,
		y: 358,
		width: 16,
		height: 16,
	},
	{
		title: 'B Open',
		x: 396,
		y: 374,
		width: 18,
		height: 13,
	},
	{
		title: 'C Safe',
		x: 113,
		y: 352,
		width: 18,
		height: 18,
	},
	{
		title: 'A Default',
		x: 720,
		y: 336,
		width: 25,
		height: 25,
	},
	{
		title: 'C Open',
		x: 64,
		y: 331,
		width: 25,
		height: 25,
	},
] as const;
export const areasTo: MapArea<string>[] = tempAreasTo as Writeable<typeof tempAreasTo>;

export const lineups: Lineup<FromAreaTitles, ToAreaTitles>[] = [
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'C Long Right Corner',
		toTitle: 'C Safe',

		imageStuff: [
			{
				image: image1,
				notes: ['Shift-walk instathrow', 'Aim at peak of mountain'],
			},
			{
				image: image2,
				notes: ['Insta-jump-throw', 'Aim between the bottom leaf, and the ledge thing lower-right'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'C Long Right Corner',
		toTitle: 'C Open',

		imageStuff: [
			{
				image: image3,
				notes: ['Shift-walk instathrow', 'C a bit to the left of the thing'],
			},
			{
				image: image4,
				notes: ['Jump Instathrow', 'X anywhere vertical inbetween the two stubs on the sign'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'Courtyard Left Corner',
		toTitle: 'C Open',

		imageStuff: [
			{
				image: image6,
				notes: ['Insta-jump throw', 'E in the bottomleft of this window-pane thing'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'Courtyard Left Corner',
		toTitle: 'C Safe',

		imageStuff: [
			{
				image: image7,
				notes: ['Insta-jump throw', 'Q in bottomright of 1st window'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A Garden Left Corner',
		toTitle: 'B Open',

		imageStuff: [
			{
				image: image5,
				notes: ['Aim at this inverse-corner'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A Link Barrel',
		toTitle: 'A Default',

		imageStuff: [
			{
				image: image8,
				notes: ['X on bottom pipe', 'edit: aim UNDER pipe'],
			},
			{
				image: image9,
				notes: ['Stand here'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A Long Bricks Corner',
		toTitle: 'A Default',

		imageStuff: [
			{
				image: image10,
				notes: ['Aim between the left and right straps'],
			},
			{
				image: image11,
				notes: ['Insta-jump throw'],
			},
			{
				image: image12,
				notes: ['Q Goes here'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'C Link Corner',
		toTitle: 'C Open',

		imageStuff: [
			{
				image: image13,
				notes: ['C on this tiny... bump, satellite, thing'],
			},
		],
	},
];

export type FromAreaTitles = (typeof areasFrom)[number]['title'];
export type ToAreaTitles = (typeof areasTo)[number]['title'];
export type AllAreaTitles = FromAreaTitles;
