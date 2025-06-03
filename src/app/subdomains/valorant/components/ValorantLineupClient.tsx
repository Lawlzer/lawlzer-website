/* eslint-disable @typescript-eslint/strict-boolean-expressions */
'use client';

import { Bars3Icon as MenuIcon, XMarkIcon as XIcon } from '@heroicons/react/24/solid'; // Corrected import path for Heroicons v2 and using solid variant
import Image, { type StaticImageData } from 'next/image.js'; // Import next/image
import React, { useCallback, useEffect, useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'; // Import zoom/pan library

import { useMapMap } from '../hooks/useMapMap'; // Updated import path
import type { Lineup, LineupImage, MapArea, Utility } from '../types'; // Use LineupImage instead of BottomleftImageVideo
import { type Agent, agents, agentUtilityMap, imageMap } from '../types';

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
		// Added padding directly to this container
		<div className='flex flex-col gap-4 overflow-y-auto p-2'>
			{images.map((imageData, index) => (
				<React.Fragment key={`lineup-image-${imageData.image.src}`}>
					<Image
						sizes='(max-width: 767px) 90vw, (max-width: 1023px) 280px, 360px'
						src={imageData.image}
						onClick={
							onImageClick
								? () => {
										onImageClick(imageData.image);
									}
								: undefined
						}
						// Adjusted sizes based on potential contexts (sidebar vs overlay)
						// Reflect sidebar widths at different breakpoints
						alt={`Lineup step ${index + 1}`}
						// Conditionally add cursor-pointer and attach click handler
						className={`border-border h-auto w-full rounded border object-contain ${onImageClick ? 'cursor-pointer' : ''}`}
					/>
					{imageData?.notes.map((note: string) => (
						<div key={`note-${note.substring(0, 20)}`} className='text-foreground -mt-3 text-center text-sm font-medium'>
							• {note}
						</div>
					))}
				</React.Fragment>
			))}
		</div>
	);
};

// Added return type
const CustomButton = ({ buttonText, isSelected, onClick, disabled }: { disabled?: boolean; buttonText: string; isSelected: boolean; onClick: () => void }): React.JSX.Element => (
	<button
		type='button'
		disabled={!!disabled}
		className={`${
			// Use theme colors with better contrast
			disabled ? 'text-secondary-text border-border cursor-not-allowed disabled:opacity-50' : isSelected ? 'font-bold shadow-md' : 'bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground'
		} rounded-md border-2 px-4 py-2 font-medium transition-colors duration-200`}
		style={
			isSelected && !disabled
				? {
						backgroundColor: 'var(--primary)',
						color: 'var(--primary-text-color)', // Use primary-text-color instead of primary-foreground
						borderColor: 'var(--primary)',
					}
				: undefined
		}
		onClick={onClick}
	>
		{buttonText}
	</button>
);

export type LineupDirection = 'destinationToStart' | 'startToDestination';
// Added return type
const ValorantLineupClient = (): React.JSX.Element => {
	// Palette State - REMOVED local initialization
	// Colors should be inherited globally via CSS variables

	// Sidebar State
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	// Lineup State (existing)
	const [map, setMap] = useState<string>('Ascent'); // Default map key
	const [agent, setAgent] = useState<Agent | undefined>('Gekko');
	const [utility, setUtility] = useState<Utility | undefined>('Mosh Pit');
	const [lineupDirection, setLineupDirection] = useState<LineupDirection>('destinationToStart');

	const [bottomleftImageVideo, setBottomleftImageVideo] = useState<LineupImage[] | null>(); // Use LineupImage

	const [fullscreen, setFullscreen] = useState<StaticImageData | undefined>(); // Use StaticImageData

	// Use specific map area types if available, otherwise string
	// These might need to be dynamically typed based on the map later if strict typing is needed
	const [primaryTo, setPrimaryTo] = useState<MapArea<string> | null>(null);
	const [primaryFrom, setPrimaryFrom] = useState<MapArea<string> | null>(null);

	// Call the hook - it now returns a stable reference
	const mapData = useMapMap();

	// NEW state for mobile fullscreen lineup overlay
	const [showMobileLineupOverlay, setShowMobileLineupOverlay] = useState(false);

	const availableMaps = Object.keys(mapData);

	// Moved resetLineup function definition up
	const resetLineup = useCallback((): void => {
		setPrimaryTo(null);
		setPrimaryFrom(null);
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
			if (lineupDirection === 'startToDestination') setPrimaryTo(null); // Clear 'to' if setting 'from' in this mode
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
			if (lineupDirection === 'destinationToStart') setPrimaryFrom(null); // Clear 'from' if setting 'to' in this mode
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
			return;
		}

		setBottomleftImageVideo(currentLineup.imageStuff);
		// Trigger the mobile overlay if a lineup is found
		setShowMobileLineupOverlay(true);
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
		// Adjusted to fill the parent container from page.tsx - Added relative positioning for sidebar overlay AND map overlay
		<div className='bg-background text-foreground relative flex h-full w-full items-stretch overflow-hidden'>
			{/* Original Fullscreen (Single Image - Desktop/Mobile) */}
			{fullscreen ? (
				<div
					className='fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/80 p-10' // Use fixed, inset-0 for true overlay
					onClick={() => {
						setFullscreen(undefined);
					}}
				>
					{/* Use next/image for fullscreen */}
					{/* Added max-w/h to prevent overflow if image is huge */}
					<Image alt='Fullscreen lineup step' className='block max-h-full max-w-full object-contain' src={fullscreen} />
				</div>
			) : null}

			{/* Sidebar Toggle Button (Mobile Only) */}
			<button
				type='button'
				aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
				className='bg-primary text-primary-foreground fixed right-4 bottom-4 z-30 rounded-full p-3 shadow-lg md:hidden' // Show only on small screens
				onClick={() => {
					setIsSidebarOpen(!isSidebarOpen);
				}}
			>
				{isSidebarOpen ? <XIcon className='h-6 w-6' /> : <MenuIcon className='h-6 w-6' />}
			</button>

			{/* Control Panel (Sidebar) */}
			{/* Added responsive classes: hidden on small screens unless open, fixed position overlay when open on small screens */}
			<div className={`// Base styles for content border-border bg-card // Mobile: Hidden or Fixed Overlay z-20 flex max-w-md flex-shrink-0 flex-col items-stretch overflow-y-auto border-r p-4 ${isSidebarOpen ? 'fixed inset-y-0 left-0 w-full shadow-lg' : 'hidden'} // Desktop: Static, specific widths, display flex md:static md:z-auto md:flex md:w-96 md:shadow-none lg:w-[480px]`}>
				{/* Close button inside sidebar for mobile */}
				<button
					type='button'
					aria-label='Close sidebar'
					className='text-secondary-text hover:text-foreground absolute top-2 right-2 md:hidden'
					onClick={() => {
						setIsSidebarOpen(false);
					}}
				>
					<XIcon className='h-6 w-6' />
				</button>
				<h2 className='text-foreground mb-4 text-center text-lg font-semibold'>Controls</h2> {/* Added title */}
				{/* Maps */}
				<div className='mb-4 flex flex-wrap justify-center gap-2'>
					{/* Use availableMaps derived from mapData */}
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
				{/* Agents */}
				<div className='mb-4 flex flex-wrap justify-center gap-2'>
					{agents.map((agentName) => {
						const lineupsExist = doesAgentHaveLineupsForMap(agentName, map);
						return (
							<CustomButton
								key={agentName}
								buttonText={agentName}
								disabled={!lineupsExist}
								isSelected={agentName === agent}
								onClick={() => {
									if (!lineupsExist || agentName === agent) return; // Don't do anything if disabled or already selected
									setAgent(agentName);
									// Utility and points reset handled by useEffect for map change
								}}
							/>
						);
					})}
				</div>
				{/* Utilities */}
				<div className='mb-4 flex flex-wrap justify-center gap-2'>
					{agent && mapData[map]
						? agentUtilityMap[agent].map((localUtility) => {
								const hasLineups = mapData[map].lineups.some((lineup: Lineup<any, any>) => lineup.agent === agent && lineup.util === localUtility);
								return (
									<CustomButton
										key={localUtility}
										buttonText={localUtility}
										disabled={!hasLineups}
										isSelected={localUtility === utility}
										onClick={() => {
											if (!hasLineups || localUtility === utility) return; // Don't do anything if disabled or already selected
											setUtility(localUtility);
											resetLineup(); // Reset points when utility changes, effect won't catch this
										}}
									/>
								);
							})
						: null}
				</div>
				{/* Lineup Direction */}
				<div className='mb-4 flex flex-wrap justify-center gap-2'>
					<CustomButton
						buttonText='Utility ➔ Agent'
						isSelected={lineupDirection === 'destinationToStart'}
						onClick={() => {
							if (lineupDirection !== 'destinationToStart') {
								setLineupDirection('destinationToStart');
								resetLineup();
							}
						}}
					/>
					<CustomButton
						buttonText='Agent ➔ Utility'
						isSelected={lineupDirection === 'startToDestination'}
						onClick={() => {
							if (lineupDirection !== 'startToDestination') {
								setLineupDirection('startToDestination');
								resetLineup();
							}
						}}
					/>
				</div>
				{/* Image/video sources container */}
				{/* This outer div controls visibility based on screen size / sidebar state */}
				<div className={`flex min-h-0 flex-grow flex-col overflow-y-auto ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
					{/* Render images component */}
					{/* LineupImagesDisplay returns null if no images */}
					{/* Pass onImageClick to enable desktop fullscreen zoom */}
					<LineupImagesDisplay images={bottomleftImageVideo} onImageClick={setFullscreen} />

					{/* Placeholder: Show only when images are absent AND this container is supposed to be visible */}
					{(!bottomleftImageVideo || bottomleftImageVideo.length === 0) && (
						<div className='text-secondary-text flex h-full flex-grow items-center justify-center p-4 text-center'>
							{' '}
							{/* Added flex-grow and padding/text-center */}
							Select a start and end point to see lineup images.
						</div>
					)}
				</div>
			</div>

			{/* Map Display Area - Wrapped with TransformWrapper */}
			{/* Adjusted padding based on multi-breakpoint sidebar */}
			{/* Added relative positioning for the mobile overlay */}
			<div className='bg-background relative flex flex-grow items-center justify-center overflow-hidden'>
				{/* Conditional rendering based on map data and SVG component */}
				{CurrentMapSvgComponent ? (
					<TransformWrapper centerOnInit initialScale={1} maxScale={5} minScale={0.5} panning={{ velocityDisabled: true }}>
						{() => (
							<>
								{/* Zoom/Pan Controls Overlay - REMOVED */}
								{/* Adjusted position based on new sidebar width (w-80) */}
								{/* 
								<div className='absolute top-2 right-2 z-10 flex flex-col gap-1 md:right-[calc(theme(spacing.80)+0.5rem)]'>
									{' '}
									<button
										onClick={() => {
											zoomIn();
										}}
										className='rounded bg-card p-1 text-foreground shadow hover:bg-accent'
									>
										<svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
											<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v12m6-6H6' />
										</svg>
									</button>
									<button
										onClick={() => {
											zoomOut();
										}}
										className='rounded bg-card p-1 text-foreground shadow hover:bg-accent'
									>
										<svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
											<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18 12H6' />
										</svg>
									</button>
									<button
										onClick={() => {
											resetTransform();
										}}
										className='rounded bg-card p-1 text-foreground shadow hover:bg-accent'
									>
										<svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
											<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h5M20 20v-5h-5M4 20l16-16' />
										</svg>
									</button>
								</div>
								 */}
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
									<CurrentMapSvgComponent
										// The parent div already centers. object-contain scales the SVG within its box.
										className='max-h-full max-w-full object-contain' // Adjust classes for direct flex child
										newBuildFrom={buildFromAreas}
										newBuildTo={buildToAreas}
									/>
								</TransformComponent>
							</>
						)}
					</TransformWrapper>
				) : (
					// Placeholder or loading state if map/SVG isn't ready
					<p className='text-foreground'>Loading map...</p>
				)}
			</div>

			{/* Mobile Fullscreen Lineup Overlay */}
			{showMobileLineupOverlay ? (
				<div
					className='fixed inset-0 z-40 flex cursor-pointer items-center justify-center bg-black/80 p-4 md:hidden'
					onClick={() => {
						setShowMobileLineupOverlay(false);
					}} // Click background to close
				>
					{/* Content area, prevents closing when clicking inside */}
					<div
						className='bg-card relative max-h-full w-full max-w-3xl cursor-default overflow-y-auto rounded p-4 shadow-lg'
						onClick={(e) => {
							e.stopPropagation();
						}} // Stop click from bubbling to background
					>
						{/* Close button inside the mobile overlay */}
						<button
							type='button'
							aria-label='Close lineup view'
							className='text-secondary-text hover:text-foreground absolute top-2 right-2 z-50'
							onClick={() => {
								setShowMobileLineupOverlay(false);
							}}
						>
							<XIcon className='h-6 w-6' />
						</button>
						{/* Render images without click-to-zoom functionality */}
						<LineupImagesDisplay images={bottomleftImageVideo} />
					</div>
				</div>
			) : null}
		</div>
	);
};

export default ValorantLineupClient;
