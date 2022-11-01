import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import PresidentDetail from '@/entities/PresidentDetail'

export default class President extends FModel {
	tableName: string = 'presidents'
	id: string = ''
	name: string = ''
	restaurantId: string = ''
	detailId: string = ''
	detail: PresidentDetail = new PresidentDetail()

	constructor(data?: IIndexable) {
		super(data)
		this.fillable = ['id', 'name', 'restaurantId', 'detail', 'detailId']
		this.sender = ['id', 'name', 'restaurantId', 'detailId']

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
		)

		if(data) {
			this.data = data
		}
	}

	_detail() {
		return this.hasRelationships.belongsTo(PresidentDetail, 'detail_id')
	}
}