'use client';

import { ArrowDownTrayIcon, ArrowPathIcon, ArrowUpTrayIcon, CheckIcon, CubeIcon, FireIcon, GlobeAltIcon, HeartIcon, MoonIcon, PaintBrushIcon, SparklesIcon, SunIcon, SwatchIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

import { PREDEFINED_PALETTES } from '~/lib/palette';

interface ColorPalette {
	PAGE_BG: string;
	PRIMARY_TEXT_COLOR: string;
	PRIMARY_COLOR: string;
	SECONDARY_COLOR: string;
	SECONDARY_TEXT_COLOR: string;
	BORDER_COLOR: string;
}

const paletteIcons: Record<string, React.ElementType> = {
	'Light Mode': SunIcon,
	'Dark Mode': MoonIcon,
	'Darker Mode': MoonIcon,
	'Soft Pastel': SparklesIcon,
	'Ocean Breeze': GlobeAltIcon,
	'Sunset Glow': FireIcon,
	'Forest Calm': PaintBrushIcon,
	'Midnight Blue': MoonIcon,
	'Warm Earth': HeartIcon,
	'Cotton Candy': HeartIcon,
	Cyberpunk: CubeIcon,
	'Solarized Light': SunIcon,
	'Gruvbox Dark': MoonIcon,
};

export function LoadingSpinner(): React.JSX.Element {
	return (
		<div className='flex h-full min-h-0 w-full flex-col items-center justify-center'>
			<motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className='mb-4 h-12 w-12 rounded-full border-4 border-primary border-t-transparent' />
			<p className='text-secondary-text'>Loading color settings...</p>
		</div>
	);
}

export function UnsavedChangesBanner({ hasUnsavedChanges, handleResetColors, handleSaveColors }: { hasUnsavedChanges: boolean; handleResetColors: () => void; handleSaveColors: () => void }): React.JSX.Element {
	return (
		<AnimatePresence>
			{hasUnsavedChanges && (
				<motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className='fixed top-0 left-0 right-0 z-50 bg-primary/90 border-b border-primary shadow-md'>
					<div className='px-4 py-3 sm:px-6'>
						<div className='flex items-center justify-between gap-4'>
							<div className='flex items-center gap-2'>
								<ExclamationTriangleIcon className='h-5 w-5 text-primary-foreground' />
								<p className='text-sm font-medium text-primary-foreground'>You have unsaved changes</p>
							</div>
							<div className='flex items-center gap-2'>
								<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleResetColors} className='px-3 py-1.5 text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors'>
									Discard
								</motion.button>
								<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveColors} className='inline-flex items-center gap-1.5 rounded-lg bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-foreground/20 transition-all'>
									<CheckIcon className='h-4 w-4' />
									Save Changes
								</motion.button>
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

interface ColorInputItem {
	label: string;
	value: string | null;
	throttledSetter: (v: string) => void;
	icon: string;
}

export function ColorCustomizationSection({ colorItems, hasUnsavedChanges, handleImportColors, handleExportColors, handleResetColors, handleSaveColors }: { colorItems: ColorInputItem[]; hasUnsavedChanges: boolean; handleImportColors: () => void; handleExportColors: () => void; handleResetColors: () => void; handleSaveColors: () => void }): React.JSX.Element {
	return (
		<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className='mb-6 mx-auto max-w-6xl'>
			<div className='rounded-2xl border border-border bg-card/50 p-6 shadow-lg'>
				<h2 className='mb-6 text-xl font-bold text-foreground flex items-center gap-3'>
					<PaintBrushIcon className='h-5 w-5 text-primary' />
					Custom Colors
				</h2>
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
					{colorItems.map((color) => (
						<motion.div key={color.label} whileHover={{ scale: 1.02 }} className='group relative'>
							<label className='block'>
								<span className='mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground'>
									<span className='text-base'>{color.icon}</span>
									{color.label}
								</span>
								<div className='relative'>
									<input
										type='color'
										value={color.value ?? ''}
										onChange={(e) => {
											color.throttledSetter(e.target.value);
										}}
										className='h-16 w-full cursor-pointer rounded-lg border-2 border-border transition-all hover:border-primary focus:border-primary focus:ring-4 focus:ring-primary/20'
									/>
								</div>
							</label>
						</motion.div>
					))}
				</div>
				<div className='mt-6 flex flex-wrap items-center justify-center gap-2'>
					<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleImportColors} className='inline-flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-secondary transition-all'>
						<ArrowDownTrayIcon className='h-4 w-4' />
						Import
					</motion.button>
					<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleExportColors} className='inline-flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-secondary transition-all'>
						<ArrowUpTrayIcon className='h-4 w-4' />
						Export
					</motion.button>
					<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleResetColors} className='inline-flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-secondary transition-all'>
						<ArrowPathIcon className='h-4 w-4' />
						Reset
					</motion.button>
					{hasUnsavedChanges && (
						<motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveColors} className='inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all'>
							<CheckIcon className='h-4 w-4' />
							Save Colors
						</motion.button>
					)}
				</div>
			</div>
		</motion.div>
	);
}

export function PredefinedPalettesSection({ paletteName, applyPalette }: { paletteName: string | null; applyPalette: (palette: ColorPalette) => void }): React.JSX.Element {
	return (
		<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className='mx-auto max-w-6xl'>
			<h2 className='mb-4 text-xl font-bold text-foreground text-center'>Predefined Themes</h2>
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
				{Object.entries(PREDEFINED_PALETTES).map(([name, palette], index) => {
					const Icon = paletteIcons[name] ?? SwatchIcon;
					const isActive = paletteName === name;
					return (
						<motion.div key={name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -2 }} className='relative'>
							<button
								onClick={() => {
									applyPalette(palette);
								}}
								className={`relative w-full overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${isActive ? 'border-primary bg-primary/5 shadow-lg' : 'border-border bg-card hover:border-primary/50 hover:shadow-md'}`}
							>
								{isActive && <motion.div layoutId='activePaletteIndicator' className='absolute inset-0 bg-primary/10 rounded-xl' transition={{ type: 'spring', stiffness: 500, damping: 30 }} />}
								<div className='relative z-10'>
									<div className='mb-2 flex items-center justify-between'>
										<Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-secondary-text'}`} />
										{isActive && (
											<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className='rounded-full bg-primary p-0.5'>
												<CheckIcon className='h-2.5 w-2.5 text-primary-foreground' />
											</motion.div>
										)}
									</div>
									<h3 className='mb-2 text-sm font-semibold text-foreground'>{name}</h3>
									<div className='grid grid-cols-3 gap-1'>
										<motion.div whileHover={{ scale: 1.1 }} className='h-6 rounded-md shadow-sm ring-1 ring-black/5' style={{ backgroundColor: palette.PAGE_BG }} title='Background' />
										<motion.div whileHover={{ scale: 1.1 }} className='h-6 rounded-md shadow-sm ring-1 ring-black/5' style={{ backgroundColor: palette.PRIMARY_COLOR }} title='Primary Color' />
										<motion.div whileHover={{ scale: 1.1 }} className='h-6 rounded-md shadow-sm ring-1 ring-black/5' style={{ backgroundColor: palette.SECONDARY_COLOR }} title='Secondary Color' />
									</div>
									<div className='mt-1.5 flex gap-0.5'>
										<div className='h-1.5 flex-1 rounded-full opacity-60' style={{ backgroundColor: palette.PRIMARY_TEXT_COLOR }} title='Text Color' />
										<div className='h-1.5 flex-1 rounded-full opacity-60' style={{ backgroundColor: palette.SECONDARY_TEXT_COLOR }} title='Secondary Text' />
										<div className='h-1.5 flex-1 rounded-full opacity-60' style={{ backgroundColor: palette.BORDER_COLOR }} title='Border Color' />
									</div>
								</div>
							</button>
						</motion.div>
					);
				})}
			</div>
		</motion.div>
	);
}

export function StatusMessage({ clipboardStatus }: { clipboardStatus: string }): React.JSX.Element {
	return (
		<AnimatePresence>
			{clipboardStatus.length > 0 && (
				<motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className='fixed bottom-6 right-6 z-30'>
					<div className={clipboardStatus.includes('Error') || clipboardStatus.includes('Failed') ? 'rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm bg-red-500/90 text-white' : 'rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm bg-primary/90 text-primary-foreground'}>
						<p className='text-sm font-medium'>{clipboardStatus}</p>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export function ConfirmDialog({ showConfirmDialog, handleSaveColors, setShowConfirmDialog, handleContinueWithoutSaving, handleCancelNavigation }: { showConfirmDialog: boolean; handleSaveColors: () => void; setShowConfirmDialog: (v: boolean) => void; handleContinueWithoutSaving: () => void; handleCancelNavigation: () => void }): React.JSX.Element {
	return (
		<AnimatePresence>
			{showConfirmDialog && (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'>
					<motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className='w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl'>
						<div className='mb-6'>
							<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
								<ExclamationTriangleIcon className='h-6 w-6 text-primary' />
							</div>
							<h3 className='text-xl font-bold text-foreground'>Unsaved Changes</h3>
							<p className='mt-2 text-secondary-text'>You have unsaved color changes. Would you like to save them before leaving?</p>
						</div>
						<div className='flex flex-col gap-3'>
							<motion.button
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								onClick={() => {
									handleSaveColors();
									setShowConfirmDialog(false);
								}}
								className='w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all'
							>
								Save & Continue
							</motion.button>
							<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleContinueWithoutSaving} className='w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-all'>
								Discard Changes
							</motion.button>
							<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCancelNavigation} className='w-full rounded-lg px-4 py-3 text-sm font-medium text-secondary-text hover:text-foreground transition-all'>
								Cancel
							</motion.button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
