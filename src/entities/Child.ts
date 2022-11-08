import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import Info from '@/entities/Info'
import { ArrayMappable } from '@team-decorate/alcts/dist/index'
import RestaurantDetail from '@/entities/RestaurantDetail'
import Review from '@/entities/Review'

export default class Child extends FModel {
	tableName: string = 'child'
	id: string = ''
	text: string = ''
	modelUid: string = ''

	constructor(data?: IIndexable) {
		super(data)
		this.fillable = ['id', 'text', 'modelUid']

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
		)

		if(data) {
			this.data = data
		}
	}

}