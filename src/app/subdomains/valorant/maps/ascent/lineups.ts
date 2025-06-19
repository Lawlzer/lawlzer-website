import type { Lineup, MapArea, Writeable } from '../../types';

import image2 from './images/2.png';
import image3 from './images/3.png';
import image4 from './images/4.png';
import image5 from './images/5.png';
import image6 from './images/6.png';
import image7 from './images/7.png';
import image8 from './images/8.png';
import image9 from './images/9.png';
import image10 from './images/10.png';
import image11 from './images/11.png';
import image12 from './images/12.png';
import image13 from './images/13.png';
import image14 from './images/14.png';
import image15 from './images/15.png';
import image16 from './images/16.png';
import image17 from './images/17.png';

const tempAreasFrom = [
	{
		title: 'A TreeHouse Box',
		x: 575,
		y: 227,
		width: 20,
		height: 20,
	},
	{
		title: 'A Main Box',
		x: 566,
		y: 470,
		width: 20,
		height: 20,
	},
	{
		title: 'A CT Corner',
		x: 615,
		y: 96,
		width: 20,
		height: 20,
	},
	{
		title: 'A Mid Boxes',
		x: 538,
		y: 396,
		width: 20,
		height: 20,
	},
	{
		title: 'B Main Box',
		x: 125,
		y: 442,
		width: 20,
		height: 20,
	},
	{
		title: 'CT Triple Barrels',
		x: 447,
		y: 149,
		width: 20,
		height: 20,
	},
	{
		title: 'A CT Table',
		x: 574,
		y: 576,
		width: 25,
		height: 25,
	},
] as const; // We have to declare as const to type-check the titles.

export const areasFrom: MapArea<string>[] = tempAreasFrom as Writeable<typeof tempAreasFrom>;

const tempAreasTo = [
	{
		title: 'A Gen Corner',
		x: 643,
		y: 213,
		width: 29,
		height: 29,
	},
	{
		title: 'A Dice',
		x: 713,
		y: 258,
		width: 25,
		height: 22,
	},
	{
		title: 'A Wine',
		x: 759,
		y: 392,
		width: 40,
		height: 38,
	},
	{
		title: 'A Inside Generator',
		x: 640,
		y: 237,
		width: 27,
		height: 43,
	},
	{
		title: 'A Outside Gen',
		x: 655,
		y: 277,
		width: 27,
		height: 27,
	},
	{
		title: 'B Default Box',
		x: 80,
		y: 213,
		width: 27,
		height: 27,
	},
	{
		title: 'B Far Box',
		x: 100,
		y: 156,
		width: 20,
		height: 20,
	},
	{
		title: 'B Opposite Lane',
		x: 166,
		y: 156,
		width: 34,
		height: 24,
	},
] as const; // We have to declare as const to type-check the titles.
export const areasTo: MapArea<string>[] = tempAreasTo as Writeable<typeof tempAreasTo>;

export const lineups: Lineup<FromAreaTitles, ToAreaTitles>[] = [
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A Main Box',
		toTitle: 'A Outside Gen',

		imageStuff: [{ image: image2, notes: ['Q under Double-Dash Thing'] }],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A Mid Boxes',
		toTitle: 'A Outside Gen',

		imageStuff: [
			{
				image: image3,
				notes: ['Hug the tiny box (must be up on ONE stair!)'],
			},
		],
	},

	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A TreeHouse Box',
		toTitle: 'A Wine',

		imageStuff: [
			{
				image: image4,
				notes: ['Throw at 9s', 'Stand to the RIGHT SIDE of the box', 'Insta-jump throw'],
			},

			{
				image: image5,
				notes: [],
			},
		],
	},

	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'B Main Box',
		toTitle: 'B Opposite Lane',

		imageStuff: [{ image: image6, notes: ['Wait 100ms-jump throw'] }],
	},

	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'B Main Box',
		toTitle: 'B Default Box',

		imageStuff: [{ image: image7, notes: ['Stand-throw'] }],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'CT Triple Barrels',
		toTitle: 'B Default Box',

		imageStuff: [
			{
				image: image8,
				notes: ['Lineup above lower spike, and to the left of the other one', 'Insta jump-throw'],
			},
		],
	},

	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'B Main Box',
		toTitle: 'B Far Box',

		imageStuff: [{ image: image9, notes: [] }],
	},

	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'B Main Box',
		toTitle: 'B Opposite Lane',

		imageStuff: [
			{
				image: image10,
				notes: ['Jump insta-throw', 'tbd... not sure what a good lineup is'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A Main Box',
		toTitle: 'A Inside Generator',

		imageStuff: [{ image: image11, notes: ['Aim directly at peak of spike'] }],
	},

	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A Main Box',
		toTitle: 'A Dice',

		imageStuff: [
			{
				image: image12,
				notes: ['Aim directly at peak of spike', 'Stand-throw, or jump-peak-throw (to land on the box)'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A Mid Boxes',
		toTitle: 'A Dice',

		imageStuff: [{ image: image13, notes: ['Insta jump-throw', 'Aim middle-ish of box'] }],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A CT Corner',
		toTitle: 'A Outside Gen',

		imageStuff: [{ image: image15, notes: [] }],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A CT Corner',
		toTitle: 'A Gen Corner',

		imageStuff: [{ image: image14, notes: ['Vertical with left side of above thing', 'Horizontal with bottom of thing'] }],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A CT Table',
		toTitle: 'A Gen Corner',

		imageStuff: [
			{ image: image16, notes: ['Insta-jump throw'] },
			{ image: image17, notes: ['Stand here'] },
		],
	},
];

export type FromAreaTitles = (typeof areasFrom)[number]['title'];
export type ToAreaTitles = (typeof areasTo)[number]['title'];
export type AllAreaTitles = FromAreaTitles;
