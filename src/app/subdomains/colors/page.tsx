'use client';

import { motion } from 'framer-motion';
import Head from 'next/head';
import type { JSX } from 'react';
import React from 'react';

import { ColorCustomizationSection, ConfirmDialog, LoadingSpinner, PredefinedPalettesSection, StatusMessage, UnsavedChangesBanner } from './ColorsPageComponents';
import { useColorsPage } from './useColorsPage';

export default function ColorsPage(): JSX.Element {
	const state = useColorsPage();

	if (!state.colorsLoaded || !state.isClient) {
		return <LoadingSpinner />;
	}

	const colorItems = [
		{ label: 'Background', value: state.pageBg, throttledSetter: state.throttledSetPageBg, icon: '🎨' },
		{ label: 'Primary Color', value: state.primaryColor, throttledSetter: state.throttledSetPrimaryColor, icon: '🌟' },
		{ label: 'Secondary Background', value: state.secondaryColor, throttledSetter: state.throttledSetSecondaryColor, icon: '🎭' },
		{ label: 'Text Color', value: state.primaryTextColor, throttledSetter: state.throttledSetPrimaryTextColor, icon: '✏️' },
		{ label: 'Secondary Text', value: state.secondaryTextColor, throttledSetter: state.throttledSetSecondaryTextColor, icon: '📝' },
		{ label: 'Border Color', value: state.borderColor, throttledSetter: state.throttledSetBorderColor, icon: '🖼️' },
	];

	return (
		<div className='relative flex h-full min-h-0 w-full flex-col overflow-y-auto bg-gradient-to-br from-background via-background to-secondary/10'>
			<Head>
				<title>Color Theme Customizer</title>
			</Head>
			<UnsavedChangesBanner hasUnsavedChanges={state.hasUnsavedChanges} handleResetColors={state.handleResetColors} handleSaveColors={state.handleSaveColors} />
			<div className='p-4 pb-8 sm:p-6 md:p-6 lg:p-8'>
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-6 text-center'>
					<h1 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-2'>Color Theme Studio</h1>
					<p className='text-base text-secondary-text max-w-2xl mx-auto'>Customize the color scheme to match your style.</p>
				</motion.div>
				<ColorCustomizationSection colorItems={colorItems} hasUnsavedChanges={state.hasUnsavedChanges} handleImportColors={state.handleImportColors} handleExportColors={state.handleExportColors} handleResetColors={state.handleResetColors} handleSaveColors={state.handleSaveColors} />
				<PredefinedPalettesSection paletteName={state.paletteName} applyPalette={state.applyPalette} />
			</div>
			<StatusMessage clipboardStatus={state.clipboardStatus} />
			<ConfirmDialog showConfirmDialog={state.showConfirmDialog} handleSaveColors={state.handleSaveColors} setShowConfirmDialog={state.setShowConfirmDialog} handleContinueWithoutSaving={state.handleContinueWithoutSaving} handleCancelNavigation={state.handleCancelNavigation} />
		</div>
	);
}
