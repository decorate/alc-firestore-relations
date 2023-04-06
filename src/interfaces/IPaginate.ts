import FModel from '../FModel'

export interface IPaginate<T extends FModel> {
	hasNext: boolean
	next: () => Promise<IPaginate<T>>
	setLimit: (limit: number) => void
	data: T[]
}
