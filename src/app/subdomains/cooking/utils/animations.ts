export const animations = {
	// Fade animations
	fadeIn: 'animate-in fade-in duration-200',
	fadeOut: 'animate-out fade-out duration-150',

	// Slide animations
	slideInFromTop: 'animate-in slide-in-from-top duration-200',
	slideInFromBottom: 'animate-in slide-in-from-bottom duration-200',
	slideInFromLeft: 'animate-in slide-in-from-left duration-200',
	slideInFromRight: 'animate-in slide-in-from-right duration-200',
	slideOut: 'animate-out slide-out-to-bottom duration-150',

	// Scale animations
	scaleIn: 'animate-in zoom-in-95 duration-200',
	scaleOut: 'animate-out zoom-out-95 duration-150',

	// Hover effects
	hover: {
		scale: 'transition-transform hover:scale-105',
		shadow: 'transition-shadow hover:shadow-lg',
		brightness: 'transition-all hover:brightness-110',
		opacity: 'transition-opacity hover:opacity-80',
	},

	// Click effects
	click: {
		scale: 'active:scale-95 transition-transform',
		brightness: 'active:brightness-95 transition-all',
	},

	// Skeleton animations
	skeleton: 'animate-pulse bg-muted',

	// Combined effects
	card: 'transition-all hover:shadow-lg hover:-translate-y-1',
	button: 'transition-all active:scale-95 hover:brightness-110',
	link: 'transition-colors hover:text-primary',
};

// Animation duration utilities
export const duration = {
	fast: 'duration-150',
	normal: 'duration-200',
	slow: 'duration-300',
	slower: 'duration-500',
};

// Animation delay utilities
export const delay = {
	none: 'delay-0',
	fast: 'delay-75',
	normal: 'delay-150',
	slow: 'delay-300',
	slower: 'delay-500',
};

// Stagger animation helper
export const stagger = (index: number, baseDelay = 50) => ({
	animationDelay: `${index * baseDelay}ms`,
});
