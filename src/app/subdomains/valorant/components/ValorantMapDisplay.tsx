'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

interface ZoomControlsProps {
	zoomIn: () => void;
	zoomOut: () => void;
	resetTransform: () => void;
}

function ZoomControls({ zoomIn, zoomOut, resetTransform }: ZoomControlsProps): React.JSX.Element {
	return (
		<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className='absolute bottom-6 right-6 z-10 flex flex-col gap-2'>
			<ZoomButton onClick={zoomIn} label='Zoom in' d='M12 6v12m6-6H6' />
			<ZoomButton onClick={zoomOut} label='Zoom out' d='M18 12H6' />
			<ZoomButton onClick={resetTransform} label='Reset zoom' d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4' />
		</motion.div>
	);
}

function ZoomButton({ onClick, label, d }: { onClick: () => void; label: string; d: string }): React.JSX.Element {
	return (
		<motion.button whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }} onClick={onClick} className='group bg-gradient-to-r from-card/90 to-card/80 backdrop-blur-md rounded-xl p-3.5 shadow-lg hover:shadow-xl transition-all border border-border/50 hover:border-primary/30' aria-label={label}>
			<svg className='h-5 w-5 text-foreground group-hover:text-primary transition-colors' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
				<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={d} />
			</svg>
			<div className='absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity' />
		</motion.button>
	);
}

function MapLoadingSpinner(): React.JSX.Element {
	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='flex flex-col items-center justify-center gap-4'>
			<motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className='relative'>
				<div className='h-16 w-16 rounded-full border-4 border-primary/20' />
				<div className='absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-pulse' />
			</motion.div>
			<p className='text-secondary-text font-medium'>Loading map...</p>
		</motion.div>
	);
}

interface SidebarToggleDesktopProps {
	isSidebarOpen: boolean;
	setIsSidebarOpen: (v: boolean) => void;
	sidebarWidth: number;
}

function SidebarToggleDesktop({ isSidebarOpen, setIsSidebarOpen, sidebarWidth }: SidebarToggleDesktopProps): React.JSX.Element {
	return (
		<motion.button
			type='button'
			aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0, left: isSidebarOpen ? sidebarWidth + 16 : 16 }}
			transition={{ left: { duration: 0.3, ease: 'easeInOut' }, x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
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
	);
}

interface ValorantMapDisplayProps {
	CurrentMapSvgComponent: React.ComponentType<any> | undefined;
	buildFromAreas: () => React.ReactNode;
	buildToAreas: () => React.ReactNode;
	isSidebarOpen: boolean;
	setIsSidebarOpen: (v: boolean) => void;
	sidebarWidth: number;
}

export function ValorantMapDisplay({ CurrentMapSvgComponent, buildFromAreas, buildToAreas, isSidebarOpen, setIsSidebarOpen, sidebarWidth }: ValorantMapDisplayProps): React.JSX.Element {
	return (
		<div className='relative w-full h-full bg-gradient-to-br from-background via-secondary/5 to-primary/5 overflow-hidden' style={{ touchAction: 'manipulation' }}>
			<div className='absolute inset-0 bg-grid-small opacity-[0.02]' />
			<SidebarToggleDesktop isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} sidebarWidth={sidebarWidth} />
			<div className='relative h-full w-full flex items-center justify-center overflow-hidden'>
				{CurrentMapSvgComponent ? (
					<TransformWrapper centerOnInit initialScale={1} maxScale={5} minScale={0.5} panning={{ velocityDisabled: true }} doubleClick={{ disabled: true }}>
						{({ zoomIn, zoomOut, resetTransform }) => (
							<>
								<ZoomControls zoomIn={zoomIn} zoomOut={zoomOut} resetTransform={resetTransform} />
								<TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
									<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className='relative p-8'>
										<div className='absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 blur-3xl' />
										<CurrentMapSvgComponent className='relative max-h-full max-w-full object-contain drop-shadow-2xl filter brightness-105' newBuildFrom={buildFromAreas} newBuildTo={buildToAreas} />
									</motion.div>
								</TransformComponent>
							</>
						)}
					</TransformWrapper>
				) : (
					<MapLoadingSpinner />
				)}
			</div>
		</div>
	);
}
