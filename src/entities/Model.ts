import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import Info from '@/entities/Info'
import { ArrayMappable } from '@team-decorate/alcts/dist/index'
import RestaurantDetail from '@/entities/RestaurantDetail'
import Review from '@/entities/Review'
import Child from '@/entities/Child'
import ModelDetail from '@/entities/ModelDetail'
import Target from '@/entities/Target'
import Address from '@/entities/Address'

export default class Model extends FModel {
	tableName: string = 'model'
	uid: string = ''
	text: string = ''
	detailId: string = ''
	detail: RestaurantDetail = new RestaurantDetail()
	modelDetail: ModelDetail = new ModelDetail()
	modelDetailId: string = ''
	child: Child[] = []
	targets: Target[] = []
	addresses: Address[] = []

	constructor(data?: IIndexable) {
		super(data)
		this.primaryKey = 'uid'
		this.fillable = ['uid', 'text', 'detail', 'detailId', 'modelDetail', 'modelDetailId', 'child', 'targets', 'addresses']
		this.sender = this.fillable.filter(x => ['detail', 'child', 'targets', 'addresses'].every(v => v != x))

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
			new ArrayMappable(Child).bind('child'),
			new ArrayMappable(Target).bind('targets'),
			new ArrayMappable(Address).bind('addresses')
		)

		if(data) {
			this.data = data
		}
	}

	_detail() {
		return this.hasRelationships.belongsTo(RestaurantDetail, 'detail_id')
	}

	_modelDetail() {
		return this.hasRelationships.belongsTo(ModelDetail, 'model_detail_id')
	}

	_child() {
		return this.hasRelationships.hasMany(Child)
	}

	_targets() {
		return this.hasRelationships.hasMany(Target)
	}

	_addresses() {
		return this.hasRelationships.hasManySub(Address, 'addresses')
	}
}