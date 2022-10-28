import AlcQuery from '@/entities/traits/AlcQuery'
import FModel from '@/FModel'
import {
	limit,
	startAfter
} from '@firebase/firestore'
import { IPaginate } from '@/interfaces/IPaginate'

export default class SimplePaginate<T extends FModel> implements IPaginate<T>{
	limit: number = 15
	alcQuery: AlcQuery<T>

	hasNext: boolean = false
	data: T[] = []

	constructor(query: AlcQuery<T>, limit: number = 15) {
		this.alcQuery = query
		this.limit = limit

		this.addQuery()

	}

	addQuery() {
		this.alcQuery.addQuery(limit(this.limit))
	}

	async next() {
		if(!this.alcQuery.snapShot) {
			const res = await this.alcQuery.get()
			if(res.length) {
				this.hasNext = true
				this.data.push(...res)
			}
		} else {
			this.alcQuery.addQuery(startAfter(this.alcQuery.snapShot))
			const res = await this.alcQuery.get()
			if(res.length) {
				this.hasNext = true
				this.data.push(...res)
			} else {
				this.hasNext = false
			}
		}
		return this
	}

	setLimit(limit: number) {
		this.limit = limit
		this.addQuery()
	}
}