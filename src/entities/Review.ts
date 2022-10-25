import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'

export default class Review extends FModel {
	tableName: string = 'reviews'
	id: string = ''
	title: string = ''
	body: string = ''
	restaurantId: string = ''

	constructor(data: IIndexable) {
		super(data)
		this.fillable = ['id', 'title', 'body', 'restaurantId']

		this.idPrefix = new Date().getTime().toString() + '_'
		this.data = data
	}

}