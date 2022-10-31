import { Model } from '@team-decorate/alcts/dist/index'
import FModel from '@/FModel'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import {
	query,
	getDocs,
	where,
	Query,
	collection,
	FieldPath,
	QueryConstraint,
	WhereFilterOp,
	orderBy, OrderByDirection,
} from '@firebase/firestore'
import pluralize from 'pluralize'
import { camelToSnake, snakeToCamel } from '@/utility/stringUtility'
import { doc, setDoc } from 'firebase/firestore'

type RelatedType = 'hasMany' | 'belongsTo' | 'hasOne' | 'hasManySub'

export default class HasRelationships<T extends FModel> {
	parent: FModel
	query?: Query
	relatedModel?: {new (data: IIndexable): T}
	type?: RelatedType
	subPath?: string
	private keys?: any

	constructor(parent: FModel) {
		this.parent = parent
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
		const model = new related({})
		this.relatedModel = related
		const colRef = collection(window.alcDB, model.table)
		const p = this.parent as IIndexable
		this.query = query(colRef, where(keys.foreignKey!, '==', p[keys.localKey]))
		return this
	}

	hasManySub(related: {new (data: IIndexable): T}, foreignKey?: string) {
		this.type = 'hasManySub'
		const keys = this.getKeys(foreignKey)
		this.relatedModel = related
		let path = `${this.parent.table}/${this.parent.id}/${keys.foreignKey!}`
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
		this.relatedModel = related
		const colRef = collection(window.alcDB, model.table)
		const p = this.parent as IIndexable
		this.query = query(colRef, where(keys.foreignKey!, '==', p[keys.localKey]))
		return this
	}

	where(fieldPath: string | FieldPath, opStr: WhereFilterOp, value: unknown) {
		this.query = query(this.query!, where(fieldPath, opStr, value))
		return this
	}

	orderBy(fieldPath: string | FieldPath, directionStr?: OrderByDirection) {
		this.query = query(this.query!, orderBy(fieldPath, directionStr))
		return this
	}

	async get(): Promise<T[]> {
		const data: T[] = []
		const snap = await getDocs(this.query!)
		snap.forEach(x => {
			data.push(new this.relatedModel!(x.data() as IIndexable))
		})
		return data
	}

	getKeys(foreignKey?: string, localKey?: string, model?: FModel) {
		if(!foreignKey) {
			if(this.type === 'belongsTo') {
				foreignKey = snakeToCamel(pluralize(model!.tableName || model!.constructor.name, 1)) + 'Id'
			} else {
				foreignKey = camelToSnake(pluralize(this.parent.tableName || this.parent.constructor.name, 1)) + '_id'
			}
		} else {
			if(this.type === 'belongsTo') {
				foreignKey = snakeToCamel(foreignKey) || foreignKey
			}
		}
		if(!localKey) {
			localKey = 'id'
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
		}
	}

	async belongsToSave(data: T) {
		const p = this.parent as IIndexable
		if(p[this.keys.foreignKey!]) {
			data.update({[this.keys.localKey]: p[this.keys.foreignKey!]})
		}
		const res = await data.save()
		this.parent.update({[this.keys.foreignKey!]: res.id})
		await this.parent.save()
	}

	async hasManySave(data: T|T[]) {
		const keys = this.getKeys()
		if(Array.isArray(data)) {
			await Promise.all(data.map(async x => {
				x.update({[keys.foreignKey!]: this.parent.id})
				await x.save()
				return x
			}))
			return
		}

		data.update({[keys.foreignKey!]: this.parent.id})
		await data.save()
	}

	async hasManySubSave(data: T|T[]) {
		if(Array.isArray(data)) {
			data.map(async x => {
				const col = collection(window.alcDB, this.subPath!)
				const d = doc(col)
				x.update({id: d.id})
				await setDoc(d, x.getPostable())
				await Promise.all(x.arrayMapTarget.map(async v => {
					const m = x as IIndexable
					if(m[`_${v.bindKey}`]) {
						if(m[v.bindKey].length) {
							this.setRelations(this.subPath!, m, v.bindKey)
						}
					}
				}))
			})
			return
		}
		const col = collection(window.alcDB, this.subPath!)
		const d = doc(col)
		data.update({id: d.id})
		await setDoc(d, data.getPostable())
		await Promise.all(data.arrayMapTarget.map(async x => {
			const d = data as IIndexable
			if(d[`_${x.bindKey}`]) {
				if(d[x.bindKey].length) {
					this.setRelations(this.subPath!, d, x.bindKey)
				}
			}
		}))
	}

	private async setRelations(_path = '', source: IIndexable, bindKey: string) {
		const relation = source[`_${bindKey}`]()
		if(!relation) {
			return
		}
		const path = `${_path}/${relation.subPath!}`
		relation.setQuery(path)
		relation.subPath = path
		await relation.save(source[bindKey])
		source[bindKey].map((v: T) => {
			v.arrayMapTarget.map(k => {
				const s = v as IIndexable
				this.setRelations(`${path}`, s, k.bindKey)
			})
		})
	}
}