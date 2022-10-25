import { FieldPath, Query, WhereFilterOp, where, query, getDocs } from '@firebase/firestore'
import FModel from '@/FModel'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import { Model } from '@team-decorate/alcts/dist/index'

export default class AlcQuery<T extends FModel> {
	query: Query
	model: new (data?: IIndexable) => T
	withRelated: string[]

	constructor(model: new (data?: IIndexable) => T, query: Query) {
		this.query = query
		this.model = model
		this.withRelated = []
	}

	with(related: Array<string>) {
		this.withRelated = related
		return this
	}

	where(fieldPath: string | FieldPath, opStr: WhereFilterOp, value: unknown) {
		const w = where(fieldPath, opStr, value)
		this.query = query(this.query, w)
		return this
	}

	async get() {
		const d = await getDocs(this.query)
		const data: T[] = []

		await Promise.all(d.docs.map(async x => {
			let m = new this.model(x.data())
			await Promise.all(this.withRelated.map(async v => {
				const relatedName = v.replace('_', '')
				const model = m as IIndexable
				if(model[v] instanceof Function) {
					const relation = await model[v]()
					const res = await relation.get()
					if(relation.type === 'hasMany') {
						m.update({[relatedName]: res})
					}
					if(relation.type === 'belongsTo' && res.length) {
						m.update({[relatedName]: res[0]})
					}
				}
			}))
			data.push(m)
		}))
		return data
	}
}