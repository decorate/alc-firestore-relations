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
	QueryDocumentSnapshot, collection, startAfter, DocumentSnapshot, endBefore, startAt, endAt, DocumentData,
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

type WithQuery = {
	key: string,
	query: () => QueryConstraint|QueryConstraint[],
	relation?: string
}

type WithQueryConvert = WithQuery & {
	queryTarget: string
}

export default class AlcQuery<T extends FModel> {
	#query: Query
	model: new (data?: IIndexable) => T
	withRelated: Array<string|{key: string, query: any, relation?: string}>
	snapShot?: QueryDocumentSnapshot
	paginator?: IPaginate<T>
	primaryKey: string = ''
	private queryLog: string[] = []
	private documentLen: number = 0
	private logStack: any[] = []

	constructor(model: new (data?: IIndexable) => T, query: Query, primaryKey: string = '') {
		this.#query = query
		this.model = model
		this.withRelated = []
		this.primaryKey = primaryKey
	}

	query() {
		return this
	}

	addQuery(_query: QueryConstraint) {
		this.#query = query(this.#query, _query)
		return this
	}

	with(related: Array<string|WithQuery>) {
		related.map(x => this.withRelated.push(x))
		this.withRelated = [...new Set(this.withRelated)]
		return this
	}

	async find(value: string) {
		this.addQuery(where(this.primaryKey, '==', value))
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
			this.documentLen = this.documentLen + d.docs.length
			this.snapShot = d.docs[d.docs.length-1]
		}
		const data: T[] = []

		await Promise.all(d.docs.map(async x => {
			let m = new this.model(x.data())
			m.setDocument(x)
			await Promise.all(this.withRelated.map(async v => {
				if(typeof v == 'string') {
					const relatedName = this.getRelatedName(v)
					await this.setRelations(m, [m], relatedName)
				} else {
					await this.setRelationsQuery(m, [m], v)
				}

			}))
			data.push(m)
		}))
		return data
	}

	async setRelations(parent: T, roots: T[], relatedName: string, parentIndex: number = 0, targetKey: string = '', parentType: string = '', withQuery?: WithQueryConvert) {
		await Promise.all(
			roots.map(async (x, i) => {
				const propertyName = this.getRelatedName(relatedName, parentIndex)
				const funcName = `_${propertyName}`
				const model = x as IIndexable

				if(model[funcName] == undefined) return
				const relation = model[funcName]() as HasRelationships<T>

				let key = propertyName
				if(targetKey && propertyName) {
					if(relation.type === 'hasMany' || relation.type === 'hasManySub') {
						key = `${targetKey}.${i}.${propertyName}`
					} else {
						key = `${targetKey}.${propertyName}`
					}
				}

				if(relation.type === 'hasManySub') {
					let skip = 0
					if(parentType && relation.type != parentType) {
						skip = 1
					}
					let path = relation.getPath(relation.parent, [], skip) + `/${propertyName}`
					if(window.alcPrefix) {
						path = relation.getPath(relation.parent, [], skip) + `/${window.alcPrefix}${propertyName}`
					}
					relation.setQuery(path)
					relation.subPath = path
				}
				if(funcName === withQuery?.queryTarget) {
					relation.addQuery(withQuery.query())
				}
				this.setQueryLog(relation?.query)
				const res = await relation.get()
				this.documentLen = this.documentLen+res.length
				if(res.length) {
					const s = relatedName.split('.').slice()
					s.splice(parentIndex+1)
					if(relation.type == 'hasMany' || relation.type == 'hasManySub') {
						parent.setValueByKey(key, res)
					} else {
						parent.setValueByKey(key, res[0])
					}
					if(funcName === withQuery?.queryTarget) {
						if(withQuery.relation) {
							await this.setRelations(parent, res, withQuery.relation, 0, key, relation.type, withQuery)
						}
					} else {
						await this.setRelations(parent, res, relatedName, parentIndex + 1, key, relation.type, withQuery)
					}
				}
			})
		)
	}

	async brigeSetRelations(parent:T, roots:T[], related: WithQueryConvert) {
		await this.setRelations(parent, roots, related.key, 0, '', '', related)
	}

	async setRelationsQuery(parent: T, roots: T[], related: WithQuery, parentIndex: number = 0, targetKey: string = '', parentType: string = '') {
		if(!parentIndex) {
			const propertyName = this.getRelatedNameConvert(related)
			await this.brigeSetRelations(parent, roots, propertyName)
			return
		}
		await Promise.all(
			roots.map(async (x, i) => {

				// if(!propertyName.query) {
				// 	await this.setRelations(parent, roots, accessKey)
				// 	return
				// }
				// const model = x as IIndexable
				// if(model[accessKey] === undefined) return
				// const relation = await model[accessKey]() as HasRelationships<T>
			})
		)
	}

	getRelatedName(val: string, index?: number) {
		const r = val.replace(/\_/g, '')
		if(index === undefined) {
			return r
		}

		return r.split('.')[index]
	}

	getRelatedNameConvert(val: WithQuery) {
		const s = val.key.split('.')
		return {
			key: val.key,
			queryTarget: s[s.length -1],
			query: val.query,
			relation: val.relation
		}
	}

	getRelatedNameInQuery(val: WithQuery, index: number) {
		const r = val.key.replace(/\_/g, '')
		const s = r.split('.')
		if((s.length - 1) == index) {
			return {key: s[index], query: val.query, relation: val.relation}
		}
		return {key: s[index], query: undefined, relation: undefined}
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
		let path = q.path.segments.join('/')
		let filter = q.filters.map((x: any) => {
			const f = x.field.segments.join('/')
			const op = x.op
			let v = x.value.stringValue
			if(!v) {
				v = x.value.arrayValue?.values?.map((d: any) => d.stringValue).join(',')
				if(v) {
					v = `[${v}]`
				} else {
					v = ''
				}
			}
			const a = `f:${f}${op}${v}`
			return a
		}).join(',')
		if(filter) {
			filter = `|${filter}`
		}
		let order = q.explicitOrderBy.map((x: any) => {
			const dir = x.dir
			const f = x.field.segments.join('/')
			return `ob:${f}${dir}`
		}).join(',')
		if(order) {
			order = `|${order}`
		}

		let limit = ''
		if(q.limit) {
			limit = `|l:${q.limit}`
		}

		let group = ''
		if(q.collectionGroup) {
			group = `|cg:${q.collectionGroup}`
		}
		this.queryLog.push(`${group}${path}${filter}${order}${limit}`)
	}
}