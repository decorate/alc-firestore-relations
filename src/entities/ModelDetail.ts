import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import Info from '@/entities/Info'
import { ArrayMappable } from '@team-decorate/alcts/dist/index'
import RestaurantDetail from '@/entities/RestaurantDetail'
import Review from '@/entities/Review'
import Child from '@/entities/Child'

export default class ModelDetail extends FModel {
	tableName: string = 'model_detail'
	uid: string = ''
	text: string = ''

	constructor(data?: IIndexable) {
		super(data)
		this.primaryKey = 'uid'
		this.fillable = ['uid', 'text']
		this.sender = ['uid', 'text']

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
		)

		if(data) {
			this.data = data
		}
	}

}