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

	_sender: string[] = []

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

	static async truncate<T extends FModel>(this: new (data?: IIndexable) => T) {
		const m = new this()
		const ref = collection(m.db!, m.table)
		const q = query(ref)
		const snap = await getDocs(q)
		snap.forEach(x => {
			deleteDoc(x.ref)
		})
	}


	set sender(v: string[]) {
		this._sender = v
	}

	get sender() {
		return this._sender
	}

	public getPostable(): IIndexable {
		this.beforePostable()

		const source = this.sender.length ? this.sender : this.fillable

		const res = Object.entries(this)
		.filter(x => source.some(v => v == x[0]))
		.filter(x => x[1] || this.joinWhere(x))
		.map(x => {
			const v = {key: x[0], value: x[1]}
			const key = this.converter.camelToSnake(v.key)

			if (v.value && v.value.getPostable instanceof Function) {
				v.value = v.value.getPostable()
			}

			if (v.value instanceof Array && v.value[0]) {
				if (v.value[0].getPostable instanceof Function) {
					v.value = v.value.map(y => y.getPostable())
				}
			}

			return {[key]: v.value}
		})

		const v = this.mapToObject(res)
		this.afterPostable(v)

		return v
	}
}

export default FModel
