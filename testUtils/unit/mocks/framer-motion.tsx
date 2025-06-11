import type { AnimatePresenceProps, HTMLMotionProps, SVGMotionProps } from 'framer-motion';
import React from 'react';
import { vi } from 'vitest';

// Create mock components for HTML elements
const createHTMLMockComponent = <T extends keyof React.JSX.IntrinsicElements>(element: T) => {
	const Component = React.forwardRef<
		React.JSX.IntrinsicElements[T] extends React.DetailedHTMLProps<infer _P, infer E> ? E : HTMLElement,
		HTMLMotionProps<any> // Use any to avoid type constraint issues
	>((props, ref) => {
		const {
			// Strip motion-specific props
			initial,
			animate,
			exit,
			whileHover,
			whileTap,
			whileDrag,
			whileFocus,
			whileInView,
			variants,
			transition,
			transformTemplate,
			style,
			onAnimationStart,
			onAnimationComplete,
			onUpdate,
			drag,
			dragConstraints,
			dragElastic,
			dragMomentum,
			dragTransition,
			dragPropagation,
			dragControls,
			onDragStart,
			onDrag,
			onDragEnd,
			onDirectionLock,
			onDragTransitionEnd,
			_dragX,
			_dragY,
			layout,
			layoutId,
			layoutDependency,
			layoutScroll,
			layoutRoot,
			onLayoutAnimationStart,
			onLayoutAnimationComplete,
			onViewportEnter,
			onViewportLeave,
			viewport,
			// Keep the rest
			...htmlProps
		} = props as any;

		return React.createElement(element as string, { ...htmlProps, ref });
	});
	Component.displayName = `motion.${String(element)}`;
	return Component;
};

// Create mock components for SVG elements
const createSVGMockComponent = <T extends keyof React.JSX.IntrinsicElements>(element: T) => {
	const Component = React.forwardRef<React.JSX.IntrinsicElements[T] extends React.SVGProps<infer E> ? E : SVGElement, SVGMotionProps<any>>((props, ref) => {
		const {
			// Strip motion-specific props
			initial,
			animate,
			exit,
			whileHover,
			whileTap,
			whileDrag,
			whileFocus,
			whileInView,
			variants,
			transition,
			transformTemplate,
			style,
			onAnimationStart,
			onAnimationComplete,
			onUpdate,
			drag,
			dragConstraints,
			dragElastic,
			dragMomentum,
			dragTransition,
			dragPropagation,
			dragControls,
			onDragStart,
			onDrag,
			onDragEnd,
			onDirectionLock,
			onDragTransitionEnd,
			_dragX,
			_dragY,
			layout,
			layoutId,
			layoutDependency,
			layoutScroll,
			layoutRoot,
			onLayoutAnimationStart,
			onLayoutAnimationComplete,
			onViewportEnter,
			onViewportLeave,
			viewport,
			// Keep the rest
			...svgProps
		} = props as any;

		return React.createElement(element as string, { ...svgProps, ref });
	});
	Component.displayName = `motion.${String(element)}`;
	return Component;
};

// Mock motion components
export const motion = {
	// HTML elements
	div: createHTMLMockComponent('div'),
	span: createHTMLMockComponent('span'),
	a: createHTMLMockComponent('a'),
	button: createHTMLMockComponent('button'),
	input: createHTMLMockComponent('input'),
	form: createHTMLMockComponent('form'),
	section: createHTMLMockComponent('section'),
	article: createHTMLMockComponent('article'),
	header: createHTMLMockComponent('header'),
	footer: createHTMLMockComponent('footer'),
	main: createHTMLMockComponent('main'),
	nav: createHTMLMockComponent('nav'),
	aside: createHTMLMockComponent('aside'),
	h1: createHTMLMockComponent('h1'),
	h2: createHTMLMockComponent('h2'),
	h3: createHTMLMockComponent('h3'),
	h4: createHTMLMockComponent('h4'),
	h5: createHTMLMockComponent('h5'),
	h6: createHTMLMockComponent('h6'),
	p: createHTMLMockComponent('p'),
	ul: createHTMLMockComponent('ul'),
	ol: createHTMLMockComponent('ol'),
	li: createHTMLMockComponent('li'),
	img: createHTMLMockComponent('img'),
	// SVG elements
	svg: createSVGMockComponent('svg'),
	path: createSVGMockComponent('path'),
	circle: createSVGMockComponent('circle'),
	rect: createSVGMockComponent('rect'),
	g: createSVGMockComponent('g'),
} as const;

// Mock AnimatePresence
export const AnimatePresence: React.FC<React.PropsWithChildren<Omit<AnimatePresenceProps, 'children'>>> = ({ children }) => <>{children}</>;

// Mock other framer-motion exports
export const useAnimation = () => ({
	start: vi.fn(),
	stop: vi.fn(),
	set: vi.fn(),
});

export const useMotionValue = <T = any,>(initial: T) => ({
	get: () => initial,
	set: vi.fn(),
	onChange: vi.fn(),
	destroy: vi.fn(),
});

export const useTransform = () => useMotionValue(0);
export const useSpring = () => useMotionValue(0);
export const useScroll = () => ({
	scrollX: useMotionValue(0),
	scrollY: useMotionValue(0),
	scrollXProgress: useMotionValue(0),
	scrollYProgress: useMotionValue(0),
});

export const useInView = () => true;
export const useIsPresent = () => true;
export const usePresence = () => [true, vi.fn()] as const;
export const useReducedMotion = () => false;

// Re-export everything
export default {
	motion,
	AnimatePresence,
	useAnimation,
	useMotionValue,
	useTransform,
	useSpring,
	useScroll,
	useInView,
	useIsPresent,
	usePresence,
	useReducedMotion,
};
