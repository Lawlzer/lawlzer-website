import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { getSession } from '~/server/db/session';

export async function DELETE(request: Request, { params }: { params: { entryId: string } }) {
	try {
		const session = await getSession();
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { entryId } = params;

		if (!entryId) {
			return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
		}

		// To ensure security, we must verify the user owns the day entry they are trying to delete.
		// We can do this by checking if the DayEntry's parent Day belongs to the current user.
		const entryToDelete = await db.dayEntry.findFirst({
			where: {
				id: entryId,
				day: {
					userId: session.user.id,
				},
			},
		});

		if (!entryToDelete) {
			return NextResponse.json({ error: 'Entry not found or you do not have permission to delete it' }, { status: 404 });
		}

		await db.dayEntry.delete({
			where: {
				id: entryId,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting day entry:', error);
		return NextResponse.json({ error: 'Failed to delete day entry' }, { status: 500 });
	}
}
