/* eslint-disable @typescript-eslint/strict-boolean-expressions */
'use client';

import { XMarkIcon as XIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import Image, { type StaticImageData } from 'next/image.js';
import React from 'react';

import type { LineupImage, Utility } from '../types';
import type { Agent } from '../types';
import { agents, agentUtilityMap } from '../types';
import type { LineupDirection } from './useValorantLineup';

interface CustomButtonProps {
	disabled?: boolean;
	buttonText: string;
	isSelected: boolean;
	onClick: () => void;
}

export function CustomButton({ buttonText, isSelected, onClick, disabled }: CustomButtonProps): React.JSX.Element {
	return (
		<motion.button type='button' disabled={!!disabled} whileHover={disabled ? {} : { scale: 1.02, y: -1 }} whileTap={disabled ? {} : { scale: 0.98 }} animate={isSelected ? { scale: 1 } : { scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} title={disabled ? `This agent does not have lineups for this map` : buttonText} className={`relative px-3 py-2 text-xs font-medium rounded-lg transition-all duration-300 truncate ${disabled ? 'cursor-not-allowed opacity-40 bg-secondary/30 text-secondary-text border border-border/30' : isSelected ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/30 ring-offset-1 ring-offset-background' : 'bg-card/50 backdrop-blur-sm border border-border/50 text-foreground hover:bg-card/80 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10'}`} onClick={onClick}>
			<span className='relative z-10 truncate'>{buttonText}</span>
			{isSelected && <motion.div layoutId='activeButtonIndicator' className='absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg' initial={false} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
			{!disabled && !isSelected && <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 hover:opacity-100 transition-opacity duration-300' />}
		</motion.button>
	);
}

interface LineupImagesDisplayProps {
	images: LineupImage[] | null | undefined;
	onImageClick?: (img: StaticImageData) => void;
}

export function LineupImagesDisplay({ images, onImageClick }: LineupImagesDisplayProps): React.JSX.Element | null {
	if (!images || images.length === 0) return null;
	return (
		<div className='flex flex-col'>
			{images.map((img, idx) => (
				<motion.div
					key={`lineup-image-${idx}`}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: idx * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
					className='group relative cursor-pointer transition-all duration-300 hover:scale-[1.02]'
					onClick={() => {
						if (onImageClick) onImageClick(img.image);
					}}
				>
					<div className='p-3 transition-all duration-300 group-hover:bg-secondary/10'>
						<div className='flex items-start gap-3'>
							<div className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-xs font-bold text-primary shadow-inner'>{idx + 1}</div>
							<div className='flex-1'>
								<div className='relative overflow-hidden rounded-lg shadow-md transition-all duration-300 group-hover:shadow-xl'>
									<motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className='relative'>
										<Image alt={`Lineup step ${idx + 1}`} className='block h-auto w-full' src={img.image} />
										<div className='absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
										<div className='absolute bottom-2 right-2 rounded-lg bg-black/50 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100'>
											<svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7' />
											</svg>
										</div>
									</motion.div>
								</div>
								{img.notes && img.notes.length > 0 && (
									<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className='mt-1.5 rounded-md bg-secondary/20 p-1.5 text-xs text-secondary-text backdrop-blur-sm'>
										{img.notes[0]}
									</motion.p>
								)}
							</div>
						</div>
					</div>
				</motion.div>
			))}
		</div>
	);
}

interface SidebarConfigProps {
	availableMaps: string[];
	map: string;
	setMap: (v: string) => void;
	agent: Agent | undefined;
	setAgent: (v: Agent) => void;
	utility: Utility | undefined;
	setUtility: (v: Utility) => void;
	lineupDirection: LineupDirection;
	setLineupDirection: (v: LineupDirection) => void;
	doesAgentHaveLineupsForMap: (a: Agent, m: string) => boolean;
	mapData: Record<string, any>;
	resetLineup: () => void;
	primaryFrom: any;
	primaryTo: any;
}

export function SidebarConfigSection(props: SidebarConfigProps): React.JSX.Element {
	const { availableMaps, map, setMap, agent, setAgent, utility, setUtility, lineupDirection, setLineupDirection, doesAgentHaveLineupsForMap, mapData, resetLineup, primaryFrom, primaryTo } = props;
	return (
		<motion.div key='configuration' initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className='flex-1 flex flex-col'>
			<ConfigSection title='Map Selection' delay={0.1} gradientFrom='from-primary' gradientTo='to-primary/50'>
				<div className='grid grid-cols-2 gap-2'>
					{availableMaps.map((m) => (
						<CustomButton
							key={m}
							buttonText={m}
							isSelected={m === map}
							onClick={() => {
								setMap(m);
							}}
						/>
					))}
				</div>
			</ConfigSection>
			<ConfigSection title='Agent Selection' delay={0.2} gradientFrom='from-primary/80' gradientTo='to-primary/40'>
				<div className='grid grid-cols-2 gap-2'>
					{agents.map((a) => {
						const exists = doesAgentHaveLineupsForMap(a, map);
						return (
							<CustomButton
								key={a}
								buttonText={a}
								disabled={!exists}
								isSelected={a === agent}
								onClick={() => {
									if (!exists || a === agent) return;
									setAgent(a);
								}}
							/>
						);
					})}
				</div>
			</ConfigSection>
			{agent && mapData[map] && (
				<ConfigSection title='Utility Selection' delay={0.3} gradientFrom='from-primary/60' gradientTo='to-primary/30'>
					<div className='grid grid-cols-2 gap-2'>
						{agentUtilityMap[agent].map((u) => {
							const has = mapData[map].lineups.some((l: any) => l.agent === agent && l.util === u);
							return (
								<CustomButton
									key={u}
									buttonText={u}
									disabled={!has}
									isSelected={u === utility}
									onClick={() => {
										if (!has || u === utility) return;
										setUtility(u);
										resetLineup();
									}}
								/>
							);
						})}
					</div>
				</ConfigSection>
			)}
			<ConfigSection title='Lineup Direction' delay={0.4} gradientFrom='from-primary/70' gradientTo='to-primary/35'>
				<div className='grid grid-cols-1 gap-2'>
					<CustomButton
						buttonText='Utility → Agent'
						isSelected={lineupDirection === 'destinationToStart'}
						onClick={() => {
							if (lineupDirection !== 'destinationToStart') {
								setLineupDirection('destinationToStart');
								resetLineup();
							}
						}}
					/>
					<CustomButton
						buttonText='Agent → Utility'
						isSelected={lineupDirection === 'startToDestination'}
						onClick={() => {
							if (lineupDirection !== 'startToDestination') {
								setLineupDirection('startToDestination');
								resetLineup();
							}
						}}
					/>
				</div>
			</ConfigSection>
			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className='mt-auto rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-3'>
				<p className='text-xs'>{!primaryFrom && !primaryTo ? <span className='text-secondary-text'>Select a start and end point on the map to see lineup images</span> : <span className='text-primary font-medium'>{primaryFrom && primaryTo ? 'Lineup selected! View the steps below.' : 'Select the second point to complete the lineup.'}</span>}</p>
			</motion.div>
		</motion.div>
	);
}

function ConfigSection({ title, delay, gradientFrom, gradientTo, children }: { title: string; delay: number; gradientFrom: string; gradientTo: string; children: React.ReactNode }): React.JSX.Element {
	return (
		<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className='mb-4 p-3 rounded-xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50'>
			<h3 className='mb-2 text-xs font-bold uppercase tracking-wider text-secondary-text flex items-center gap-2'>
				<div className={`w-1 h-3 bg-gradient-to-b ${gradientFrom} ${gradientTo} rounded-full`} />
				{title}
			</h3>
			{children}
		</motion.div>
	);
}

const SETTINGS_SVG = 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z';
const STEPS_SVG = 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';

function SidebarHeader({ showLineupSteps, setShowLineupSteps, bottomleftImageVideo }: { showLineupSteps: boolean; setShowLineupSteps: (v: boolean) => void; bottomleftImageVideo: LineupImage[] | null }): React.JSX.Element {
	return (
		<div className='mb-4 pr-4'>
			<div className='flex items-center justify-between'>
				{showLineupSteps && bottomleftImageVideo && (
					<motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className='text-2xl font-bold text-primary'>
						Lineup Steps
					</motion.h2>
				)}
				{!showLineupSteps && <div />}
				{bottomleftImageVideo && bottomleftImageVideo.length > 0 && (
					<motion.button
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => {
							setShowLineupSteps(!showLineupSteps);
						}}
						className='px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1.5'
					>
						{showLineupSteps ? (
							<>
								<svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={SETTINGS_SVG} />
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
								</svg>
								Config
							</>
						) : (
							<>
								<svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={STEPS_SVG} />
								</svg>
								Steps
							</>
						)}
					</motion.button>
				)}
			</div>
			{showLineupSteps && bottomleftImageVideo && (
				<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className='mt-2 text-sm text-secondary-text'>
					Click images to view fullscreen
				</motion.p>
			)}
		</div>
	);
}

interface SidebarProps {
	isSidebarOpen: boolean;
	setIsSidebarOpen: (v: boolean) => void;
	isDesktop: boolean;
	sidebarWidth: number;
	handleMouseDown: (e: React.MouseEvent) => void;
	showLineupSteps: boolean;
	setShowLineupSteps: (v: boolean) => void;
	bottomleftImageVideo: LineupImage[] | null;
	setFullscreen: (v: StaticImageData | undefined) => void;
	configProps: SidebarConfigProps;
}

export function ValorantSidebar(props: SidebarProps): React.JSX.Element {
	const { isSidebarOpen, setIsSidebarOpen, isDesktop, sidebarWidth, handleMouseDown, showLineupSteps, setShowLineupSteps, bottomleftImageVideo, setFullscreen, configProps } = props;
	return (
		<motion.div initial={false} animate={{ x: isSidebarOpen ? 0 : '-100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ width: isDesktop ? sidebarWidth : '100%' }} className='fixed top-0 bottom-0 left-0 z-30 flex flex-shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-border bg-gradient-to-br from-background/90 to-secondary/10 backdrop-blur-md shadow-2xl md:absolute md:shadow-none'>
			<div className='flex flex-col h-full px-4 pt-4 pb-4'>
				{isDesktop && isSidebarOpen && (
					<div className='absolute top-0 right-0 w-3 h-full cursor-col-resize bg-transparent hover:bg-primary/10 transition-colors flex items-center justify-center group' onMouseDown={handleMouseDown}>
						<div className='flex flex-col gap-1 opacity-50 group-hover:opacity-100 transition-opacity'>
							{[0, 1, 2, 3, 4].map((i) => (
								<div key={i} className='w-1 h-1 bg-foreground rounded-full' />
							))}
						</div>
					</div>
				)}
				<button
					type='button'
					aria-label='Close sidebar'
					className='absolute top-4 right-4 rounded-xl p-2.5 bg-secondary/50 backdrop-blur-sm text-secondary-text hover:bg-secondary hover:text-foreground transition-all md:hidden'
					onClick={() => {
						setIsSidebarOpen(false);
					}}
				>
					<XIcon className='h-5 w-5' />
				</button>
				<SidebarHeader showLineupSteps={showLineupSteps} setShowLineupSteps={setShowLineupSteps} bottomleftImageVideo={bottomleftImageVideo} />
				<AnimatePresence mode='wait'>
					{showLineupSteps && bottomleftImageVideo && bottomleftImageVideo.length > 0 ? (
						<motion.div key='lineup-steps' initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className='flex-1'>
							<div className='rounded-xl border border-border bg-gradient-to-br from-card/70 to-card/50 overflow-hidden'>
								<LineupImagesDisplay
									images={bottomleftImageVideo}
									onImageClick={(img) => {
										setFullscreen(img);
									}}
								/>
							</div>
						</motion.div>
					) : (
						<SidebarConfigSection {...configProps} />
					)}
				</AnimatePresence>
			</div>
		</motion.div>
	);
}
