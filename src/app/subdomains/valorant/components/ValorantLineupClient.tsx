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
		className={`
			relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
			${disabled ? 'cursor-not-allowed opacity-40 bg-secondary text-secondary-text' : isSelected ? 'bg-primary text-primary-foreground shadow-md transform scale-105 ring-2 ring-primary/30' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground hover:shadow-sm'}
		`}
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
			<div
				className={`
				flex flex-shrink-0 flex-col overflow-y-auto border-r border-border bg-background p-6
				${isSidebarOpen ? 'fixed inset-y-0 left-0 z-20 w-full shadow-xl' : 'hidden'}
				md:static md:z-auto md:flex md:w-96 md:shadow-none lg:w-[420px]
			`}
			>
				{/* Close button inside sidebar for mobile */}
				<button
					type='button'
					aria-label='Close sidebar'
					className='absolute top-4 right-4 text-secondary-text hover:text-foreground md:hidden'
					onClick={() => {
						setIsSidebarOpen(false);
					}}
				>
					<XIcon className='h-6 w-6' />
				</button>

				<h2 className='mb-6 text-2xl font-bold text-primary'>Controls</h2>

				{/* Maps Section */}
				<div className='mb-6'>
					<h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-secondary-text'>Select Map</h3>
					<div className='flex flex-wrap gap-2'>
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
				</div>

				{/* Agents Section */}
				<div className='mb-6'>
					<h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-secondary-text'>Select Agent</h3>
					<div className='flex flex-wrap gap-2'>
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
				</div>

				{/* Utilities Section */}
				{agent && mapData[map] && (
					<div className='mb-6'>
						<h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-secondary-text'>Select Utility</h3>
						<div className='flex flex-wrap gap-2'>
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
					</div>
				)}

				{/* Lineup Direction Section */}
				<div className='mb-6'>
					<h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-secondary-text'>Direction</h3>
					<div className='flex flex-wrap gap-2'>
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
				</div>

				{/* Lineup Images Section */}
				<div className={`mt-6 flex min-h-0 flex-grow flex-col ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
					{bottomleftImageVideo && bottomleftImageVideo.length > 0 ? (
						<>
							<h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-secondary-text'>Lineup Steps</h3>
							<div className='flex-grow overflow-hidden rounded-lg border border-border bg-secondary/30'>
								<LineupImagesDisplay images={bottomleftImageVideo} onImageClick={setFullscreen} />
							</div>
						</>
					) : (
						<div className='flex flex-grow items-center justify-center rounded-lg border border-dashed border-border bg-secondary/10 p-8'>
							<p className='text-center text-sm text-secondary-text'>Select a start and end point on the map to see lineup images</p>
						</div>
					)}
				</div>
			</div>

			{/* Map Display Area */}
			<div className='relative flex-1 min-h-0 bg-secondary/5'>
				{/* Map Viewport */}
				<div className='h-full flex items-center justify-center'>
					{CurrentMapSvgComponent ? (
						<TransformWrapper centerOnInit initialScale={1} maxScale={5} minScale={0.5} panning={{ velocityDisabled: true }}>
							{({ zoomIn, zoomOut, resetTransform }) => (
								<>
									{/* Zoom Controls */}
									<div className='absolute bottom-4 right-4 z-10 flex flex-col gap-2'>
										<button
											onClick={() => {
												zoomIn();
											}}
											className='bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-md hover:bg-background transition-all hover:scale-110'
											aria-label='Zoom in'
										>
											<svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v12m6-6H6' />
											</svg>
										</button>
										<button
											onClick={() => {
												zoomOut();
											}}
											className='bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-md hover:bg-background transition-all hover:scale-110'
											aria-label='Zoom out'
										>
											<svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18 12H6' />
											</svg>
										</button>
										<button
											onClick={() => {
												resetTransform();
											}}
											className='bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-md hover:bg-background transition-all hover:scale-110'
											aria-label='Reset zoom'
										>
											<svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4' />
											</svg>
										</button>
									</div>

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
										<CurrentMapSvgComponent className='max-h-full max-w-full object-contain' newBuildFrom={buildFromAreas} newBuildTo={buildToAreas} />
									</TransformComponent>
								</>
							)}
						</TransformWrapper>
					) : (
						<div className='flex flex-col items-center justify-center'>
							<div className='mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
							<p className='text-secondary-text'>Loading map...</p>
						</div>
					)}
				</div>
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
