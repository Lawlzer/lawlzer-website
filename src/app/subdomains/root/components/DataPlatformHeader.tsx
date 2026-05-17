import { ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import React from 'react';

export function HeaderButtons({ setShowSettingsModal, showProjectInfo, setShowProjectInfo }: { setShowSettingsModal: (v: boolean) => void; showProjectInfo: boolean; setShowProjectInfo: (v: boolean) => void }): React.JSX.Element {
	return (
		<>
			<div className='flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20'>
				<div className='h-1.5 w-1.5 rounded-full bg-primary animate-pulse' />
				<span className='text-[11px] font-medium text-primary'>Live</span>
			</div>
			<button
				type='button'
				onClick={() => {
					setShowSettingsModal(true);
				}}
				className='flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors'
				title='Open settings'
			>
				<svg className='h-3.5 w-3.5 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
					<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
				</svg>
				<span className='text-[11px] font-medium text-primary'>Settings</span>
			</button>
			<button
				type='button'
				onClick={() => {
					setShowProjectInfo(!showProjectInfo);
				}}
				className='flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors'
			>
				<svg className='h-3.5 w-3.5 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
				</svg>
				<span className='text-[11px] font-medium text-primary'>About</span>
			</button>
		</>
	);
}

export function DataPlatformHeaderBar({ animationsEnabled, setShowSettingsModal, showProjectInfo, setShowProjectInfo }: { animationsEnabled: boolean; setShowSettingsModal: (v: boolean) => void; showProjectInfo: boolean; setShowProjectInfo: (v: boolean) => void }): React.JSX.Element {
	return (
		<div className='flex-shrink-0 bg-gradient-to-b from-background via-background/95 to-transparent backdrop-blur-xl border-b border-border/50'>
			<div className='px-3 py-2 sm:px-4 sm:py-2.5'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						{animationsEnabled ? (
							<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className='flex items-center gap-3'>
								<div className='p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg'>
									<ChartBarIcon className='h-5 w-5' />
								</div>
								<div>
									<h2 className='text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent'>Data Platform</h2>
									<p className='text-xs text-secondary-text'>Explore agricultural data with dynamic filters</p>
								</div>
							</motion.div>
						) : (
							<>
								<div className='p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg'>
									<ChartBarIcon className='h-5 w-5' />
								</div>
								<div>
									<h2 className='text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent'>Data Platform</h2>
									<p className='text-xs text-secondary-text'>Explore agricultural data with dynamic filters</p>
								</div>
							</>
						)}
					</div>
					<div className='flex items-center gap-1.5'>
						{animationsEnabled ? (
							<motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className='flex items-center gap-1.5'>
								<HeaderButtons setShowSettingsModal={setShowSettingsModal} showProjectInfo={showProjectInfo} setShowProjectInfo={setShowProjectInfo} />
							</motion.div>
						) : (
							<HeaderButtons setShowSettingsModal={setShowSettingsModal} showProjectInfo={showProjectInfo} setShowProjectInfo={setShowProjectInfo} />
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export function ProjectInfoContent({ setShowProjectInfo }: { setShowProjectInfo: (v: boolean) => void }): React.JSX.Element {
	return (
		<>
			<button
				type='button'
				className='absolute top-3 right-3 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'
				onClick={() => {
					setShowProjectInfo(false);
				}}
			>
				<svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
					<path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
				</svg>
			</button>
			<div className='p-6'>
				<h3 className='text-lg font-semibold text-foreground mb-4 flex items-center gap-2'>
					<SparklesIcon className='h-5 w-5 text-primary' />
					Why This Project Was Unique
				</h3>
				<div className='space-y-3 text-sm text-muted-foreground'>
					<InfoBullet title='Complex Data Integration' text='Built for a trading firm, this platform dynamically handled data from hundreds of USDA APIs with unique formats.' />
					<InfoBullet title='Intelligent Mongoose Schema' text='Instead of handling 50+ APIs individually, we created a universal "Data Platform" that accepted any data structure, and dynamically implemented searching & filtering.' />
					<InfoBullet title='Massive Scale' text='Contained a total of ~2 billion MongoDB documents with complex aggregation queries, while maintaining sub-second response times through caching.' />
					<InfoBullet title='High Performance' text='Intelligently scraped over 1,000 pages per hour, ensuring traders had access to data within ~3 minutes of publication.' />
					<div className='flex items-start gap-3'>
						<div className='h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0' />
						<p className='italic'>
							<span className='font-medium text-foreground'>Note:</span> This demo is a HEAVILY simplified version showcasing the core concepts. The production system handled far greater complexity with real-time data streams, better filtering, advanced filtering.
						</p>
					</div>
				</div>
			</div>
		</>
	);
}

function InfoBullet({ title, text }: { title: string; text: string }): React.JSX.Element {
	return (
		<div className='flex items-start gap-3'>
			<div className='h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0' />
			<p>
				<span className='font-medium text-foreground'>{title}:</span> {text}
			</p>
		</div>
	);
}
