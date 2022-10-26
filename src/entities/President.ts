import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'

export default class President extends FModel {
	tableName: string = 'presidents'
	id: string = ''
	name: string = ''
	restaurantId: string = ''

	constructor(data?: IIndexable) {
		super(data)
		this.fillable = ['id', 'name', 'restaurantId']

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
		)

		if(data) {
			this.data = data
		}
	}
}