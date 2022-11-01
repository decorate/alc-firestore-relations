import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import Info from '@/entities/Info'
import { ArrayMappable } from '@team-decorate/alcts/dist/index'

export default class Test extends FModel {
	tableName: string = 'tests'
	id: string = ''
	text: string = ''
	infos: Info[] = []

	constructor(data?: IIndexable) {
		super(data)
		this.fillable = ['id', 'text']

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
			new ArrayMappable(Info).bind('infos')
		)

		if(data) {
			this.data = data
		}
	}

	_infos() {
		return this.hasRelationships.hasManySub(Info, `infos`)
	}
}