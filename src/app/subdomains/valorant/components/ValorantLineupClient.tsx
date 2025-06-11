/* eslint-disable @typescript-eslint/strict-boolean-expressions */
'use client';

import { Bars3Icon as MenuIcon, XMarkIcon as XIcon } from '@heroicons/react/24/solid'; // Corrected import path for Heroicons v2 and using solid variant
import { AnimatePresence, motion } from 'framer-motion';
import Image, { type StaticImageData } from 'next/image.js'; // Import next/image
import React, { useCallback, useEffect, useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'; // Import zoom/pan library

import { useMapMap } from '../hooks/useMapMap'; // Updated import path
import type { Lineup, LineupImage, MapArea, Utility } from '../types'; // Use LineupImage instead of BottomleftImageVideo
import { type Agent, agents, agentUtilityMap, imageMap } from '../types';

import { useMediaQuery } from '~/hooks/useMediaQuery'; // Import media query hook

// Import palette utilities
// Removed map-specific import, handled by useMapMap now
// import type { FromAreaTitles, ToAreaTitles } from './maps/ascent/lineups'; // Assuming this path is correct after moving files

// Removed map names, get from mapData keys if needed
// const maps = ['Ascent', 'Bind', 'Breeze', 'Fracture', 'Haven', 'Icebox', 'Lotus', 'Pearl', 'Split', 'Sunset'];

// Interface for LineupImagesDisplay props
interface LineupImagesDisplayProps {
	images: LineupImage[] | null | undefined;
	// Renamed prop for clarity and flexibility
	onImageClick?: (img: StaticImageData) => void;
}

// Extracted component for displaying lineup images and notes
// Added return type React.JSX.Element | null for clarity when returning nothing
const LineupImagesDisplay = ({ images, onImageClick }: LineupImagesDisplayProps): React.JSX.Element | null => {
	// Return null if no images, parent component handles placeholder logic/visibility
	if (!images || images.length === 0) {
		return null;
	}

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
						if (onImageClick) {
							onImageClick(img.image);
						}
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
};

// Added return type
const CustomButton = ({ buttonText, isSelected, onClick, disabled }: { disabled?: boolean; buttonText: string; isSelected: boolean; onClick: () => void }): React.JSX.Element => (
	<motion.button
		type='button'
		disabled={!!disabled}
		whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
		whileTap={disabled ? {} : { scale: 0.98 }}
		animate={isSelected ? { scale: 1 } : { scale: 1 }}
		transition={{ type: 'spring', stiffness: 400, damping: 25 }}
		title={disabled ? `This agent does not have lineups for this map` : buttonText}
		className={`
			relative px-3 py-2 text-xs font-medium rounded-lg transition-all duration-300 truncate
			${disabled ? 'cursor-not-allowed opacity-40 bg-secondary/30 text-secondary-text border border-border/30' : isSelected ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/30 ring-offset-1 ring-offset-background' : 'bg-card/50 backdrop-blur-sm border border-border/50 text-foreground hover:bg-card/80 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10'}
		`}
		onClick={onClick}
	>
		<span className='relative z-10 truncate'>{buttonText}</span>
		{isSelected && <motion.div layoutId='activeButtonIndicator' className='absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg' initial={false} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
		{!disabled && !isSelected && <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 hover:opacity-100 transition-opacity duration-300' />}
	</motion.button>
);

export type LineupDirection = 'destinationToStart' | 'startToDestination';
// Added return type
const ValorantLineupClient = (): React.JSX.Element => {
	// Get map data using the hook first
	const mapData = useMapMap();

	// State
	const [map, setMap] = useState<string>('Ascent');
	const [agent, setAgent] = useState<Agent>();
	const [utility, setUtility] = useState<Utility>();
	const [primaryFrom, setPrimaryFrom] = useState<MapArea<string>>();
	const [primaryTo, setPrimaryTo] = useState<MapArea<string>>();
	const [lineupDirection, setLineupDirection] = useState<LineupDirection>('destinationToStart');
	const [bottomleftImageVideo, setBottomleftImageVideo] = useState<LineupImage[] | null>(null);
	const [fullscreen, setFullscreen] = useState<StaticImageData | undefined>();

	// Mobile/Desktop specific states
	const isDesktop = useMediaQuery('(min-width: 768px)');
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [showMobileLineupOverlay, setShowMobileLineupOverlay] = useState(false);
	const [showLineupSteps, setShowLineupSteps] = useState(false); // New state for showing lineup steps in sidebar

	// Add state for sidebar width
	const [sidebarWidth, setSidebarWidth] = useState<number>(420); // Default width in pixels
	const [isResizing, setIsResizing] = useState<boolean>(false);

	// Handle resize
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setIsResizing(true);
	}, []);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isResizing) return;

			const newWidth = e.clientX;
			// Set min/max width constraints
			if (newWidth >= 300 && newWidth <= 600) {
				setSidebarWidth(newWidth);
			}
		};

		const handleMouseUp = () => {
			setIsResizing(false);
		};

		if (isResizing) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			// Prevent text selection while resizing
			document.body.style.userSelect = 'none';
			document.body.style.cursor = 'col-resize';
		}

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			document.body.style.userSelect = '';
			document.body.style.cursor = '';
		};
	}, [isResizing]);

	// Compute available maps
	const availableMaps = Object.keys(mapData);

	// Moved resetLineup function definition up
	const resetLineup = useCallback((): void => {
		setPrimaryTo(undefined);
		setPrimaryFrom(undefined);
		// Also hide mobile overlay on reset
		setShowMobileLineupOverlay(false);
	}, [setShowMobileLineupOverlay]);

	// Initialize map state with the first available map
	useEffect(() => {
		if (availableMaps.length > 0 && !availableMaps.includes(map)) {
			setMap(availableMaps[0]);
		}
	}, [availableMaps, map]); // Run when maps load or if map state is somehow invalid

	// ---- Memoized function definitions ----
	const getAreaOpacity = useCallback(
		(thisArea: MapArea<string>): number => {
			const currentMapData = mapData[map];

			if (!currentMapData) {
				return 0; // Map data not loaded yet
			}

			const isRelevantLineup = (lineup: Lineup<any, any>): boolean => lineup.agent === agent && lineup.util === utility;

			const areaIsUsedInLineup = currentMapData.lineups.some((lineup) => isRelevantLineup(lineup) && (lineup.fromTitle === thisArea.title || lineup.toTitle === thisArea.title));
			if (!areaIsUsedInLineup) {
				return 0; // Not used at all, fully transparent
			}

			const isPrimaryArea = primaryTo?.title === thisArea.title || primaryFrom?.title === thisArea.title;
			if (isPrimaryArea) {
				return 1; // Is the selected 'from' or 'to' area, fully opaque
			}

			const areaIsFrom = currentMapData.areasFrom.some((area) => area.title === thisArea.title);
			const areaIsTo = currentMapData.areasTo.some((area) => area.title === thisArea.title);

			// Logic when a 'from' area is selected (startToDestination mode)
			if (areaIsTo && primaryFrom && !primaryTo && lineupDirection === 'startToDestination') {
				const usedInLineupWithPrimaryFrom = currentMapData.lineups.some((lineup) => isRelevantLineup(lineup) && lineup.fromTitle === primaryFrom.title && lineup.toTitle === thisArea.title);
				if (usedInLineupWithPrimaryFrom) {
					return 0.5; // It's a possible destination, semi-transparent
				}
			}

			// Logic when a 'to' area is selected (destinationToStart mode)
			if (areaIsFrom && primaryTo && !primaryFrom && lineupDirection === 'destinationToStart') {
				const usedInLineupWithPrimaryTo = currentMapData.lineups.some((lineup) => isRelevantLineup(lineup) && lineup.toTitle === primaryTo.title && lineup.fromTitle === thisArea.title);
				if (usedInLineupWithPrimaryTo) {
					return 0.5; // It's a possible start, semi-transparent
				}
			}

			// Logic when no area is selected
			if (!primaryTo && !primaryFrom) {
				if (lineupDirection === 'destinationToStart' && areaIsTo) {
					return 0.5; // Show all potential destinations
				}
				if (lineupDirection === 'startToDestination' && areaIsFrom) {
					return 0.5; // Show all potential starts
				}
			}

			// Default: not relevant in the current selection context
			return 0;
		},
		[mapData, map, primaryFrom, primaryTo, lineupDirection, agent, utility]
	); // Add dependencies

	// Restore original handleAreaFromClick logic and dependencies
	const handleAreaFromClick = useCallback(
		(areaFrom: MapArea<string>): void => {
			if (areaFrom.title === primaryFrom?.title) {
				resetLineup();
				return;
			}
			setPrimaryFrom(areaFrom);
			if (lineupDirection === 'startToDestination') setPrimaryTo(undefined); // Clear 'to' if setting 'from' in this mode
		},
		// Restore full dependencies
		[primaryFrom, lineupDirection, resetLineup, setPrimaryFrom, setPrimaryTo]
	);

	// Restore original handleAreaToClick logic and dependencies
	const handleAreaToClick = useCallback(
		(areaTo: MapArea<string>): void => {
			if (areaTo.title === primaryTo?.title) {
				resetLineup();
				return;
			}
			setPrimaryTo(areaTo);
			if (lineupDirection === 'destinationToStart') setPrimaryFrom(undefined); // Clear 'from' if setting 'to' in this mode
		},
		// Restore full dependencies
		[primaryTo, lineupDirection, resetLineup, setPrimaryFrom, setPrimaryTo]
	);
	// --- END Memoized function definitions ---

	// Moved this definition up
	const doesAgentHaveLineupsForMap = useCallback(
		(targetAgent: Agent, mapName: string): boolean => {
			const currentMapData = mapData[mapName];
			if (!currentMapData) return false;
			return currentMapData.lineups.some((lineup: Lineup<string, string>) => lineup.agent === targetAgent);
		},
		[mapData]
	);
	// -----------------------------------------------

	// Effect to update lineup images when selection changes
	useEffect(() => {
		setBottomleftImageVideo(null);
		const currentMapData = mapData[map];
		if (!currentMapData || !primaryFrom || !primaryTo || !agent || !utility) {
			setShowMobileLineupOverlay(false); // Ensure overlay is hidden if conditions aren't met
			setShowLineupSteps(false); // Reset lineup steps view
			return; // Need map data and both points selected
		}

		const currentLineup = currentMapData.lineups.find((lineup: Lineup<unknown, unknown>) => {
			const match = lineup.fromTitle === primaryFrom?.title && lineup.toTitle === primaryTo?.title && lineup.util === utility && lineup.agent === agent;
			// Log each comparison for debugging
			// if (match) {
			// 	console.log('[Lineup Effect] Match found:', lineup);
			// }
			return match;
		});

		if (!currentLineup) {
			// Optionally log the first few lineups for comparison:
			// console.log('[Lineup Effect] First few lineups:', currentMapData.lineups.slice(0, 3));
			setShowMobileLineupOverlay(false); // Ensure overlay is hidden if no lineup found
			setShowLineupSteps(false); // Reset lineup steps view
			return;
		}

		setBottomleftImageVideo(currentLineup.imageStuff);
		// Trigger the mobile overlay if a lineup is found
		setShowMobileLineupOverlay(true);
		// Automatically show lineup steps when a lineup is found
		setShowLineupSteps(true);
	}, [primaryTo, primaryFrom, agent, utility, map, mapData, setShowMobileLineupOverlay]); // Rerun when relevant state or mapData changes // Added setShowMobileLineupOverlay dependency

	// Effect to set initial agent/utility when map changes
	useEffect(() => {
		const currentMapData = mapData[map];
		if (!currentMapData) return;

		let newAgent: Agent | undefined = undefined;
		let newUtility: Utility | undefined = undefined;

		for (const currentAgent of agents) {
			// Outer loop
			if (doesAgentHaveLineupsForMap(currentAgent, map)) {
				newAgent = currentAgent;
				// Find the first utility for this agent on this map
				// Create a stable reference for the current agent for the inner loop's callback
				const agentForInnerLoop = newAgent;
				for (const currentUtility of agentUtilityMap[agentForInnerLoop]) {
					// Inner loop
					// The .some() callback now correctly references the agent for this outer loop iteration
					if (currentMapData.lineups.some((lineup) => lineup.agent === agentForInnerLoop && lineup.util === currentUtility)) {
						newUtility = currentUtility;
						break; // Found first utility, break inner loop
					}
				}
				break; // Found first agent, break outer loop
			}
		}

		setAgent(newAgent);
		setUtility(newUtility);
		resetLineup();
	}, [map, mapData, resetLineup, doesAgentHaveLineupsForMap]); // Added missing dependencies

	// Get the component type for the current map
	const CurrentMapSvgComponent = mapData[map]?.svgComponent;

	// ---- Functions to build SVG area elements ----
	const buildFromAreas = useCallback((): React.ReactNode => {
		const currentAreasFrom = mapData[map]?.areasFrom;
		if (!agent || !currentAreasFrom) return null; // Need agent for image
		const imageSrc = imageMap[agent]?.src;
		if (!imageSrc) return null; // Ensure agent image exists

		return currentAreasFrom.map((area) => {
			const opacity = getAreaOpacity(area);
			if (opacity === 0) return null; // Don't render invisible areas

			return (
				<image // Use image instead of rect to show agent icons
					key={`from-${area.title}`}
					className='cursor-pointer transition-opacity duration-200'
					data-area-title={area.title} // Add area title for potential specific clicking
					height={area.height + 12}
					opacity={opacity}
					pointerEvents={opacity === 0 ? 'none' : 'auto'}
					width={area.width + 12}
					x={area.x - 6} // Adjust based on Ascent/map.tsx original logic
					y={area.y - 6}
					href={imageSrc} // Use agent image
					// Add data-testid for easier selection in tests
					data-testid={`map-icon-agent-${agent}`}
					onClick={() => {
						handleAreaFromClick(area);
					}}
					// Remove cleaned-up comment
					// style={{ transition: 'opacity 0.3s ease' }} // className handles transition
				/>
			);
		});
		// Dependencies should be correct as they rely on handler refs
	}, [mapData, map, getAreaOpacity, handleAreaFromClick, agent]);

	const buildToAreas = useCallback((): React.ReactNode => {
		const currentAreasTo = mapData[map]?.areasTo;
		if (!utility || !currentAreasTo) return null; // Need utility for image
		const imageSrc = imageMap[utility]?.src;
		if (!imageSrc) return null; // Ensure utility image exists

		return currentAreasTo.map((area) => {
			const opacity = getAreaOpacity(area);
			if (opacity === 0) return null; // Don't render invisible areas

			return (
				<image // Use image instead of rect to show utility icons
					key={`to-${area.title}`}
					className='cursor-pointer transition-opacity duration-200'
					data-area-title={area.title} // Add area title for potential specific clicking
					height={area.height + 20}
					opacity={opacity}
					pointerEvents={opacity === 0 ? 'none' : 'auto'}
					width={area.width + 20}
					x={area.x - 10} // Adjust based on Ascent/map.tsx original logic
					y={area.y - 10}
					href={imageSrc} // Use utility image
					// Add data-testid for easier selection in tests
					data-testid={`map-icon-utility-${utility}`}
					onClick={() => {
						handleAreaToClick(area);
					}}
					// Remove cleaned-up comment
					// style={{ transition: 'opacity 0.3s ease' }} // className handles transition
				/>
			);
		});
		// Dependencies should be correct as they rely on handler refs
	}, [mapData, map, getAreaOpacity, handleAreaToClick, utility]);
	// ---- End Functions to build SVG area elements ----

	return (
		<div className='relative flex h-full w-full' style={{ touchAction: 'manipulation' }}>
			{/* Original Fullscreen (Single Image - Desktop/Mobile) */}
			<AnimatePresence>
				{fullscreen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/95 backdrop-blur-xl p-4'
						onClick={() => {
							setFullscreen(undefined);
						}}
					>
						<motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className='relative max-h-[90vh] max-w-[90vw]'>
							<div className='absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 blur-3xl' />
							<Image alt='Fullscreen lineup step' className='relative block h-full w-full object-contain rounded-2xl shadow-2xl ring-1 ring-white/10' src={fullscreen} />
							<motion.button
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
								className='absolute top-4 right-4 bg-white/10 backdrop-blur-xl rounded-full p-3 text-white hover:bg-white/20 transition-all shadow-lg'
								onClick={(e) => {
									e.stopPropagation();
									setFullscreen(undefined);
								}}
							>
								<XIcon className='h-6 w-6' />
							</motion.button>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Sidebar Toggle Button (Mobile Only) */}
			<motion.button
				type='button'
				aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ delay: 0.5, type: 'spring', stiffness: 400 }}
				className='fixed right-4 bottom-4 z-30 rounded-full bg-primary p-4 text-primary-foreground shadow-xl shadow-primary/25 md:hidden'
				onClick={() => {
					setIsSidebarOpen(!isSidebarOpen);
				}}
			>
				{isSidebarOpen ? <XIcon className='h-5 w-5' /> : <MenuIcon className='h-5 w-5' />}
			</motion.button>

			{/* Control Panel (Sidebar) */}
			<motion.div
				initial={false}
				animate={{
					x: isSidebarOpen ? 0 : '-100%',
				}}
				transition={{ type: 'spring', stiffness: 300, damping: 30 }}
				style={{ width: isDesktop ? sidebarWidth : '100%' }}
				className={`
				fixed top-0 bottom-0 left-0 z-30 flex flex-shrink-0 flex-col overflow-y-auto overflow-x-hidden
				border-r border-border bg-gradient-to-br from-background/90 to-secondary/10 backdrop-blur-md shadow-2xl
				md:absolute md:shadow-none
			`}
			>
				{/* Padding wrapper to avoid content being cut by scrollbar */}
				<div className='flex flex-col h-full px-4 pt-4 pb-4'>
					{/* Resize handle for desktop */}
					{isDesktop && isSidebarOpen && (
						<div className='absolute top-0 right-0 w-3 h-full cursor-col-resize bg-transparent hover:bg-primary/10 transition-colors flex items-center justify-center group' onMouseDown={handleMouseDown}>
							{/* Visible grip dots */}
							<div className='flex flex-col gap-1 opacity-50 group-hover:opacity-100 transition-opacity'>
								<div className='w-1 h-1 bg-foreground rounded-full' />
								<div className='w-1 h-1 bg-foreground rounded-full' />
								<div className='w-1 h-1 bg-foreground rounded-full' />
								<div className='w-1 h-1 bg-foreground rounded-full' />
								<div className='w-1 h-1 bg-foreground rounded-full' />
							</div>
						</div>
					)}

					{/* Close button inside sidebar for mobile */}
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

					{/* Header with toggle button */}
					<div className='mb-4 pr-4'>
						<div className='flex items-center justify-between'>
							{showLineupSteps && bottomleftImageVideo && (
								<motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className='text-2xl font-bold text-primary'>
									Lineup Steps
								</motion.h2>
							)}
							{!showLineupSteps && <div />} {/* Empty div to maintain layout */}
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
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
											</svg>
											Config
										</>
									) : (
										<>
											<svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
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

					{/* Content based on toggle */}
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
							<motion.div key='configuration' initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className='flex-1 flex flex-col'>
								{/* Maps Section */}
								<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className='mb-4 p-3 rounded-xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50'>
									<h3 className='mb-2 text-xs font-bold uppercase tracking-wider text-secondary-text flex items-center gap-2'>
										<div className='w-1 h-3 bg-gradient-to-b from-primary to-primary/50 rounded-full' />
										Map Selection
									</h3>
									<div className='grid grid-cols-2 gap-2'>
										{availableMaps.map((thisMap) => (
											<CustomButton
												key={thisMap}
												buttonText={thisMap}
												isSelected={thisMap === map}
												onClick={() => {
													setMap(thisMap);
												}}
											/>
										))}
									</div>
								</motion.div>

								{/* Agents Section */}
								<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className='mb-4 p-3 rounded-xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50'>
									<h3 className='mb-2 text-xs font-bold uppercase tracking-wider text-secondary-text flex items-center gap-2'>
										<div className='w-1 h-3 bg-gradient-to-b from-primary/80 to-primary/40 rounded-full' />
										Agent Selection
									</h3>
									<div className='grid grid-cols-2 gap-2'>
										{agents.map((agentName) => {
											const lineupsExist = doesAgentHaveLineupsForMap(agentName, map);
											return (
												<CustomButton
													key={agentName}
													buttonText={agentName}
													disabled={!lineupsExist}
													isSelected={agentName === agent}
													onClick={() => {
														if (!lineupsExist || agentName === agent) return;
														setAgent(agentName);
													}}
												/>
											);
										})}
									</div>
								</motion.div>

								{/* Utilities Section */}
								{agent && mapData[map] && (
									<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className='mb-4 p-3 rounded-xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50'>
										<h3 className='mb-2 text-xs font-bold uppercase tracking-wider text-secondary-text flex items-center gap-2'>
											<div className='w-1 h-3 bg-gradient-to-b from-primary/60 to-primary/30 rounded-full' />
											Utility Selection
										</h3>
										<div className='grid grid-cols-2 gap-2'>
											{agentUtilityMap[agent].map((localUtility) => {
												const hasLineups = mapData[map].lineups.some((lineup: Lineup<any, any>) => lineup.agent === agent && lineup.util === localUtility);
												return (
													<CustomButton
														key={localUtility}
														buttonText={localUtility}
														disabled={!hasLineups}
														isSelected={localUtility === utility}
														onClick={() => {
															if (!hasLineups || localUtility === utility) return;
															setUtility(localUtility);
															resetLineup();
														}}
													/>
												);
											})}
										</div>
									</motion.div>
								)}

								{/* Lineup Direction Section */}
								<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className='mb-4 p-3 rounded-xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50'>
									<h3 className='mb-2 text-xs font-bold uppercase tracking-wider text-secondary-text flex items-center gap-2'>
										<div className='w-1 h-3 bg-gradient-to-b from-primary/70 to-primary/35 rounded-full' />
										Lineup Direction
									</h3>
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
								</motion.div>

								{/* Instructions */}
								<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className='mt-auto rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-3'>
									<p className='text-xs'>{!primaryFrom && !primaryTo ? <span className='text-secondary-text'>Select a start and end point on the map to see lineup images</span> : <span className='text-primary font-medium'>{primaryFrom && primaryTo ? 'Lineup selected! View the steps below.' : 'Select the second point to complete the lineup.'}</span>}</p>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</motion.div>

			{/* Map Display Area */}
			<div className='relative w-full h-full bg-gradient-to-br from-background via-secondary/5 to-primary/5 overflow-hidden' style={{ touchAction: 'manipulation' }}>
				<div className='absolute inset-0 bg-grid-small opacity-[0.02]' />

				{/* Sidebar Toggle Button (Desktop) */}
				<motion.button
					type='button'
					aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					initial={{ opacity: 0, x: -20 }}
					animate={{
						opacity: 1,
						x: 0,
						left: isSidebarOpen ? sidebarWidth + 16 : 16,
					}}
					transition={{
						left: { duration: 0.3, ease: 'easeInOut' },
						x: { type: 'spring', stiffness: 300, damping: 30 },
						opacity: { duration: 0.2 },
					}}
					className='absolute top-4 z-40 hidden md:flex items-center gap-2 rounded-xl bg-card/90 backdrop-blur-md px-3 py-2 shadow-lg hover:shadow-xl transition-all border border-border/50 hover:border-primary/30'
					onClick={() => {
						setIsSidebarOpen(!isSidebarOpen);
					}}
				>
					{isSidebarOpen ? (
						<>
							<svg className='h-4 w-4 text-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 19l-7-7 7-7m8 14l-7-7 7-7' />
							</svg>
							<span className='text-sm font-medium text-foreground'>Hide Panel</span>
						</>
					) : (
						<>
							<svg className='h-4 w-4 text-foreground' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 5l7 7-7 7M5 5l7 7-7 7' />
							</svg>
							<span className='text-sm font-medium text-foreground'>Show Panel</span>
						</>
					)}
				</motion.button>

				{/* Map Viewport */}
				<div className='relative h-full w-full flex items-center justify-center overflow-hidden'>
					{CurrentMapSvgComponent ? (
						<TransformWrapper centerOnInit initialScale={1} maxScale={5} minScale={0.5} panning={{ velocityDisabled: true }} doubleClick={{ disabled: true }}>
							{({ zoomIn, zoomOut, resetTransform }) => (
								<>
									{/* Zoom Controls */}
									<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className='absolute bottom-6 right-6 z-10 flex flex-col gap-2'>
										<motion.button
											whileHover={{ scale: 1.05, x: -2 }}
											whileTap={{ scale: 0.95 }}
											onClick={() => {
												zoomIn();
											}}
											className='group bg-gradient-to-r from-card/90 to-card/80 backdrop-blur-md rounded-xl p-3.5 shadow-lg hover:shadow-xl transition-all border border-border/50 hover:border-primary/30'
											aria-label='Zoom in'
										>
											<svg className='h-5 w-5 text-foreground group-hover:text-primary transition-colors' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v12m6-6H6' />
											</svg>
											<div className='absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity' />
										</motion.button>
										<motion.button
											whileHover={{ scale: 1.05, x: -2 }}
											whileTap={{ scale: 0.95 }}
											onClick={() => {
												zoomOut();
											}}
											className='group bg-gradient-to-r from-card/90 to-card/80 backdrop-blur-md rounded-xl p-3.5 shadow-lg hover:shadow-xl transition-all border border-border/50 hover:border-primary/30'
											aria-label='Zoom out'
										>
											<svg className='h-5 w-5 text-foreground group-hover:text-primary transition-colors' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18 12H6' />
											</svg>
											<div className='absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity' />
										</motion.button>
										<motion.button
											whileHover={{ scale: 1.05, x: -2 }}
											whileTap={{ scale: 0.95 }}
											onClick={() => {
												resetTransform();
											}}
											className='group bg-gradient-to-r from-card/90 to-card/80 backdrop-blur-md rounded-xl p-3.5 shadow-lg hover:shadow-xl transition-all border border-border/50 hover:border-primary/30'
											aria-label='Reset zoom'
										>
											<svg className='h-5 w-5 text-foreground group-hover:text-primary transition-colors' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4' />
											</svg>
											<div className='absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity' />
										</motion.button>
									</motion.div>

									<TransformComponent
										wrapperStyle={{ width: '100%', height: '100%' }}
										contentStyle={{
											width: '100%',
											height: '100%',
											display: 'flex',
											justifyContent: 'center',
											alignItems: 'center',
										}}
									>
										<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className='relative p-8'>
											<div className='absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 blur-3xl' />
											<CurrentMapSvgComponent className='relative max-h-full max-w-full object-contain drop-shadow-2xl filter brightness-105' newBuildFrom={buildFromAreas} newBuildTo={buildToAreas} />
										</motion.div>
									</TransformComponent>
								</>
							)}
						</TransformWrapper>
					) : (
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='flex flex-col items-center justify-center gap-4'>
							<motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className='relative'>
								<div className='h-16 w-16 rounded-full border-4 border-primary/20' />
								<div className='absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-pulse' />
							</motion.div>
							<p className='text-secondary-text font-medium'>Loading map...</p>
						</motion.div>
					)}
				</div>
			</div>

			{/* Mobile Fullscreen Lineup Overlay */}
			<AnimatePresence>
				{showMobileLineupOverlay && bottomleftImageVideo && bottomleftImageVideo.length > 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-40 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:hidden'
						onClick={() => {
							setShowMobileLineupOverlay(false);
						}}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0, y: 50 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.9, opacity: 0, y: 50 }}
							transition={{ type: 'spring', stiffness: 400, damping: 30 }}
							className='relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl shadow-2xl'
							onClick={(e) => {
								e.stopPropagation();
							}}
						>
							{/* Header */}
							<div className='sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 backdrop-blur-xl p-5'>
								<div>
									<h3 className='text-lg font-bold text-foreground'>Lineup Steps</h3>
									<p className='text-sm text-secondary-text mt-0.5'>Tap images to view fullscreen</p>
								</div>
								<motion.button
									type='button'
									aria-label='Close lineup view'
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.9 }}
									className='rounded-xl bg-secondary/50 backdrop-blur-sm p-2.5 text-secondary-text hover:bg-secondary hover:text-foreground transition-all'
									onClick={() => {
										setShowMobileLineupOverlay(false);
									}}
								>
									<XIcon className='h-5 w-5' />
								</motion.button>
							</div>

							{/* Content */}
							<div className='overflow-y-auto max-h-[calc(90vh-5rem)] bg-gradient-to-b from-transparent to-background/5'>
								<LineupImagesDisplay
									images={bottomleftImageVideo}
									onImageClick={(img) => {
										setFullscreen(img);
										setShowMobileLineupOverlay(false);
									}}
								/>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default ValorantLineupClient;
