'use client';

import type { Food, FridgeItem } from '@prisma/client';
import { useEffect, useState } from 'react';

import { Button } from '~/components/ui/Button';

interface FridgeItemWithFood extends FridgeItem {
	food: Food;
}

interface FridgeManagerProps {
	availableFoods: Food[];
	isGuest: boolean;
}

export function FridgeManager({ availableFoods, isGuest }: FridgeManagerProps) {
	const [fridgeItems, setFridgeItems] = useState<FridgeItemWithFood[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedFoodId, setSelectedFoodId] = useState('');
	const [quantity, setQuantity] = useState('');
	const [message, setMessage] = useState<{
		type: 'error' | 'success';
		text: string;
	} | null>(null);

	// Guard against undefined availableFoods
	const foods = availableFoods ?? [];

	// Auto-clear messages after 3 seconds
	useEffect(() => {
		if (message) {
			const timer = setTimeout(() => {
				setMessage(null);
			}, 3000);
			return () => {
				clearTimeout(timer);
			};
		}
	}, [message]);

	// Fetch fridge items
	useEffect(() => {
		if (isGuest) {
			setIsLoading(false);
			return;
		}

		let mounted = true;

		const fetchFridgeItems = async () => {
			if (!mounted) return;
			setIsLoading(true);
			try {
				const response = await fetch('/api/cooking/fridge');
				if (!response.ok) throw new Error('Failed to fetch fridge items');
				const data = await response.json();
				if (mounted) {
					setFridgeItems(data);
				}
			} catch (error) {
				if (mounted) {
					setMessage({
						type: 'error',
						text: 'Could not load fridge contents.',
					});
				}
			} finally {
				if (mounted) {
					setIsLoading(false);
				}
			}
		};
		void fetchFridgeItems();

		return () => {
			mounted = false;
		};
	}, [isGuest]);

	const handleAddItem = async () => {
		if (selectedFoodId === '' || quantity === '') {
			setMessage({
				type: 'error',
				text: 'Please select a food and enter a quantity.',
			});
			return;
		}

		try {
			const response = await fetch('/api/cooking/fridge', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					foodId: selectedFoodId,
					quantity: Number(quantity),
				}),
			});
			if (!response.ok) throw new Error('Failed to add item');
			const newItem = await response.json();
			setFridgeItems([...fridgeItems, newItem]);
			setSelectedFoodId('');
			setQuantity('');
			setMessage({ type: 'success', text: 'Item added to fridge!' });
		} catch (error) {
			setMessage({ type: 'error', text: 'Failed to add item.' });
		}
	};

	const handleRemoveItem = async (itemId: string) => {
		try {
			const response = await fetch(`/api/cooking/fridge?id=${itemId}`, {
				method: 'DELETE',
			});
			if (!response.ok) throw new Error('Failed to remove item');
			setFridgeItems(fridgeItems.filter((item) => item.id !== itemId));
			setMessage({ type: 'success', text: 'Item removed from fridge.' });
		} catch (error) {
			setMessage({ type: 'error', text: 'Failed to remove item.' });
		}
	};

	if (isGuest) {
		return (
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold'>My Fridge</h2>
				<div className='rounded-lg border p-6 text-center'>
					<h3 className='text-lg font-semibold mb-2'>Sign In to Track Your Inventory</h3>
					<p className='text-gray-600 dark:text-gray-400 mb-4'>The fridge feature helps you track your food inventory and manage expiration dates. Sign in to save your inventory across devices.</p>
					<Button onClick={() => (window.location.href = '/api/auth/login')} className='bg-blue-500 hover:bg-blue-600 text-white'>
						Sign In
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<h2 className='text-2xl font-bold'>My Fridge</h2>

			{message && <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>{message.text}</div>}

			<div className='p-4 border rounded-lg'>
				<h3 className='font-semibold mb-3'>Add Item</h3>
				<div className='flex gap-2'>
					<select
						value={selectedFoodId}
						onChange={(e) => {
							setSelectedFoodId(e.target.value);
						}}
						className='flex-1 p-2 border rounded'
					>
						<option value=''>Select a food...</option>
						{foods.map((food) => (
							<option key={food.id} value={food.id}>
								{food.name}
							</option>
						))}
					</select>
					<input
						type='number'
						value={quantity}
						onChange={(e) => {
							setQuantity(e.target.value);
						}}
						placeholder='Quantity (g)'
						className='w-32 p-2 border rounded'
					/>
					<Button onClick={() => void handleAddItem()}>Add</Button>
				</div>
			</div>

			<div>
				<h3 className='font-semibold mb-3'>Current Inventory</h3>
				{isLoading ? (
					<p>Loading...</p>
				) : fridgeItems.length === 0 ? (
					<p className='text-gray-600 dark:text-gray-400'>Your fridge is empty. Add some items to get started!</p>
				) : (
					<div className='space-y-2'>
						{fridgeItems.map((item) => (
							<div key={item.id} className='flex justify-between items-center p-3 border rounded-lg'>
								<div>
									<p className='font-medium'>{item.food.name}</p>
									<p className='text-sm text-gray-500'>{item.quantity}g</p>
								</div>
								<Button variant='destructive' size='sm' onClick={() => void handleRemoveItem(item.id)}>
									Remove
								</Button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
