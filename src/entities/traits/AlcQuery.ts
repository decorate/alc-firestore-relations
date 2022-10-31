import {
	FieldPath,
	Query,
	WhereFilterOp,
	where,
	query,
	getDocs,
	getDoc,
	limit,
	orderBy,
	OrderByDirection,
	QuerySnapshot, QueryConstraint,
	QueryDocumentSnapshot, collection,
} from '@firebase/firestore'
import FModel from '@/FModel'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import HasRelationships from '@/entities/traits/HasRelationships'
import SimplePaginate from '@/entities/traits/SimplePaginate'
import firebase from 'firebase/compat'
import { IPaginate } from '@/interfaces/IPaginate'
import { markRaw } from 'vue'
import { doc } from 'firebase/firestore'

export default class AlcQuery<T extends FModel> {
	#query: Query
	model: new (data?: IIndexable) => T
	withRelated: Array<string|{key: string, query: any}>
	snapShot?: QueryDocumentSnapshot
	paginator?: IPaginate<T>
	private queryLog: string[] = []
	private documentLen: number = 0

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

	async find(value: string) {
		const col = collection(window.alcDB, new this.model().table)
		const d = doc(col, value)
		const res = await getDoc(d)
		return new this.model(res.data())
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
		this.setQueryLog(this.#query)
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

						this.setQueryLog(relation?.query)

						const res = await relation.get()
						this.documentLen = this.documentLen+res.length
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

						this.setQueryLog(relation?.query)
						const res = await relation.get()
						this.documentLen = this.documentLen+res.length
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

				this.setQueryLog(relation?.query)
				const res = await relation.get()
				this.documentLen = this.documentLen+res.length
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

				this.setQueryLog(relation?.query)
				const res = await relation.get()
				this.documentLen = this.documentLen+res.length
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

	toQuery() {
		return {queryLog: this.queryLog, documentLen: this.documentLen}
	}

	private setQueryLog(query?: any) {
		if(!query) {
			return
		}
		if(!query._query) {
			return
		}
		const q = query._query
		let path = q.path.segments.join(',')
		let filter = q.filters.map((x: any) => {
			const f = x.field.segments.join(',')
			const op = x.op
			const v = x.value.stringValue
			const a = `f:${f}${op}${v}`
			return a
		}).join(',')
		if(filter) {
			filter = `|${filter}`
		}
		let order = q.explicitOrderBy.map((x: any) => {
			const dir = x.dir
			const f = x.field.segments.join(',')
			return `ob:${f}${dir}`
		}).join(',')
		if(order) {
			order = `|${order}`
		}

		let limit = ''
		if(q.limit) {
			limit = `|l:${q.limit}`
		}
		this.queryLog.push(`${path}${filter}${order}${limit}`)
	}
}