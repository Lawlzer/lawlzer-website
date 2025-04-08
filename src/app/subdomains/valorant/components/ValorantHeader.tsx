import React from 'react';
import Link from 'next/link';

export default function ValorantHeader(): React.JSX.Element {
	return (
		<header className='w-full bg-[#fa4454]/90 p-4 text-white'>
			<div className='container mx-auto flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<span className='text-2xl font-bold'>Valorant Hub</span>
				</div>
				<nav>
					<ul className='flex gap-6'>
						<li>
							<Link href='/subdomains/valorant' className='hover:text-white/80'>
								Home
							</Link>
						</li>
						<li>
							<Link href='/subdomains/valorant/agents' className='hover:text-white/80'>
								Agents
							</Link>
						</li>
						<li>
							<Link href='/subdomains/valorant/maps' className='hover:text-white/80'>
								Maps
							</Link>
						</li>
					</ul>
				</nav>
			</div>
		</header>
	);
}
