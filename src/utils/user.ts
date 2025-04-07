import type { IUser } from '../db/models/User';

export const isUserSetupComplete = (user: IUser | null | undefined): boolean => {
	// If there's no user object, setup is definitely not complete.
	if (!user) {
		return false;
	}

	// Currently, setup completion is defined by having a username.
	// Add checks for other required fields here in the future.
	return !!user.username;
};
