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
	deleteDoc
} from '@firebase/firestore'
import { camelCase, camelToSnake, snakeToCamel } from '@/utility/stringUtility'
import pluralize from 'pluralize'

class FModel extends Model{
	id: string = ''
	tableName?: string
	prefix: string = ''
	db?: Firestore
	idPrefix: string = ''

	constructor(data: IIndexable) {
		super()

		if(window.alcPrefix) {
			this.prefix = window.alcPrefix
		}

		if(window.alcDB) {
			this.db = window.alcDB
		}

		this.data = data
	}

	async save() {
		const colRef = collection(this.db!, this.table)
		let d: DocumentReference<DocumentData>
		if(this.id) {
			d = doc(colRef, this.id)
		} else {
			d = doc(colRef)
		}
		const id = `${this.idPrefix}${d.id}`
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

	async truncate() {
		const ref = collection(this.db!, this.table)
		const q = query(ref)
		const snap = await getDocs(q)
		snap.forEach(x => {
			deleteDoc(x.ref)
		})
	}
}

export default FModel
