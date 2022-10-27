import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'

export default class Info extends FModel {
	tableName: string = 'infos'
	id: string = ''
	body: string = ''

	constructor(data?: IIndexable) {
		super(data)
		this.fillable = ['id', 'body']

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
		)

		if(data) {
			this.data = data
		}
	}
}