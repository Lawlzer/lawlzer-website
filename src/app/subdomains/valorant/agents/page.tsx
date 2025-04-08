import React from 'react';

const agents = [
	{
		id: 1,
		name: 'Jett',
		role: 'Duelist',
		description: "Representing her home country of South Korea, Jett's agile and evasive fighting style lets her take risks no one else can.",
	},
	{
		id: 2,
		name: 'Phoenix',
		role: 'Duelist',
		description: "Hailing from the U.K., Phoenix's star power shines through in his fighting style, igniting the battlefield with flash and flare.",
	},
	{
		id: 3,
		name: 'Sage',
		role: 'Sentinel',
		description: 'The stronghold of China, Sage creates safety for herself and her team wherever she goes.',
	},
	{
		id: 4,
		name: 'Sova',
		role: 'Initiator',
		description: "Born from the eternal winter of Russia's tundra, Sova tracks, finds, and eliminates enemies with ruthless efficiency and precision.",
	},
	{
		id: 5,
		name: 'Brimstone',
		role: 'Controller',
		description: "Joining from the USA, Brimstone's orbital arsenal ensures his squad always has the advantage.",
	},
	{
		id: 6,
		name: 'Viper',
		role: 'Controller',
		description: "The American chemist, Viper deploys an array of poisonous chemical devices to control the battlefield and cripple the enemy's vision.",
	},
];

export default function AgentsPage(): React.JSX.Element {
	return (
		<div className='container mx-auto py-8 px-4'>
			<h1 className='text-4xl font-bold mb-6 text-white'>Valorant Agents</h1>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{agents.map((agent) => (
					<div key={agent.id} className='bg-white/10 rounded-lg p-6 hover:bg-white/20 transition'>
						<h2 className='text-2xl font-bold text-white mb-2'>{agent.name}</h2>
						<p className='text-white/80 mb-2'>Role: {agent.role}</p>
						<p className='text-white/80'>{agent.description}</p>
					</div>
				))}
			</div>
		</div>
	);
}
