import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import Review from '@/entities/Review'
import HasRelationships from '@/entities/traits/HasRelationships'
import { ArrayMappable } from '@team-decorate/alcts/dist/index'
import RestaurantDetail from '@/entities/RestaurantDetail'

export default class Restaurant extends FModel {
	tableName: string = 'restaurants'
	id: string = ''
	name: string = ''
	categoryId: number = 0
	detailId: string = ''
	reviews: Review[] = []
	detail: RestaurantDetail = new RestaurantDetail()

	constructor(data?: IIndexable) {
		super(data)
		this.fillable = ['id', 'name', 'categoryId', 'reviews', 'detailId', 'detail']

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
			new ArrayMappable(Review).bind('reviews')
		)

		if(data) {
			this.data = data
		}
	}

	_reviews() {
		return this.hasRelationships.hasMany(Review, 'restaurant_id')
	}

	_detail() {
		return this.hasRelationships.belongsTo(RestaurantDetail, 'detailId')
	}
}