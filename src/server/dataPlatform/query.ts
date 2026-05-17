export const FILTERABLE_FIELDS: string[] = ['type', 'category', 'country', 'state', 'cattleType', 'choiceGrade'];

export type InputFilters = Record<string, string[] | boolean | number | string>;

export function buildWhereClause(inputFilters: InputFilters): Record<string, unknown> {
	const where: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(inputFilters)) {
		if (!FILTERABLE_FIELDS.includes(key)) continue;

		if (Array.isArray(value) && value.length > 0) {
			where[key] = { in: value };
		} else if (!Array.isArray(value)) {
			where[key] = value;
		}
	}

	return where;
}
