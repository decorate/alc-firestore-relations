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

type RelatedType = 'hasMany' | 'belongsTo' | 'hasOne' | 'hasManySub'

export default class HasRelationships<T extends FModel> {
	parent: FModel
	query?: Query
	relatedModel?: {new (data: IIndexable): T}
	type?: RelatedType
	subPath?: string

	constructor(parent: FModel) {
		this.parent = parent
	}

	setQuery(path:string) {
		const colRef = collection(window.alcDB, path)
		this.query = query(colRef)
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

	hasManySub(related: {new (data: IIndexable): T}, foreignKey?: string, localKey?: string) {
		this.type = 'hasManySub'
		const keys = this.getKeys(foreignKey, localKey)
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
}