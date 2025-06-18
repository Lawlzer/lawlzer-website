'use client';

import { ArrowRightIcon, ChartBarIcon, CodeBracketIcon, CommandLineIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { BeakerIcon, BriefcaseIcon, CheckCircleIcon, CubeIcon, GlobeAltIcon, LinkIcon, RocketLaunchIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { JSX } from 'react';
import React, { useState } from 'react';

import DataPlatformPreview from './components/DataPlatformPreview';

import { getBaseUrl } from '~/lib/utils';

// Animation variants with improved timing
const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.1,
		},
	},
};

const itemVariants: Variants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.4,
			ease: 'easeOut' as const,
		},
	},
};

const scaleVariants: Variants = {
	hidden: { opacity: 0, scale: 0.95 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: {
			duration: 0.4,
			ease: 'easeOut' as const,
		},
	},
};

export default function MainPage(): JSX.Element {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const fullUrl = getBaseUrl();
	const { hostname } = new URL(fullUrl);
	const dataPlatformCardId = 'data-platform-card';

	const projects = [
		{
			id: 'website',
			title: `${hostname} (This Website!)`,
			description: 'A personal portfolio and project hub built with Next.js, TypeScript, and Tailwind CSS.',
			icon: GlobeAltIcon,
			gradient: 'from-primary to-primary/60',
			isClickable: true,
			githubUrl: 'https://github.com/Lawlzer/lawlzer-website',
			features: [
				{ text: 'Dynamic Color Theming', link: getBaseUrl('colors'), icon: SparklesIcon },
				{ text: 'Valorant Lineup Tool', link: getBaseUrl('valorant'), icon: BeakerIcon },
				{ text: 'Responsive & Mobile-First', icon: CubeIcon },
				{ text: 'Perfect Lighthouse Score', icon: RocketLaunchIcon },
			],
		},
		{
			id: dataPlatformCardId,
			title: 'Data Platform',
			description: 'Handled 2B+ Mongoose documents with real-time dynamic search capabilities, using USDA APIs.',
			icon: ChartBarIcon,
			gradient: 'from-primary/80 to-primary/40',
			isClickable: true,
			features: [{ text: 'Dynamic Mongoose DB for 2+ billion documents' }, { text: 'Hourly USDA API integration' }, { text: 'Vercel deployment with global CDN' }, { text: '98% test coverage (Jest & Supertest)' }],
		},
		{
			id: 'scrapers',
			title: 'Web Scraping Solutions',
			description: 'Developed Playwright solutions to extract data from 200+ complex websites monthly.',
			icon: CodeBracketIcon,
			gradient: 'from-primary/60 to-primary/30',
			features: [{ text: 'Rotating/Residential Proxies' }, { text: 'Captcha Solving & Temp-Mail' }, { text: 'Parallelism & Scalability' }],
		},
		{
			id: 'npm',
			title: 'Open Source Contributions',
			description: 'Published high-quality NPM packages with robust testing and developer experience.',
			icon: CommandLineIcon,
			gradient: 'from-primary/70 to-primary/50',
			features: [{ text: 'Extensive Testing & Strict ESLint' }, { text: 'Husky & Lint-Staged Integration' }, { text: 'GitHub Actions CI/CD' }],
		},
	];

	const stats = [
		{ label: 'Years of Experience', value: '7+', icon: BriefcaseIcon },
		{ label: 'Projects Completed', value: '50+', icon: CheckCircleIcon },
		{ label: 'Production Deployments', value: '100+', icon: CodeBracketIcon },
		{ label: 'Websites Autonomously Scraped', value: '200+', icon: CodeBracketIcon },
		{ label: 'APIs integrated', value: '250+', icon: CodeBracketIcon },
		{ label: 'Peer Reviews Completed', value: '800+', icon: CodeBracketIcon },
	];

	return (
		<div className='flex w-full flex-grow flex-col'>
			{/* Hero Section - Clean and Modern */}
			<section className='relative overflow-hidden bg-gradient-to-b from-background via-background to-secondary/20'>
				{/* Subtle background pattern */}
				<div className='absolute inset-0 bg-grid-pattern opacity-[0.02]' />

				<motion.div initial='hidden' animate='visible' variants={containerVariants} className='relative mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20'>
					{/* Main content */}
					<div className='text-center'>
						<motion.div variants={itemVariants} className='mb-6'>
							<h1 className='text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl'>
								<span className='block text-foreground'>Hi, I&apos;m</span>
								<span className='mt-2 block text-primary'>Kevin Porter</span>
							</h1>
						</motion.div>

						<motion.p variants={itemVariants} className='mx-auto max-w-2xl text-lg text-secondary-text sm:text-xl'>
							I&apos;m a full-stack developer passionate about creating elegant solutions to complex problems. Specializing in TypeScript, React, and modern web technologies.
						</motion.p>

						{/* Stats Grid - Made smaller */}
						<motion.div variants={itemVariants} className='mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:gap-4'>
							{stats.map((stat, index) => {
								const Icon = stat.icon;
								return (
									<motion.div key={index} variants={scaleVariants} whileHover={{ scale: 1.05 }} className='group relative overflow-hidden rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/50'>
										<div className='absolute top-0 right-0 -mt-2 -mr-2 h-16 w-16 rounded-full bg-muted/50 group-hover:bg-muted transition-colors' />
										<Icon className='relative mb-1 h-6 w-6 text-primary' />
										<div className='relative'>
											<p className='text-xl font-bold text-foreground sm:text-2xl'>{stat.value}</p>
											<p className='text-xs text-secondary-text'>{stat.label}</p>
										</div>
									</motion.div>
								);
							})}
						</motion.div>

						{/* CTAs - Removed "Get in Touch" */}
						<motion.div variants={itemVariants} className='mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center'>
							<motion.a href='https://github.com/lawlzer' target='_blank' rel='noopener noreferrer' whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className='group inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-secondary hover:shadow-md'>
								<CodeBracketIcon className='h-5 w-5' />
								GitHub
								<ArrowRightIcon className='h-4 w-4 transition-transform group-hover:translate-x-1' />
							</motion.a>

							<motion.a href='https://www.linkedin.com/in/kevin-porter-6a80b7210/' target='_blank' rel='noopener noreferrer' whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className='group inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-secondary hover:shadow-md'>
								<LinkIcon className='h-5 w-5' />
								LinkedIn
								<ArrowRightIcon className='h-4 w-4 transition-transform group-hover:translate-x-1' />
							</motion.a>
						</motion.div>
					</div>
				</motion.div>
			</section>

			{/* Projects Section - Refined Design */}
			<section className='bg-background py-16 sm:py-20'>
				<div className='mx-auto max-w-7xl px-6 sm:px-8'>
					<motion.div initial='hidden' whileInView='visible' viewport={{ once: true, amount: 0.1 }} variants={containerVariants}>
						<motion.div variants={itemVariants} className='text-center'>
							<h2 className='text-4xl font-bold tracking-tight text-foreground sm:text-5xl'>Featured Projects</h2>
							<p className='mt-4 text-lg text-secondary-text'>Sample complex projects I&apos;ve built for clients, showcasing scalable solutions and modern technologies</p>
						</motion.div>

						<motion.div variants={itemVariants} className='mt-12 grid grid-cols-1 gap-8 md:grid-cols-2'>
							{projects.map((project) => {
								const Icon = project.icon;
								return (
									<motion.div
										key={project.id}
										layoutId={project.isClickable ? project.id : undefined}
										variants={scaleVariants}
										whileHover={{ y: -4 }}
										className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-xl hover:border-primary/50 ${project.isClickable ? 'cursor-pointer' : ''}`}
										onClick={
											project.isClickable
												? () => {
														if (project.id === 'website' && 'githubUrl' in project && project.githubUrl !== undefined && project.githubUrl !== null && project.githubUrl !== '') {
															window.open(project.githubUrl, '_blank', 'noopener,noreferrer');
														} else {
															setSelectedId(project.id);
														}
													}
												: undefined
										}
										onKeyDown={
											project.isClickable
												? (e: React.KeyboardEvent) => {
														if (e.key === 'Enter' || e.key === ' ') {
															e.preventDefault();
															if (project.id === 'website' && 'githubUrl' in project && project.githubUrl !== undefined && project.githubUrl !== null && project.githubUrl !== '') {
																window.open(project.githubUrl, '_blank', 'noopener,noreferrer');
															} else {
																setSelectedId(project.id);
															}
														}
													}
												: undefined
										}
										tabIndex={project.isClickable ? 0 : undefined}
										role={project.isClickable ? 'button' : undefined}
										aria-label={project.isClickable ? `View ${project.title} details` : undefined}
									>
										{/* Gradient accent */}
										<div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${project.gradient}`} />

										{/* Icon */}
										<div className={`mb-6 inline-flex rounded-lg bg-gradient-to-br ${project.gradient} p-3 text-primary-foreground shadow-lg`}>
											<Icon className='h-6 w-6' />
										</div>

										{/* Content */}
										<h3 className='mb-3 text-xl font-bold text-foreground'>{project.title}</h3>
										<p className='mb-6 text-secondary-text'>{project.description}</p>

										{/* Features */}
										<ul className='space-y-2'>
											{project.features.map((feature, index) => (
												<motion.li key={index} className='flex items-start gap-3 text-sm' initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
													<CheckCircleIcon className={`mt-0.5 h-4 w-4 flex-shrink-0 text-primary`} />
													{'link' in feature && feature.link !== undefined ? (
														<a
															href={feature.link}
															target='_blank'
															rel='noopener noreferrer'
															className='text-secondary-text hover:text-primary transition-colors inline-flex items-center gap-1 -m-2 p-2 rounded'
															onClick={(e) => {
																e.stopPropagation();
															}}
														>
															{feature.text}
															{'icon' in feature && feature.icon !== undefined ? <feature.icon className='h-3 w-3' /> : null}
														</a>
													) : (
														<span className='text-secondary-text'>{feature.text}</span>
													)}
												</motion.li>
											))}
										</ul>

										{/* Click indicator */}
										{project.isClickable && (
											<motion.div className='mt-6 flex items-center gap-2 text-sm font-medium text-primary' animate={{ x: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
												<span>{project.id === 'website' ? 'Click to view the GitHub repository' : 'Click to explore'}</span>
												<ArrowRightIcon className='h-4 w-4' />
											</motion.div>
										)}
									</motion.div>
								);
							})}
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Data Platform Modal */}
			<AnimatePresence>
				{selectedId === dataPlatformCardId && (
					<DataPlatformPreview
						onClose={() => {
							setSelectedId(null);
						}}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}
