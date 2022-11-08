import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import Info from '@/entities/Info'
import { ArrayMappable } from '@team-decorate/alcts/dist/index'
import RestaurantDetail from '@/entities/RestaurantDetail'
import Review from '@/entities/Review'

export default class Target extends FModel {
	tableName: string = 'targets'
	uid: string = ''
	text: string = ''
	modelUid: string = ''

	constructor(data?: IIndexable) {
		super(data)
		this.primaryKey = 'uid'
		this.fillable = ['uid', 'text', 'modelUid']

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
		)

		if(data) {
			this.data = data
		}
	}

}