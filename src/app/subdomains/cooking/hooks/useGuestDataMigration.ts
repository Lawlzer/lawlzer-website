import { useEffect, useState } from 'react';

import { clearGuestData, getGuestData, hasGuestData } from '../services/guestStorage';

interface MigrationStatus {
	isChecking: boolean;
	isMigrating: boolean;
	migrationComplete: boolean;
	error: string | null;
	results: {
		foods: { migrated: number; errors: number };
	} | null;
}

export const useGuestDataMigration = (isGuest: boolean) => {
	const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
		isChecking: false,
		isMigrating: false,
		migrationComplete: false,
		error: null,
		results: null,
	});

	useEffect(() => {
		// Only run migration if user is logged in and has guest data
		if (isGuest || !hasGuestData()) {
			return;
		}

		const migrateData = async () => {
			setMigrationStatus((prev) => ({ ...prev, isChecking: true }));

			// Check if we've already migrated (using localStorage flag)
			const migrationKey = 'cooking_guest_data_migrated';
			const alreadyMigrated = localStorage.getItem(migrationKey);

			if (alreadyMigrated === 'true') {
				setMigrationStatus((prev) => ({ ...prev, isChecking: false }));
				return;
			}

			setMigrationStatus((prev) => ({ ...prev, isChecking: false, isMigrating: true }));

			try {
				const guestData = getGuestData();

				const response = await fetch('/api/cooking/migrate-guest-data', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(guestData),
				});

				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.error || 'Migration failed');
				}

				// Clear guest data after successful migration
				clearGuestData();

				// Mark as migrated in localStorage
				localStorage.setItem(migrationKey, 'true');

				setMigrationStatus({
					isChecking: false,
					isMigrating: false,
					migrationComplete: true,
					error: null,
					results: result.results,
				});

				// Clear the migration status after 5 seconds
				setTimeout(() => {
					setMigrationStatus({
						isChecking: false,
						isMigrating: false,
						migrationComplete: false,
						error: null,
						results: null,
					});
				}, 5000);
			} catch (error) {
				console.error('Guest data migration failed:', error);
				setMigrationStatus({
					isChecking: false,
					isMigrating: false,
					migrationComplete: false,
					error: error instanceof Error ? error.message : 'Migration failed',
					results: null,
				});
			}
		};

		void migrateData();
	}, [isGuest]);

	return migrationStatus;
};
