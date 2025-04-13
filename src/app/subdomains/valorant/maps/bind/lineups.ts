import type { Lineup, MapArea, Writeable } from '../../types';
import image1 from './images/1.png';
import image10 from './images/10.png';
import image11 from './images/11.png';
import image12 from './images/12.png';
import image13 from './images/13.png';
import image14 from './images/14.png';
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
		title: 'A Long Corner',
		x: 686,
		y: 494,
		width: 12,
		height: 12,
	},
	{
		title: 'B Fountain Corner',
		x: 73,
		y: 480,
		width: 12,
		height: 12,
	},
	{
		title: 'B Long Corner',
		x: 48,
		y: 384,
		width: 12,
		height: 12,
	},
	{
		title: 'B Elbow Safe Corner',
		x: 48,
		y: 247,
		width: 12,
		height: 12,
	},
	{
		title: 'B Elbow Hole Thing',
		x: 101,
		y: 192,
		width: 12,
		height: 12,
	},
] as const; // We have to declare as const to type-check the titles.

export const areasFrom: MapArea<string>[] = tempAreasFrom as Writeable<typeof tempAreasFrom>;

const tempAreasTo = [
	{
		title: 'B Open',
		x: 171,
		y: 262,
		width: 12,
		height: 8,
	},

	{
		title: 'B Corner',
		x: 152,
		y: 252,
		width: 12,
		height: 12,
	},

	{
		title: 'A Default',
		x: 530,
		y: 292,
		width: 16,
		height: 16,
	},

	{
		title: 'A Outside Box',
		x: 576,
		y: 303,
		width: 14,
		height: 14,
	},

	{
		title: 'A Inside Box',
		x: 588,
		y: 283,
		width: 12,
		height: 12,
	},
] as const; // We have to declare as const to type-check the titles.
export const areasTo: MapArea<string>[] = tempAreasTo as Writeable<typeof tempAreasTo>;

export const lineups: Lineup<FromAreaTitles, ToAreaTitles>[] = [
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A Long Corner',
		toTitle: 'A Outside Box',

		imageStuff: [
			{
				image: image1,
				notes: ['Stand in front of the tiny box'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A Long Corner',
		toTitle: 'A Inside Box',

		imageStuff: [
			{
				image: image2,
				notes: ['Stand in front of the tiny box'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'A Long Corner',
		toTitle: 'A Default',

		imageStuff: [
			{
				image: image3,
				notes: ['Insta-jump throw', 'Stand in front of the tiny box'],
			},
		],
	},

	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'B Fountain Corner',
		toTitle: 'B Open',

		imageStuff: [
			{
				image: image4,
				notes: ['Insta-jump throw', 'X on the bolt'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'B Fountain Corner',
		toTitle: 'B Corner',

		imageStuff: [
			{
				image: image5,
				notes: ['Insta-jump throw', 'X on the bolt'],
			},
		],
	},

	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'B Long Corner',
		toTitle: 'B Open',

		imageStuff: [
			{
				image: image6,
				notes: ['Insta-jump throw', 'X on tip of full leaf'],
			},
			{
				image: image7,
				notes: ['X goes here'],
			},
		],
	},

	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'B Long Corner',
		toTitle: 'B Corner',

		imageStuff: [
			{
				image: image8,
				notes: ['Insta-jump throw', 'Q slightly above the corner'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'B Elbow Safe Corner',
		toTitle: 'B Corner',

		imageStuff: [
			{
				image: image10,
				notes: ['Insta-jump throw', 'Horizontal with the dot to the left', 'Vertical with the dotted line'],
			},
			{
				image: image9,
				notes: ['Line up character with this line'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'B Elbow Safe Corner',
		toTitle: 'B Open',

		imageStuff: [
			{
				image: image12,
				notes: ['Insta-jump throw', 'Diagonal-horizontal with the dot to the left', 'Vertical with the dotted line'],
			},
			{
				image: image11,
				notes: ['Line up character with this line'],
			},
		],
	},
	{
		agent: 'Gekko',
		util: 'Mosh Pit',

		fromTitle: 'B Elbow Hole Thing',
		toTitle: 'B Open',

		imageStuff: [
			{
				image: image13,
				notes: ['Aim slightly right of this corner'],
			},
			{
				image: image14,
				notes: ['Run straight, mostly into the door'],
			},
		],
	},
];

export type FromAreaTitles = (typeof areasFrom)[number]['title'];
export type ToAreaTitles = (typeof areasTo)[number]['title'];
export type AllAreaTitles = FromAreaTitles;

for (let i = 0; i < lineups.length; i++) {
	for (let j = i + 1; j < lineups.length; j++) {
		if (lineups[i].fromTitle === lineups[j].fromTitle && lineups[i].toTitle === lineups[j].toTitle) {
			console.warn('Duplicate lineup FROM and TO detected: ', lineups[i], lineups[j]);
		}
	}
}

// for (let i = 0; i < lineups.length; i++) {
//   for (let j = i + 1; j < lineups.length; j++) {
//     for (const imgUrl of lineups[i].imageSources) {
//       if (lineups[j].imageSources.includes(imgUrl)) {
//         console.debug("Duplicate lineup image detected: ", imgUrl);
//       }
//     }
//   }
// }
