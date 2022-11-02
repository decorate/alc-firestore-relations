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
	deleteDoc, Query, FieldPath, WhereFilterOp, where, Timestamp
} from '@firebase/firestore'
import { camelCase, camelToSnake, snakeToCamel } from '@/utility/stringUtility'
import pluralize, { isPlural, isSingular } from 'pluralize'
import HasRelationships from '@/entities/traits/HasRelationships'
import AlcQuery from '@/entities/traits/AlcQuery'
import {setValueByKey, getValueByKey} from '@/utility/objectUtility'
import SimplePaginate from '@/entities/traits/SimplePaginate'

export default class FModel extends Model {
	query: Query
	id: string = ''
	tableName: string = ''
	prefix: string = ''
	db: Firestore
	idPrefix: string = ''
	parent?: FModel
	createdAt?: Timestamp
	updatedAt?: Timestamp
	document?: DocumentData

	_sender: string[] = []

	getValueByKey: (key: string) => {}
	setValueByKey: <T extends FModel>(key: string, value: any, model?: T) => void

	constructor(data?: IIndexable) {
		super()

		this.getValueByKey = getValueByKey.bind(this)
		this.setValueByKey = setValueByKey.bind(this)

		if(window.alcPrefix) {
			this.prefix = window.alcPrefix
		}

		this.db = window.alcDB

		this.query = query(collection(this.db, this.table))

		const field = ['createdAt', 'updatedAt']
		this.sender.length ? this.sender.push(...field) : this.fillable.push(...field)

		if(data) {
			this.data = data
		}
	}

	async save(fireRelation = true) {
		const colRef = collection(this.db!, this.table)
		const d = doc(colRef)
		const id = this.id || `${this.idPrefix}${d.id}`
		const _doc = doc(colRef, id)
		const data = {
			...this.getPostable(),
			id: id
		} as IIndexable

		this.addTimeStamp(data)

		this.id = id
		await setDoc(_doc, data)

		if(!fireRelation) {
			return this
		}

		await Promise.all(this.arrayMapTarget
		.filter(x => {
			const model = this as IIndexable
			return model[x.bindKey].length
		})
		.map(async x => {
			const model = this as IIndexable
			if(model['_' + x.bindKey]) {
				await model['_' + x.bindKey]().save(model[x.bindKey])
			}
		}))


		await Promise.all(Object.entries(this)
		.filter(x => {
			const model = this as IIndexable
			return (model[x[0]] instanceof FModel)
		})
		.filter(x => {
			const model = this as IIndexable
			return Object.keys(model[x[0]].getPostable())
			.filter(v => ['created_at', 'updated_at', 'createAt', 'updatedAt'].every(k => k != v))
				.length
		})
		.map(async x => {
			const model = this as IIndexable
			if(model['_' + x[0]]) {
				await model['_' + x[0]]().save(model[x[0]])
			}
		}))

		return this
	}

	async saveSub<T extends FModel>(data: T[]) {
		const res = await this.save()
		await Promise.all(data.map(async x => {
			const tableName = x.tableName || pluralize(x.constructor.name)
			const colRef = collection(this.db!, res.table, res.id, tableName)
			const d = doc(colRef)
			const id = x.id || `${x.idPrefix}${d.id}`

			const _doc = doc(colRef, id)
			const data = {
				...x.getPostable(),
				id: id
			}
			await setDoc(_doc, data)
		}))
		return this
	}

	get table(): string {
		let name = this.tableName
		if(!name) {
			const c = camelCase(this.constructor.name)
			name = pluralize(c)
		}
		return `${this.prefix}${name}`
	}

	get hasRelationships() {
		return (new HasRelationships(this))
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

	static paginate<T extends FModel>(this: new (data?: IIndexable) => T) {
		const m = new this()
		const q = new AlcQuery(this, query(m.query))
		q.createPaginator()
		return q
	}

	setParent(model: FModel) {
		this.parent = model
	}

	addTimeStamp(data: IIndexable) {
		const upKey = this.converter.camelToSnake('updatedAt')
		const cKey = this.converter.camelToSnake('createdAt')

		data[cKey] = this.createdAt ?? Timestamp.now()
		data[upKey] = Timestamp.now()

		if(!this.createdAt) {
			this.createdAt = data[cKey]
		}
		if(!this.updatedAt) {
			this.updatedAt = data[upKey]
		}
	}

	setDocument(_doc: DocumentData) {
		this.document = _doc
	}
}
