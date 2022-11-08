import { Model } from '@team-decorate/alcts/dist/index'
import FModel from '@/FModel'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import {
	query,
	getDocs,
	updateDoc,
	where,
	Query,
	collection,
	FieldPath,
	QueryConstraint,
	WhereFilterOp,
	orderBy, OrderByDirection, limit, QueryDocumentSnapshot,
} from '@firebase/firestore'
import pluralize from 'pluralize'
import { camelCase, camelToSnake, snakeToCamel } from '@/utility/stringUtility'
import { doc, setDoc } from 'firebase/firestore'
import SimplePaginate from '@/entities/traits/SimplePaginate'
import AlcQuery from '@/entities/traits/AlcQuery'
import { IPaginate } from '@/interfaces/IPaginate'

type RelatedType = 'hasMany' | 'belongsTo' | 'hasOne' | 'hasManySub'

export default class HasRelationships<T extends FModel> {
	parent: FModel
	query?: Query
	relatedModel?: {new (data: IIndexable): T}
	type?: RelatedType
	subPath?: string
	snapShot?: QueryDocumentSnapshot
	paginator?: IPaginate<T>
	_primaryKey: string = ''
	private keys?: any

	constructor(parent: FModel, primaryKey:string = '') {
		this.parent = parent
		this._primaryKey = primaryKey
	}

	setQuery(path:string) {
		const colRef = collection(window.alcDB, path)
		this.query = query(colRef)
		return this
	}

	addQuery(_query: QueryConstraint|QueryConstraint[]) {
		if(Array.isArray(_query)) {
			_query.map(x => {
				this.query = query(this.query!, x)
			})
		} else {
			this.query = query(this.query!, _query)
		}
		return this
	}

	hasMany(related: {new (data: IIndexable): T}, foreignKey?: string, localKey?: string) {
		this.type = 'hasMany'
		const keys = this.getKeys(foreignKey, localKey)
		this.keys = keys
		const model = new related({})
		this.relatedModel = related
		const colRef = collection(window.alcDB, model.table)
		const p = this.parent as IIndexable
		this.query = query(colRef, where(keys.foreignKey!, '==', p[keys.localKey]))
		return this
	}

	hasManySub(related: new (data?: IIndexable) => T, foreignKey?: string) {
		const p = this.getPath(this.parent)
		this.type = 'hasManySub'
		const keys = this.getKeys(foreignKey)
		this.keys = keys
		this.relatedModel = related
		let path = `${p}/${keys.foreignKey!}`
		if(/\//.test(keys.foreignKey!)) {
			path = keys.foreignKey!
		}
		this.subPath = path
		try {
			const colRef = collection(window.alcDB, path)
			this.query = query(colRef)
		} catch(e) {}
		return this
	}

	getPath(parent?: FModel, d:FModel[] = [], skip:number = 0) {
		if(parent) {
			d.push(parent)
			this.getPath(parent?.parent, d)
			//return ''
		}
		return d.slice().reverse().filter((x, i) => i >= skip).map((x, i) => {
			const data = x as IIndexable
			if(!i) {
				return `${x.table}/${data[x.primaryKey]}`
			}
			return `/${x.tableName}/${data[x.primaryKey]}`
		}).join('')
	}

	belongsTo(related: {new (data: IIndexable): T}, foreignKey?: string, localKey?: string) {
		this.type = 'belongsTo'
		const model = new related({})
		const keys = this.getKeys(foreignKey, localKey, model)
		this.keys = keys
		this.relatedModel = related
		const colRef = collection(window.alcDB, model.table)
		const p = this.parent as IIndexable
		this.query = query(colRef, where(keys.localKey, '==', p[keys.foreignKey!]))
		return this
	}

	hasOne(related: {new (data: IIndexable): T}, foreignKey?: string, localKey?: string) {
		this.type = 'hasOne'
		const model = new related({})
		const keys = this.getKeys(foreignKey, localKey)
		this.keys = keys
		this.relatedModel = related
		const colRef = collection(window.alcDB, model.table)
		const p = this.parent as IIndexable
		this.query = query(colRef, where(keys.foreignKey!, '==', p[keys.localKey]))
		return this
	}

	simplePaginate(limit = 15) {
		this.paginator = new SimplePaginate(this)
		this.paginator.setLimit(limit)
		return this.paginator
	}

	where(fieldPath: string | FieldPath, opStr: WhereFilterOp, value: unknown) {
		this.query = query(this.query!, where(fieldPath, opStr, value))
		return this
	}

	orderBy(fieldPath: string | FieldPath, directionStr?: OrderByDirection) {
		this.query = query(this.query!, orderBy(fieldPath, directionStr))
		return this
	}

	limit(num: number) {
		this.query = query(this.query!, limit(num))
		return this
	}

	async get(): Promise<T[]> {
		const data: T[] = []
		const snap = await getDocs(this.query!)
		if(snap.docs.length) {
			this.snapShot = snap.docs[snap.docs.length-1]
		}
		snap.forEach(x => {
			const m = new this.relatedModel!(x.data() as IIndexable)
			m.setParent(this.parent)
			m.setDocument(x)
			data.push(m)
		})
		return data
	}

	getKeys(foreignKey?: string, localKey?: string, model?: FModel) {
		if(!foreignKey) {
			if(this.type === 'belongsTo') {
				foreignKey = snakeToCamel(pluralize(model!.tableName || model!.constructor.name, 1)) + `${camelCase(this.primaryKey)}`
			} else {
				foreignKey = camelToSnake(pluralize(this.parent.tableName || this.parent.constructor.name, 1)) + `_${this.primaryKey}`
			}
		} else {
			if(this.type === 'belongsTo') {
				foreignKey = snakeToCamel(foreignKey) || foreignKey
			}
		}
		if(!localKey) {
			if(this.type !== 'belongsTo') {
				localKey = this.primaryKey
			} else {
				localKey = model!.primaryKey
			}
		}
		return {
			foreignKey,
			localKey
		}
	}

	async save(data: T|T[]) {
		switch(this.type) {
			case 'hasMany':
				await this.hasManySave(data)
				break
			case 'hasManySub':
				await this.hasManySubSave(data)
				break
			case 'belongsTo':
				await this.belongsToSave(data as T)
				break
			case 'hasOne':
				await this.hasOneSave(data as T)
				break
		}
	}

	async hasOneSave(data: T) {
		const p = this.parent as IIndexable
		const tableName = new this.relatedModel!({}).table
		const col = collection(window.alcDB, tableName)
		const q = query(col, where(this.keys.foreignKey!, '==', p[this.keys.localKey]))
		const res = await getDocs(q)
		if(!res.empty) {
			const d = new this.relatedModel!(Object.assign(res.docs[0].data(), data.getPostable()))
			await d.save()
		} else {
			data.update({[this.keys.foreignKey!]: p[this.keys.localKey]})
			await data.save()
		}
	}

	async belongsToSave(data: T) {
		const p = this.parent as IIndexable
		if(p[this.keys.foreignKey!]) {
			data.update({[this.keys.localKey]: p[this.keys.foreignKey!]})
		}
		const res = await data.save()
		const r = res as IIndexable
		this.parent.update({[this.keys.foreignKey!]: r[this.keys.localKey]})
		await this.parent.save(false)
	}

	async hasManySave(data: T|T[]) {
		const keys = this.getKeys()
		const p = this.parent as IIndexable
		if(Array.isArray(data)) {
			await Promise.all(data.map(async x => {
				x.update({[keys.foreignKey!]: p[this.keys.localKey]})
				await x.save()
				return x
			}))
			return
		}

		data.update({[keys.foreignKey!]: p[this.keys.localKey]})
		await data.save()
	}

	async hasManySubSave(data: T|T[]) {
		if(Array.isArray(data)) {
			data.map(async x => {
				const col = collection(window.alcDB, this.subPath!)
				let d = doc(col)
				x.update({id: x.id || `${x.idPrefix}${d.id}`})
				x.setParent(this.parent)
				d = doc(col, x.id)
				const data = {...x.getPostable()} as IIndexable
				x.addTimeStamp(data)
				await setDoc(d, data)
				await Promise.all(x.arrayMapTarget.map(async v => {
					const m = x as IIndexable
					if(m[`_${v.bindKey}`]) {
						if(m[v.bindKey].length) {
							await this.setRelations(m, v.bindKey)
						}
					}
				}))
			})
			return
		}
		const col = collection(window.alcDB, this.subPath!)
		let d = doc(col)
		data.update({id: data.id || `${data.idPrefix}${d.id}`})
		d = doc(col, data.id)
		data.setParent(this.parent)
		const params = {...data.getPostable()} as IIndexable
		data.addTimeStamp(params)
		await setDoc(d, params)
		await Promise.all(data.arrayMapTarget.map(async x => {
			const d = data as IIndexable
			if(d[`_${x.bindKey}`]) {
				if(d[x.bindKey].length) {
					await this.setRelations(d, x.bindKey)
				}
			}
		}))
	}

	private async setRelations(source: IIndexable, bindKey: string) {
		const relation = source[`_${bindKey}`]()
		if(!relation) {
			return
		}
		await relation.save(source[bindKey])
	}

	get primaryKey() {
		return this._primaryKey || 'id'
	}
}