export default function Loading() {
	return (
		<div className='flex min-h-[400px] items-center justify-center'>
			<div className='flex flex-col items-center gap-4'>
				<div className='h-12 w-12 animate-spin rounded-full border-b-2 border-primary'></div>
				<p className='text-muted-foreground'>Loading cooking app...</p>
			</div>
		</div>
	);
}
