import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import Pref from '@/entities/Pref'
import { ArrayMappable } from '@team-decorate/alcts/dist/index'

export default class Address extends FModel {
	tableName: string = 'addresses'
	id: string = ''
	address: string = ''
	pref: Pref[] = []

	constructor(data?: IIndexable) {
		super(data)
		this.fillable = ['id', 'address', 'pref']
		this.sender = ['id', 'address']

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
			new ArrayMappable(Pref).bind('pref')
		)

		if(data) {
			this.data = data
		}
	}

	_pref() {
		return this.hasRelationships.hasManySub(Pref, `${this.id}/pref`)
	}
}