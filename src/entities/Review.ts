import FModel  from '../FModel'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'

export default class Review extends FModel {
	tableName: string = 'reviews'
	id: string = ''
	title: string = ''
	body: string = ''
	restaurantId: string = ''
	sort: number = 0

	constructor(data?: IIndexable) {
		super(data)
		this.fillable = ['id', 'title', 'body', 'restaurantId', 'sort']
		this.presents = ['sort']

		this.idPrefix = new Date().getTime().toString() + '_'

		if(data) {
			this.data = data
		}
	}

}