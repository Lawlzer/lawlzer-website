'use client';

import type { JSX } from 'react';
import React from 'react';

import { useValorantLineup } from './useValorantLineup';
import { ValorantMapDisplay } from './ValorantMapDisplay';
import { FullscreenImageOverlay, MobileLineupOverlay, MobileSidebarToggle } from './ValorantOverlays';
import { ValorantSidebar } from './ValorantSidebar';

export type { LineupDirection } from './useValorantLineup';

const ValorantLineupClient = (): JSX.Element => {
	const state = useValorantLineup();

	const configProps = {
		availableMaps: state.availableMaps,
		map: state.map,
		setMap: state.setMap,
		agent: state.agent,
		setAgent: state.setAgent,
		utility: state.utility,
		setUtility: state.setUtility,
		lineupDirection: state.lineupDirection,
		setLineupDirection: state.setLineupDirection,
		doesAgentHaveLineupsForMap: state.doesAgentHaveLineupsForMap,
		mapData: state.mapData,
		resetLineup: state.resetLineup,
		primaryFrom: state.primaryFrom,
		primaryTo: state.primaryTo,
	};

	return (
		<div className='relative flex h-full w-full' style={{ touchAction: 'manipulation' }}>
			<FullscreenImageOverlay fullscreen={state.fullscreen} setFullscreen={state.setFullscreen} />
			<MobileSidebarToggle isSidebarOpen={state.isSidebarOpen} setIsSidebarOpen={state.setIsSidebarOpen} />
			<ValorantSidebar isSidebarOpen={state.isSidebarOpen} setIsSidebarOpen={state.setIsSidebarOpen} isDesktop={state.isDesktop} sidebarWidth={state.sidebarWidth} handleMouseDown={state.handleMouseDown} showLineupSteps={state.showLineupSteps} setShowLineupSteps={state.setShowLineupSteps} bottomleftImageVideo={state.bottomleftImageVideo} setFullscreen={state.setFullscreen} configProps={configProps} />
			<ValorantMapDisplay CurrentMapSvgComponent={state.CurrentMapSvgComponent} buildFromAreas={state.buildFromAreas} buildToAreas={state.buildToAreas} isSidebarOpen={state.isSidebarOpen} setIsSidebarOpen={state.setIsSidebarOpen} sidebarWidth={state.sidebarWidth} />
			<MobileLineupOverlay show={state.showMobileLineupOverlay} bottomleftImageVideo={state.bottomleftImageVideo} setShow={state.setShowMobileLineupOverlay} setFullscreen={state.setFullscreen} />
		</div>
	);
};

export default ValorantLineupClient;
