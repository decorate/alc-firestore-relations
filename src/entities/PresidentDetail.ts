import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'

export default class PresidentDetail extends FModel {
	tableName: string = 'president_details'
	id: string = ''
	tel: string = ''

	constructor(data?: IIndexable) {
		super(data)
		this.fillable = ['id', 'tel']

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
		)

		if(data) {
			this.data = data
		}
	}
}