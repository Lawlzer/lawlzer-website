/* eslint-disable @typescript-eslint/strict-boolean-expressions */
'use client';

import Image, { type StaticImageData } from 'next/image.js'; // Import next/image
import React, { useEffect, useState, useCallback } from 'react';
import { COOKIE_KEYS, DEFAULT_COLORS, setCookie } from '~/lib/palette'; // Import palette utilities

import type { Lineup, MapArea, Utility, LineupImage } from '../types'; // Use LineupImage instead of BottomleftImageVideo
import { agents, agentUtilityMap, imageMap, type Agent } from '../types';

import { useMapMap } from '../hooks/useMapMap'; // Updated import path
// Removed map-specific import, handled by useMapMap now
// import type { FromAreaTitles, ToAreaTitles } from './maps/ascent/lineups'; // Assuming this path is correct after moving files

// Removed map names, get from mapData keys if needed
// const maps = ['Ascent', 'Bind', 'Breeze', 'Fracture', 'Haven', 'Icebox', 'Lotus', 'Pearl', 'Split', 'Sunset'];

// Added return type
function CustomButton({ buttonText, isSelected, onClick, disabled }: { disabled?: boolean; buttonText: string; isSelected: boolean; onClick: () => void }): React.JSX.Element {
	return (
		<button
			disabled={!!disabled}
			className={`${
				// Use theme colors
				disabled ? 'disabled:opacity-50 text-muted-foreground border-muted cursor-not-allowed' : isSelected ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' : 'text-foreground border-border hover:bg-accent hover:text-accent-foreground'
			} px-4 py-2 rounded-md transition-colors duration-200 font-medium border-2`}
			onClick={onClick}
		>
			{buttonText}
		</button>
	);
}

export type LineupDirection = 'destinationToStart' | 'startToDestination';
// Added return type
function ValorantLineupClient(): React.JSX.Element {
	// Palette State
	const [pageBg, setPageBg] = useState<string>(DEFAULT_COLORS.PAGE_BG);
	const [fgColor, setFgColor] = useState<string>(DEFAULT_COLORS.FG_COLOR);
	const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_COLORS.PRIMARY_COLOR);

	// Lineup State (existing)
	const [map, setMap] = useState<string>('Ascent'); // Default map key
	const [agent, setAgent] = useState<Agent | undefined>('Gekko');
	const [utility, setUtility] = useState<Utility | undefined>('Mosh Pit');
	const [lineupDirection, setLineupDirection] = useState<LineupDirection>('destinationToStart');

	const [bottomleftImageVideo, setBottomleftImageVideoImages] = useState<LineupImage[] | null>(); // Use LineupImage

	const [fullscreen, setFullscreen] = useState<StaticImageData | undefined>(); // Use StaticImageData

	// Use specific map area types if available, otherwise string
	// These might need to be dynamically typed based on the map later if strict typing is needed
	const [primaryTo, setPrimaryTo] = useState<MapArea<string> | null>(null);
	const [primaryFrom, setPrimaryFrom] = useState<MapArea<string> | null>(null);

	// Call the hook - it now returns a stable reference
	const mapData = useMapMap();

	const availableMaps = Object.keys(mapData);

	// Moved resetLineup function definition up
	const resetLineup = useCallback((): void => {
		setPrimaryTo(null);
		setPrimaryFrom(null);
	}, []);

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
		setBottomleftImageVideoImages(null);
		const currentMapData = mapData[map];
		if (!currentMapData || !primaryFrom || !primaryTo || !agent || !utility) {
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
			return;
		}

		setBottomleftImageVideoImages(currentLineup.imageStuff);
	}, [primaryTo, primaryFrom, agent, utility, map, mapData]); // Rerun when relevant state or mapData changes

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
					x={area.x - 6} // Adjust based on Ascent/map.tsx original logic
					y={area.y - 6}
					width={area.width + 12}
					height={area.height + 12}
					opacity={opacity}
					pointerEvents={opacity === 0 ? 'none' : 'auto'}
					href={imageSrc} // Use agent image
					// Add data-testid for easier selection in tests
					data-testid={`map-icon-agent-${agent}`}
					data-area-title={area.title} // Add area title for potential specific clicking
					onClick={() => {
						handleAreaFromClick(area);
					}}
					// Remove cleaned-up comment
					// style={{ transition: 'opacity 0.3s ease' }} // className handles transition
				/>
			);
		});
		// Dependencies should be correct as they rely on handler refs
	}, [mapData, map, getAreaOpacity, handleAreaFromClick, agent, imageMap]);

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
					x={area.x - 10} // Adjust based on Ascent/map.tsx original logic
					y={area.y - 10}
					width={area.width + 20}
					height={area.height + 20}
					opacity={opacity}
					pointerEvents={opacity === 0 ? 'none' : 'auto'}
					href={imageSrc} // Use utility image
					// Add data-testid for easier selection in tests
					data-testid={`map-icon-utility-${utility}`}
					data-area-title={area.title} // Add area title for potential specific clicking
					onClick={() => {
						handleAreaToClick(area);
					}}
					// Remove cleaned-up comment
					// style={{ transition: 'opacity 0.3s ease' }} // className handles transition
				/>
			);
		});
		// Dependencies should be correct as they rely on handler refs
	}, [mapData, map, getAreaOpacity, handleAreaToClick, utility, imageMap]);
	// ---- End Functions to build SVG area elements ----

	// Effect 2: Apply palette colors to DOM and save to cookies when state changes
	useEffect(() => {
		// Apply colors to the DOM for instant feedback
		const bodyStyle = document.body.style;
		bodyStyle.setProperty('--page-background', pageBg);
		bodyStyle.setProperty('--background', pageBg);
		bodyStyle.setProperty('--foreground-color', fgColor);
		bodyStyle.setProperty('--foreground', fgColor);
		bodyStyle.setProperty('--primary-color', primaryColor);
		bodyStyle.setProperty('--primary', primaryColor);

		// Save colors to cookies whenever they change
		try {
			setCookie(COOKIE_KEYS.PAGE_BG, pageBg);
			setCookie(COOKIE_KEYS.FG_COLOR, fgColor);
			setCookie(COOKIE_KEYS.PRIMARY_COLOR, primaryColor);
		} catch (error) {
			// Error is logged within setCookie
		}
	}, [pageBg, fgColor, primaryColor]); // Re-run only when palette colors change

	return (
		// Adjusted to fill the parent container from page.tsx
		<div className='flex items-stretch w-full h-full bg-background text-foreground overflow-hidden'>
			{fullscreen && (
				<div
					className='fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/80 p-10' // Use fixed, inset-0 for true overlay
					onClick={() => {
						setFullscreen(undefined);
					}}
				>
					{/* Use next/image for fullscreen */}
					{/* Added max-w/h to prevent overflow if image is huge */}
					<Image src={fullscreen} className='block max-h-full max-w-full object-contain' alt='Fullscreen lineup step' />
				</div>
			)}
			{/* Control Panel */}
			<div className='flex w-[400px] flex-shrink-0 flex-col items-stretch overflow-y-auto border-r border-border bg-card p-4'>
				{' '}
				{/* Changed bg-background to bg-card for contrast */}
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
								disabled={!lineupsExist}
								buttonText={agentName}
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
					{agent &&
						mapData[map] && // Ensure agent and map data exist
						agentUtilityMap[agent].map((localUtility) => {
							const hasLineups = mapData[map].lineups.some((lineup: Lineup<any, any>) => lineup.agent === agent && lineup.util === localUtility);
							return (
								<CustomButton
									key={localUtility}
									disabled={!hasLineups}
									buttonText={localUtility}
									isSelected={localUtility === utility}
									onClick={() => {
										if (!hasLineups || localUtility === utility) return; // Don't do anything if disabled or already selected
										setUtility(localUtility);
										resetLineup(); // Reset points when utility changes, effect won't catch this
									}}
								/>
							);
						})}
				</div>
				{/* Lineup Direction */}
				<div className='mb-4 flex flex-wrap justify-center gap-2'>
					<CustomButton
						buttonText={'Start ➔ Destination'}
						isSelected={lineupDirection === 'startToDestination'}
						onClick={() => {
							if (lineupDirection !== 'startToDestination') {
								setLineupDirection('startToDestination');
								resetLineup();
							}
						}}
					/>
					<CustomButton
						buttonText={'Destination ➔ Start'}
						isSelected={lineupDirection === 'destinationToStart'}
						onClick={() => {
							if (lineupDirection !== 'destinationToStart') {
								setLineupDirection('destinationToStart');
								resetLineup();
							}
						}}
					/>
				</div>
				{/* Image/video sources */}
				<div className='flex min-h-0 flex-grow flex-col gap-4 overflow-y-auto'>
					{bottomleftImageVideo?.map((imageData, index) => (
						<React.Fragment key={index}>
							{/* Use next/image instead of img */}
							<Image
								src={imageData.image} // Pass StaticImageData directly
								alt={`Lineup step ${index + 1}`}
								className='w-full h-auto cursor-pointer rounded border border-border object-contain' // Use border-border
								onClick={() => {
									setFullscreen(imageData.image);
								}}
								// Add sizes attribute for optimization (adjust as needed)
								sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
							/>
							{imageData?.notes.map(
								(
									note: string,
									noteIndex: number // Added types for note and noteIndex
								) => (
									<div key={noteIndex} className='-mt-3 text-center text-sm font-medium text-foreground'>
										• {note}
									</div>
								)
							)}
						</React.Fragment>
					))}
					{/* Placeholder when no lineup selected/found */}
					{(!primaryFrom || !primaryTo || !bottomleftImageVideo || bottomleftImageVideo.length === 0) && <div className='flex h-full items-center justify-center text-muted-foreground'>Select a start and end point to see lineup images.</div>}
				</div>
				{/* ADD Color Customization Section HERE, within the control panel */}
				<div className='mt-8 p-4 border border-border rounded-lg bg-card text-card-foreground shadow-sm'>
					<h2 className='text-lg font-semibold mb-4'>Color Colors</h2>
					<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
						<label className='flex flex-col'>
							<span className='mb-1 text-sm font-medium'>Page Background</span>
							<input
								type='color'
								value={pageBg}
								onChange={(e) => {
									setPageBg(e.target.value);
								}}
								className='w-full h-10 rounded border border-input bg-input cursor-pointer'
							/>
						</label>
						<label className='flex flex-col'>
							<span className='mb-1 text-sm font-medium'>Foreground Text</span>
							<input
								type='color'
								value={fgColor}
								onChange={(e) => {
									setFgColor(e.target.value);
								}}
								className='w-full h-10 rounded border border-input bg-input cursor-pointer'
							/>
						</label>
						<label className='flex flex-col'>
							<span className='mb-1 text-sm font-medium'>Primary Color</span>
							<input
								type='color'
								value={primaryColor}
								onChange={(e) => {
									setPrimaryColor(e.target.value);
								}}
								className='w-full h-10 rounded border border-input bg-input cursor-pointer'
							/>
						</label>
					</div>
				</div>
			</div>

			{/* Map Display Area */}
			<div className='flex flex-grow items-center justify-center overflow-hidden bg-background'>
				{/* Conditional rendering based on map data and SVG component */}
				{CurrentMapSvgComponent ? (
					<CurrentMapSvgComponent
						// The parent div already centers. object-contain scales the SVG within its box.
						className='max-h-full max-w-full object-contain' // Adjust classes for direct flex child
						newBuildFrom={buildFromAreas}
						newBuildTo={buildToAreas}
					/>
				) : (
					// Placeholder or loading state if map/SVG isn't ready
					<p className='text-foreground'>Loading map...</p>
				)}
			</div>
		</div>
	);
}

export default ValorantLineupClient;
