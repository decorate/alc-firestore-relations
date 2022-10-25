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
	WhereFilterOp
} from '@firebase/firestore'

export default class HasRelationships<T extends FModel> {
	parent: FModel
	query?: Query
	relatedModel?: {new (data: IIndexable): T}
	type: string = ''

	constructor(parent: FModel) {
		this.parent = parent
	}

	hasMany(related: {new (data: IIndexable): T}, foreignKey?: string, localKey?: string) {
		const model = new related({})
		this.relatedModel = related
		const colRef = collection(window.alcDB, model.table)
		this.query = query(colRef, where(foreignKey!, '==', this.parent.id))
		this.type = 'hasMany'
		return this
	}

	belongsTo(related: {new (data: IIndexable): T}, foreignKey?: string, localKey?: string) {
		const model = new related({})
		this.relatedModel = related
		const colRef = collection(window.alcDB, model.table)
		const p = this.parent as IIndexable
		this.query = query(colRef, where('id', '==', p[foreignKey!]))
		this.type = 'belongsTo'
		return this
	}

	where(fieldPath: string | FieldPath, opStr: WhereFilterOp, value: unknown) {
		this.query = query(this.query!, where(fieldPath, opStr, value))
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
}