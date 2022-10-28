import {
	FieldPath,
	Query,
	WhereFilterOp,
	where,
	query,
	getDocs,
	limit,
	orderBy,
	OrderByDirection,
	QuerySnapshot, QueryConstraint,
	QueryDocumentSnapshot
} from '@firebase/firestore'
import FModel from '@/FModel'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import HasRelationships from '@/entities/traits/HasRelationships'
import SimplePaginate from '@/entities/traits/SimplePaginate'
import firebase from 'firebase/compat'
import { IPaginate } from '@/interfaces/IPaginate'

export default class AlcQuery<T extends FModel> {
	#query: Query
	model: new (data?: IIndexable) => T
	withRelated: Array<string|{key: string, query: any}>
	snapShot?: QueryDocumentSnapshot
	paginator?: IPaginate<T>

	constructor(model: new (data?: IIndexable) => T, query: Query) {
		this.#query = query
		this.model = model
		this.withRelated = []
	}

	query() {
		return this
	}

	addQuery(_query: QueryConstraint) {
		this.#query = query(this.#query, _query)
		return this
	}

	with(related: Array<string|{key: string, query: any}>) {
		related.map(x => this.withRelated.push(x))
		this.withRelated = [...new Set(this.withRelated)]
		return this
	}

	where(fieldPath: string | FieldPath, opStr: WhereFilterOp, value: unknown) {
		const w = where(fieldPath, opStr, value)
		this.#query = query(this.#query, w)
		return this
	}

	limit(num: number) {
		const l = limit(num)
		this.#query = query(this.#query, l)
		return this
	}

	orderBy(fieldPath: string | FieldPath, directionStr?: OrderByDirection) {
		const o = orderBy(fieldPath, directionStr)
		this.#query = query(this.#query, o)
		return this
	}

	async get() {
		const d = await getDocs(this.#query)
		if(d.docs.length) {
			this.snapShot = d.docs[d.docs.length-1]
		}
		const data: T[] = []

		await Promise.all(d.docs.map(async x => {
			let m = new this.model(x.data())
			await Promise.all(this.withRelated.map(async v => {
				if(typeof v == 'string') {
					const relatedName = v.replace(/\_/g, '')
					const model = m as IIndexable
					if(model[v] instanceof Function) {
						const relation = await model[v]()
						const res = await relation.get()
						if(relation.type === 'hasMany' || relation.type === 'hasManySub') {
							m.update({[relatedName]: res})
						}
						if((relation.type === 'belongsTo' || relation.type === 'hasOne') && res.length) {
							m.update({[relatedName]: res[0]})
						}
					}

					if(/\./.test(relatedName)) {
						await this.setHasManySub(m, [m], relatedName)
						await this.setRelations(m, [m], relatedName)
					}
				} else {
					const relatedName = v.key.replace(/\_/g, '')
					const relatedQuery = v.query
					const model = m as IIndexable
					if(model[v.key] instanceof Function) {
						const relation = await model[v.key]()
						relation.addQuery(relatedQuery())
						const res = await relation.get()
						if(relation.type === 'hasMany' || relation.type === 'hasManySub') {
							m.update({[relatedName]: res})
						}
						if((relation.type === 'belongsTo' || relation.type === 'hasOne') && res.length) {
							m.update({[relatedName]: res[0]})
						}
					}
				}

			}))
			data.push(m)
		}))
		return data
	}

	async setHasManySub(parentModel: T, rootModel: T[], relatedName: string, count: number = 0, path = '', targetKey:string = '') {
		await Promise.all(
			rootModel.map(async (x, i) => {
				const model = x as IIndexable
				const func = relatedName.split('.')
				let key = ''
				if(count && func[count]) {
					key = `${targetKey}.${i}.${func[count]}`
				} else {
					key = `${func[count]}`
				}
				const f = `_${func[count]}`
				if(model[f] == undefined) return
				const relation = model[f]()
				if(relation.type != 'hasManySub') {
					return
				}
				let nextPath = ''
				if(path) {
					nextPath = `${path}/${relation.subPath}`
					relation.setQuery(nextPath)
				}
				if(!path) {
					nextPath = relation.subPath
				}
				const res = await relation.get()
				if(res.length) {
					const s = func.slice()
					s.splice(count+1)
					parentModel.setValueByKey(key, res)
					await this.setHasManySub(parentModel, res, relatedName, count + 1, nextPath, key)
				}
			})
		)
	}

	async setRelations(parentModel: T, rootModel: T[], relatedName: string, count: number = 0, targetKey:string = '') {
		await Promise.all(
			rootModel.map(async (x, i) => {
				const model = x as IIndexable
				const func = relatedName.split('.')
				let key = ''
				const f = `_${func[count]}`
				if(model[f] == undefined) return
				const relation = model[f]()
				if(count && func[count]) {
					if(relation.type == 'hasMany') {
						key = `${targetKey}.${i}.${func[count]}`
					} else {
						key = `${targetKey}.${func[count]}`
					}
				} else {
					key = `${func[count]}`
				}
				if(relation.type == 'hasManySub') {
					return
				}
				const res = await relation.get()
				if(res.length) {
					const s = func.slice()
					s.splice(count+1)
					if(relation.type == 'hasMany') {
						parentModel.setValueByKey(key, res)
					} else {
						parentModel.setValueByKey(key, res[0])
					}
					await this.setRelations(parentModel, res, relatedName, count + 1, key)
				}
			})
		)
	}

	createPaginator() {
		this.paginator = new SimplePaginate(this)
	}

	simplePaginate(limit: number) {
		this.paginator?.setLimit(limit)
		return this.paginator
	}

}