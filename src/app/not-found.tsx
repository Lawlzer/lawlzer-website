import Link from 'next/link';

export default function NotFound(): React.JSX.Element {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center p-4'>
			<h1 className='mb-4 text-6xl font-bold text-foreground'>404</h1>
			<p className='mb-8 text-lg text-muted-foreground'>The page you&apos;re looking for doesn&apos;t exist.</p>
			<Link className='rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90' href='/'>
				Return Home
			</Link>
		</div>
	);
}
