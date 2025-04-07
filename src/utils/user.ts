import type { IUser } from '../db/models/User';

/**
 * Checks if the essential user account setup is complete.
 * Currently checks only for the presence of a username.
 * This function can be expanded later to include other required fields.
 *
 * @param user The user object to check.
 * @returns True if the user setup is considered complete, false otherwise.
 */
export const isUserSetupComplete = (user: IUser | null | undefined): boolean => {
	// If there's no user object, setup is definitely not complete.
	if (!user) {
		return false;
	}

	// Currently, setup completion is defined by having a username.
	// Add checks for other required fields here in the future.
	return !!user.username;
};
