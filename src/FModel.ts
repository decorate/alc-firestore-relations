import {Model} from '@team-decorate/alcts/dist/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import {
	Firestore,
	collection,
	addDoc,
	setDoc,
	doc,
	DocumentData,
	DocumentReference,
	query,
	getDocs,
	deleteDoc, Query, FieldPath, WhereFilterOp, where,
} from '@firebase/firestore'
import { camelCase, camelToSnake, snakeToCamel } from '@/utility/stringUtility'
import pluralize from 'pluralize'
import HasRelationships from '@/entities/traits/HasRelationships'
import AlcQuery from '@/entities/traits/AlcQuery'

class FModel extends Model {
	query: Query
	id: string = ''
	tableName?: string
	prefix: string = ''
	db: Firestore
	idPrefix: string = ''

	constructor(data?: IIndexable) {
		super()

		if(window.alcPrefix) {
			this.prefix = window.alcPrefix
		}

		this.db = window.alcDB

		this.query = query(collection(this.db, this.table))

		if(data) {
			this.data = data
		}
	}

	async save() {
		const colRef = collection(this.db!, this.table)
		const d = doc(colRef)
		const id = this.id || `${this.idPrefix}${d.id}`
		const _doc = doc(colRef, id)
		const data = {
			...this.getPostable(),
			id: id
		}
		this.id = id
		await setDoc(_doc, data)
		return this
	}

	async truncate() {
		const ref = collection(this.db!, this.table)
		const q = query(ref)
		const snap = await getDocs(q)
		snap.forEach(x => {
			deleteDoc(x.ref)
		})
	}

	get table(): string {
		let name = this.tableName
		if(!name) {
			name = pluralize(camelCase(this.constructor.name))
		}
		return `${this.prefix}${name}`
	}

	get hasRelationships() {
		return (new HasRelationships(this))
	}

	static with<T extends FModel>(this: new (data?: IIndexable) => T, ...related: Array<string>) {

	}

	static query<T extends FModel>(this: new (data?: IIndexable) => T) {
		const m = new this()
		return new AlcQuery(this, query(m.query))
	}

	static where<T extends FModel>(this: new (data?: IIndexable) => T, fieldPath: string | FieldPath, opStr: WhereFilterOp, value: unknown) {
		const w = where(fieldPath, opStr, value)
		const m = new this()
		return new AlcQuery(this, query(m.query, w))
	}

}

export default FModel
