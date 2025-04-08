import React from 'react';

const maps = [
	{
		id: 1,
		name: 'Ascent',
		description: "An open playground for small wars of position and attrition divide two sites on Ascent. Each site can be fortified by irreversible bomb doors; once they're down, you'll have to destroy them or find another way.",
	},
	{
		id: 2,
		name: 'Bind',
		description: "Two sites. No middle. Gotta pick left or right. What's it going to be? Both offer direct paths for attackers and a pair of one-way teleporters make it easier to flank.",
	},
	{
		id: 3,
		name: 'Haven',
		description: "Beneath a forgotten monastery, a clamour emerges from rival Agents clashing to control three sites. There's more territory to control, but defenders can use the extra real estate for aggressive pushes.",
	},
	{
		id: 4,
		name: 'Split',
		description: "If you want to go far, you'll have to go up. A pair of sites split by an elevated center allows for rapid movement using two rope ascenders. Each site is built with a looming tower vital for control.",
	},
	{
		id: 5,
		name: 'Icebox',
		description: 'Your next battleground is a secret Kingdom excavation site overtaken by the arctic. The two plant sites protected by snow and metal require some horizontal finesse.',
	},
	{
		id: 6,
		name: 'Breeze',
		description: "Take in the sights of historic ruins or seaside caves on this tropical paradise. But bring some cover. You'll need them for the wide open spaces and long range engagements.",
	},
];

export default function MapsPage(): React.JSX.Element {
	return (
		<div className='container mx-auto py-8 px-4'>
			<h1 className='text-4xl font-bold mb-6 text-white'>Valorant Maps</h1>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				{maps.map((map) => (
					<div key={map.id} className='bg-white/10 rounded-lg p-6 hover:bg-white/20 transition'>
						<h2 className='text-2xl font-bold text-white mb-2'>{map.name}</h2>
						<p className='text-white/80'>{map.description}</p>
					</div>
				))}
			</div>
		</div>
	);
}
