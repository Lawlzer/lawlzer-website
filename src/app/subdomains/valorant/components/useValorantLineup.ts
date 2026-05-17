/* eslint-disable @typescript-eslint/strict-boolean-expressions */
'use client';

import type { StaticImageData } from 'next/image.js';
import React, { useCallback, useEffect, useState } from 'react';

import { useMediaQuery } from '~/hooks/useMediaQuery';

import { useMapMap } from '../hooks/useMapMap';
import type { Lineup, LineupImage, MapArea, Utility } from '../types';
import { type Agent, agents, agentUtilityMap, imageMap } from '../types';

export type LineupDirection = 'destinationToStart' | 'startToDestination';

function computeAreaOpacity(thisArea: MapArea<string>, mapData: Record<string, any>, map: string, primaryFrom: MapArea<string> | undefined, primaryTo: MapArea<string> | undefined, lineupDirection: LineupDirection, agent: Agent | undefined, utility: Utility | undefined): number {
	const currentMapData = mapData[map];
	if (!currentMapData) return 0;
	const isRelevantLineup = (lineup: Lineup<any, any>): boolean => lineup.agent === agent && lineup.util === utility;
	const areaIsUsedInLineup = currentMapData.lineups.some((lineup: Lineup<any, any>) => isRelevantLineup(lineup) && (lineup.fromTitle === thisArea.title || lineup.toTitle === thisArea.title));
	if (!areaIsUsedInLineup) return 0;
	if (primaryTo?.title === thisArea.title || primaryFrom?.title === thisArea.title) return 1;
	const areaIsFrom = currentMapData.areasFrom.some((area: MapArea<string>) => area.title === thisArea.title);
	const areaIsTo = currentMapData.areasTo.some((area: MapArea<string>) => area.title === thisArea.title);
	if (areaIsTo && primaryFrom && !primaryTo && lineupDirection === 'startToDestination') {
		if (currentMapData.lineups.some((lineup: Lineup<any, any>) => isRelevantLineup(lineup) && lineup.fromTitle === primaryFrom.title && lineup.toTitle === thisArea.title)) return 0.5;
	}
	if (areaIsFrom && primaryTo && !primaryFrom && lineupDirection === 'destinationToStart') {
		if (currentMapData.lineups.some((lineup: Lineup<any, any>) => isRelevantLineup(lineup) && lineup.toTitle === primaryTo.title && lineup.fromTitle === thisArea.title)) return 0.5;
	}
	if (!primaryTo && !primaryFrom) {
		if (lineupDirection === 'destinationToStart' && areaIsTo) return 0.5;
		if (lineupDirection === 'startToDestination' && areaIsFrom) return 0.5;
	}
	return 0;
}

function buildAreaElements(areas: MapArea<string>[] | undefined, iconSrc: string | undefined, prefix: string, sizeDelta: number, offsetDelta: number, getOpacity: (a: MapArea<string>) => number, onClick: (a: MapArea<string>) => void, testIdPrefix: string): React.ReactNode {
	if (!areas || !iconSrc) return null;
	return areas.map((area) => {
		const opacity = getOpacity(area);
		if (opacity === 0) return null;
		return React.createElement('image', {
			key: `${prefix}-${area.title}`,
			className: 'cursor-pointer transition-opacity duration-200',
			'data-area-title': area.title,
			height: area.height + sizeDelta,
			opacity,
			pointerEvents: opacity === 0 ? 'none' : 'auto',
			width: area.width + sizeDelta,
			x: area.x - offsetDelta,
			y: area.y - offsetDelta,
			href: iconSrc,
			'data-testid': testIdPrefix,
			onClick: () => {
				onClick(area);
			},
		});
	});
}

function findInitialAgentAndUtility(mapData: Record<string, any>, map: string, doesAgentHaveLineupsForMap: (a: Agent, m: string) => boolean): { agent: Agent | undefined; utility: Utility | undefined } {
	const d = mapData[map];
	if (!d) return { agent: undefined, utility: undefined };
	for (const a of agents) {
		if (doesAgentHaveLineupsForMap(a, map)) {
			for (const u of agentUtilityMap[a]) {
				if (d.lineups.some((l: Lineup<any, any>) => l.agent === a && l.util === u)) return { agent: a, utility: u };
			}
			return { agent: a, utility: undefined };
		}
	}
	return { agent: undefined, utility: undefined };
}

export interface UseValorantLineupReturn {
	mapData: Record<string, any>;
	map: string;
	setMap: (v: string) => void;
	agent: Agent | undefined;
	setAgent: (v: Agent) => void;
	utility: Utility | undefined;
	setUtility: (v: Utility) => void;
	primaryFrom: MapArea<string> | undefined;
	primaryTo: MapArea<string> | undefined;
	lineupDirection: LineupDirection;
	setLineupDirection: (v: LineupDirection) => void;
	bottomleftImageVideo: LineupImage[] | null;
	fullscreen: StaticImageData | undefined;
	setFullscreen: (v: StaticImageData | undefined) => void;
	isDesktop: boolean;
	isSidebarOpen: boolean;
	setIsSidebarOpen: (v: boolean) => void;
	showMobileLineupOverlay: boolean;
	setShowMobileLineupOverlay: (v: boolean) => void;
	showLineupSteps: boolean;
	setShowLineupSteps: (v: boolean) => void;
	sidebarWidth: number;
	handleMouseDown: (e: React.MouseEvent) => void;
	availableMaps: string[];
	resetLineup: () => void;
	doesAgentHaveLineupsForMap: (a: Agent, m: string) => boolean;
	buildFromAreas: () => React.ReactNode;
	buildToAreas: () => React.ReactNode;
	CurrentMapSvgComponent: React.ComponentType<any> | undefined;
}

export function useValorantLineup(): UseValorantLineupReturn {
	const mapData = useMapMap();
	const [map, setMap] = useState<string>('Ascent');
	const [agent, setAgent] = useState<Agent>();
	const [utility, setUtility] = useState<Utility>();
	const [primaryFrom, setPrimaryFrom] = useState<MapArea<string>>();
	const [primaryTo, setPrimaryTo] = useState<MapArea<string>>();
	const [lineupDirection, setLineupDirection] = useState<LineupDirection>('destinationToStart');
	const [bottomleftImageVideo, setBottomleftImageVideo] = useState<LineupImage[] | null>(null);
	const [fullscreen, setFullscreen] = useState<StaticImageData | undefined>();
	const isDesktop = useMediaQuery('(min-width: 768px)');
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [showMobileLineupOverlay, setShowMobileLineupOverlay] = useState(false);
	const [showLineupSteps, setShowLineupSteps] = useState(false);
	const [sidebarWidth, setSidebarWidth] = useState<number>(420);
	const [isResizing, setIsResizing] = useState<boolean>(false);
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setIsResizing(true);
	}, []);
	useEffect(() => {
		const onMove = (e: MouseEvent): void => {
			if (!isResizing) return;
			if (e.clientX >= 300 && e.clientX <= 600) setSidebarWidth(e.clientX);
		};
		const onUp = (): void => {
			setIsResizing(false);
		};
		if (isResizing) {
			document.addEventListener('mousemove', onMove);
			document.addEventListener('mouseup', onUp);
			document.body.style.userSelect = 'none';
			document.body.style.cursor = 'col-resize';
		}
		return () => {
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onUp);
			document.body.style.userSelect = '';
			document.body.style.cursor = '';
		};
	}, [isResizing]);
	const availableMaps = Object.keys(mapData);
	const resetLineup = useCallback((): void => {
		setPrimaryTo(undefined);
		setPrimaryFrom(undefined);
		setShowMobileLineupOverlay(false);
	}, []);
	useEffect(() => {
		if (availableMaps.length > 0 && !availableMaps.includes(map)) setMap(availableMaps[0]);
	}, [availableMaps, map]);
	const getAreaOpacity = useCallback((a: MapArea<string>): number => computeAreaOpacity(a, mapData, map, primaryFrom, primaryTo, lineupDirection, agent, utility), [mapData, map, primaryFrom, primaryTo, lineupDirection, agent, utility]);
	const handleAreaFromClick = useCallback(
		(af: MapArea<string>): void => {
			if (af.title === primaryFrom?.title) {
				resetLineup();
				return;
			}
			setPrimaryFrom(af);
			if (lineupDirection === 'startToDestination') setPrimaryTo(undefined);
		},
		[primaryFrom, lineupDirection, resetLineup]
	);
	const handleAreaToClick = useCallback(
		(at: MapArea<string>): void => {
			if (at.title === primaryTo?.title) {
				resetLineup();
				return;
			}
			setPrimaryTo(at);
			if (lineupDirection === 'destinationToStart') setPrimaryFrom(undefined);
		},
		[primaryTo, lineupDirection, resetLineup]
	);
	const doesAgentHaveLineupsForMap = useCallback(
		(ta: Agent, mn: string): boolean => {
			const d = mapData[mn];
			return d ? d.lineups.some((l: Lineup<string, string>) => l.agent === ta) : false;
		},
		[mapData]
	);
	useEffect(() => {
		setBottomleftImageVideo(null);
		const d = mapData[map];
		if (!d || !primaryFrom || !primaryTo || !agent || !utility) {
			setShowMobileLineupOverlay(false);
			setShowLineupSteps(false);
			return;
		}
		const found = d.lineups.find((l: Lineup<unknown, unknown>) => l.fromTitle === primaryFrom?.title && l.toTitle === primaryTo?.title && l.util === utility && l.agent === agent);
		if (!found) {
			setShowMobileLineupOverlay(false);
			setShowLineupSteps(false);
			return;
		}
		setBottomleftImageVideo(found.imageStuff);
		setShowMobileLineupOverlay(true);
		setShowLineupSteps(true);
	}, [primaryTo, primaryFrom, agent, utility, map, mapData]);
	useEffect(() => {
		const r = findInitialAgentAndUtility(mapData, map, doesAgentHaveLineupsForMap);
		setAgent(r.agent);
		setUtility(r.utility);
		resetLineup();
	}, [map, mapData, resetLineup, doesAgentHaveLineupsForMap]);
	const buildFromAreas = useCallback((): React.ReactNode => buildAreaElements(mapData[map]?.areasFrom, agent ? imageMap[agent]?.src : undefined, 'from', 12, 6, getAreaOpacity, handleAreaFromClick, `map-icon-agent-${agent}`), [mapData, map, getAreaOpacity, handleAreaFromClick, agent]);
	const buildToAreas = useCallback((): React.ReactNode => buildAreaElements(mapData[map]?.areasTo, utility ? imageMap[utility]?.src : undefined, 'to', 20, 10, getAreaOpacity, handleAreaToClick, `map-icon-utility-${utility}`), [mapData, map, getAreaOpacity, handleAreaToClick, utility]);
	return {
		mapData,
		map,
		setMap,
		agent,
		setAgent,
		utility,
		setUtility,
		primaryFrom,
		primaryTo,
		lineupDirection,
		setLineupDirection,
		bottomleftImageVideo,
		fullscreen,
		setFullscreen,
		isDesktop,
		isSidebarOpen,
		setIsSidebarOpen,
		showMobileLineupOverlay,
		setShowMobileLineupOverlay,
		showLineupSteps,
		setShowLineupSteps,
		sidebarWidth,
		handleMouseDown,
		availableMaps,
		resetLineup,
		doesAgentHaveLineupsForMap,
		buildFromAreas,
		buildToAreas,
		CurrentMapSvgComponent: mapData[map]?.svgComponent,
	};
}
