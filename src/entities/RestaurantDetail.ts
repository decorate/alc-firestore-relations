import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'

export default class RestaurantDetail extends FModel {
	tableName: string = 'restaurant_detail'
	id: string = ''
	tel: string = ''
	email: string = ''

	constructor(data?: IIndexable) {
		super(data)
		this.fillable = ['id', 'tel', 'email']

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
		)

		if(data) {
			this.data = data
		}
	}
}