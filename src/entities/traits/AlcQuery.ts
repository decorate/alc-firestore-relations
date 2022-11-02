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
	QueryDocumentSnapshot, collection, startAfter, DocumentSnapshot, endBefore, startAt, endAt
} from '@firebase/firestore'
import FModel from '@/FModel'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import HasRelationships from '@/entities/traits/HasRelationships'
import SimplePaginate from '@/entities/traits/SimplePaginate'
import firebase from 'firebase/compat'
import { IPaginate } from '@/interfaces/IPaginate'
import { markRaw } from 'vue'
import { doc } from 'firebase/firestore'
import Restaurant from '@/entities/Restaurant'

export default class AlcQuery<T extends FModel> {
	#query: Query
	model: new (data?: IIndexable) => T
	withRelated: Array<string|{key: string, query: any, relation?: string}>
	snapShot?: QueryDocumentSnapshot
	paginator?: IPaginate<T>
	private queryLog: string[] = []
	private documentLen: number = 0
	private logStack: any[] = []

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

	with(related: Array<string|{key: string, query: any, relation?: string}>) {
		related.map(x => this.withRelated.push(x))
		this.withRelated = [...new Set(this.withRelated)]
		return this
	}

	async find(value: string) {
		this.addQuery(where('id', '==', value))
		const res = await this.get()
		if(res.length) {
			return res[0]
		}
	}

	async first() {
		this.addQuery(limit(1))
		const res = await this.get()
		if(res.length) {
			return res[0]
		}
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

	startAfter(...fieldValues: unknown[]): AlcQuery<T>
	startAfter(snapshot: DocumentSnapshot<unknown>): AlcQuery<T>
	startAfter(val: any): AlcQuery<T> {
		const s = startAfter(val)
		this.#query = query(this.#query, s)
		return this
	}

	startAt(...fieldValues: unknown[]): AlcQuery<T>
	startAt(snapshot: DocumentSnapshot<unknown>): AlcQuery<T>
	startAt(val: any): AlcQuery<T> {
		const s = startAt(val)
		this.#query = query(this.#query, s)
		return this
	}

	endBefore(...fieldValues: unknown[]): AlcQuery<T>
	endBefore(snapshot: DocumentSnapshot<unknown>): AlcQuery<T>
	endBefore(val: any): AlcQuery<T> {
		const s = endBefore(val)
		this.#query = query(this.#query, s)
		return this
	}

	endAt(...fieldValues: unknown[]): AlcQuery<T>
	endAt(snapshot: DocumentSnapshot<unknown>): AlcQuery<T>
	endAt(val: any): AlcQuery<T> {
		const s = endAt(val)
		this.#query = query(this.#query, s)
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
			m.setDocument(x)
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
							m.setValueByKey(relatedName, res)
						}
						if((relation.type === 'belongsTo' || relation.type === 'hasOne') && res.length) {
							m.setValueByKey(relatedName, res[0])
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
							m.setValueByKey(relatedName, res)
						}
						if((relation.type === 'belongsTo' || relation.type === 'hasOne') && res.length) {
							m.setValueByKey(relatedName, res[0])
						}

						if(v.relation) {
							const relatedNameSub = v.relation.replace(/\_/g, '')
							await Promise.all(res.map(async (d: T, k: number) => {
								await this.setHasManySub(m, [d], relatedNameSub, 0, '', '', `${relatedName}.${k}`)
							}))
						}
					}
				}

			}))
			data.push(m)
		}))
		return data
	}

	async setHasManySub(parentModel: T, rootModel: T[], relatedName: string, count: number = 0, path = '', targetKey:string = '', parentTargetKey: string = '') {
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
				if(parentTargetKey) {
					key = `${parentTargetKey}.${func[count]}`
				}
				const f = `_${func[count]}`
				if(model[f] == undefined) return
				const relation = model[f]()

				if(relation.type != 'hasManySub') {
					return
				}

				this.setQueryLog(relation?.query)
				const res = await relation.get()
				this.documentLen = this.documentLen+res.length
				if(res.length) {
					parentModel.setValueByKey(key, res)
					await this.setHasManySub(parentModel, res, relatedName, count + 1, relation.subPath, key)
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
		const log = {queryLog: this.queryLog, documentLen: this.documentLen}
		this.queryLog = []
		this.documentLen = 0
		this.logStack.push(log)
		const documentAll = this.logStack.map(x => x.documentLen).reduce((a, b) => a+b, 0)
		return {log, stack: this.logStack, documentAll}
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