'use client';

import { Bars3Icon as MenuIcon, XMarkIcon as XIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import Image, { type StaticImageData } from 'next/image.js';
import React from 'react';

import type { LineupImage } from '../types';
import { LineupImagesDisplay } from './ValorantSidebar';

export function FullscreenImageOverlay({ fullscreen, setFullscreen }: { fullscreen: StaticImageData | undefined; setFullscreen: (v: StaticImageData | undefined) => void }): React.JSX.Element {
	return (
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
	);
}

export function MobileSidebarToggle({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean; setIsSidebarOpen: (v: boolean) => void }): React.JSX.Element {
	return (
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
	);
}

export function MobileLineupOverlay({ show, bottomleftImageVideo, setShow, setFullscreen }: { show: boolean; bottomleftImageVideo: LineupImage[] | null; setShow: (v: boolean) => void; setFullscreen: (v: StaticImageData | undefined) => void }): React.JSX.Element {
	return (
		<AnimatePresence>
			{show && bottomleftImageVideo && bottomleftImageVideo.length > 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className='fixed inset-0 z-40 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:hidden'
					onClick={() => {
						setShow(false);
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
									setShow(false);
								}}
							>
								<XIcon className='h-5 w-5' />
							</motion.button>
						</div>
						<div className='overflow-y-auto max-h-[calc(90vh-5rem)] bg-gradient-to-b from-transparent to-background/5'>
							<LineupImagesDisplay
								images={bottomleftImageVideo}
								onImageClick={(img) => {
									setFullscreen(img);
									setShow(false);
								}}
							/>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
