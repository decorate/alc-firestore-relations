import FModel from '../FModel'

export interface IPaginate<T extends FModel> {
	hasNext: boolean
	next: () => void
	setLimit: (limit: number) => void
	data: T[]
}
