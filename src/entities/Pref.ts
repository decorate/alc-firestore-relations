import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import Test from '@/entities/Test'
import { ArrayMappable } from '@team-decorate/alcts/dist/index'

export default class Pref extends FModel {
	tableName: string = 'pref'
	id: string = ''
	text: string = ''
	tests: Test[] = []

	constructor(data?: IIndexable) {
		super(data)
		this.fillable = ['id', 'text']

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
			new ArrayMappable(Test).bind('tests')
		)

		if(data) {
			this.data = data
		}
	}

	_tests() {
		return this.hasRelationships.hasManySub(Test, `tests`)
	}
}