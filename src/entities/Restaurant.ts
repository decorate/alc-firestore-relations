import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'

export default class Restaurant extends FModel {
	tableName: string = 'restaurants'
	id: string = ''
	name: string = ''
	categoryId: number = 0

	constructor(data: IIndexable) {
		super(data)
		this.fillable = ['id', 'name', 'categoryId']

		this.idPrefix = new Date().getTime().toString() + '_'
		this.data = data
	}
}