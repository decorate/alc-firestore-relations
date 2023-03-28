import { QueryConstraint } from '@firebase/firestore'

export type WithQuery = {
	key: string,
	query: () => QueryConstraint|QueryConstraint[],
	relation?: string
}

export type WithQueryConvert = WithQuery & {
	queryTarget: string
}
