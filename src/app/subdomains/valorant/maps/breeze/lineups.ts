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
import image10 from './images/10.png';
import image11 from './images/11.png';
import image12 from './images/12.png';

const tempAreasFrom = [
	{
		title: 'Mid Spawn Door Corner',
		x: 411,
		y: 604,
		width: 15,
		height: 15,
	},
	{
		title: 'A Mid Doors',
		x: 502,
		y: 380,
		width: 16,
		height: 16,
	},
	{
		title: 'Mid Cannon Grate',
		x: 212,
		y: 486,
		width: 12,
		height: 16,
	},
	{
		title: 'A CT Box',
		x: 617,
		y: 251,
		width: 16,
		height: 16,
	},
	{
		title: 'A CT',
		x: 557,
		y: 129,
		width: 16,
		height: 16,
	},
] as const; // We have to declare as const to type-check the titles.

export const areasFrom: MapArea<string>[] = tempAreasFrom as Writeable<typeof tempAreasFrom>;

const tempAreasTo = [
	{
		title: 'B Default Plant',
		x: 85,
		y: 235,
		width: 16,
		height: 16,
	},
	{
		title: 'A Safe Plant',
		x: 744,
		y: 372,
		width: 16,
		height: 16,
	},
	{
		title: 'A ?? Recon Close',
		x: 746,
		y: 407,
		width: 16,
		height: 16,
	},
	{
		title: 'A ?? Recon Deep',
		x: 742,
		y: 306,
		width: 16,
		height: 16,
	},
	{
		title: 'A Default Plant',
		x: 710,
		y: 390,
		width: 20,
		height: 20,
	},
	{
		title: 'B Backleft Corner',
		x: 24,
		y: 127,
		width: 16,
		height: 16,
	},
	{
		title: 'B Backright',
		x: 181,
		y: 129,
		width: 16,
		height: 16,
	},
] as const;
export const areasTo: MapArea<string>[] = tempAreasTo as Writeable<typeof tempAreasTo>;

export const lineups: Lineup<FromAreaTitles, ToAreaTitles>[] = [
	{
		agent: 'Sova',
		util: 'Recon Dart',

		fromTitle: 'Mid Spawn Door Corner',
		toTitle: 'A ?? Recon Close',

		imageStuff: [
			{
				image: image1,
				notes: ['2 Charges', '0 Bounces', 'Aim between the leaf and wire'],
			},
		],
	},
	{
		agent: 'Sova',
		util: 'Shock Dart',

		fromTitle: 'A Mid Doors',
		toTitle: 'A Default Plant',

		imageStuff: [
			{ image: image2, notes: ['3 Charges', '2 Bounces'] },
			{ image: image3, notes: ['1 Charge', '1 Bounce', 'No delay.'] },
		],
	},
	{
		agent: 'Sova',
		util: 'Recon Dart',

		fromTitle: 'Mid Cannon Grate',
		toTitle: 'B Backleft Corner',

		imageStuff: [
			{
				image: image5,
				notes: ['2 Charges', '1 Bounce', 'Aim up-right of the first knot in the vine'],
			},
			{ image: image4, notes: ['Stand here'] },
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A Shop',
		toTitle: 'A Safe Plant',

		imageStuff: [
			{
				image: image6,
				notes: ['Stand against the box, then step back until you can see', 'Stand throw'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A Mid Doors',
		toTitle: 'A Safe Plant',

		imageStuff: [
			{
				image: image7,
				notes: ['Run throw, anywhere around here'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A Mid Doors',
		toTitle: 'A Safe Plant',

		imageStuff: [
			{
				image: image8,
				notes: ['Run 0.2s-delay throw'],
			},
			{ image: image9, notes: ['Aim here'] },
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A CT Box',
		toTitle: 'A Safe Plant',

		imageStuff: [
			{
				image: image10,
				notes: ['Full run-throw - Throw when spike is tapped. Aim somewhere here-ish'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A CT',
		toTitle: 'A Safe Plant',

		imageStuff: [
			{
				image: image11,
				notes: ['Jump insta-throw', 'Aim to the right of this blue spec'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'B Mid Boxes',
		toTitle: 'B Safe Plant',

		imageStuff: [
			{
				image: image12,
				notes: ['Aim in the middle of this area'],
			},
		],
	},
];

export type FromAreaTitles = (typeof areasFrom)[number]['title'];
export type ToAreaTitles = (typeof areasTo)[number]['title'];
export type AllAreaTitles = FromAreaTitles;
