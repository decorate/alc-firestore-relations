import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import Review from '@/entities/Review'
import HasRelationships from '@/entities/traits/HasRelationships'
import { ArrayMappable } from '@team-decorate/alcts/dist/index'
import RestaurantDetail from '@/entities/RestaurantDetail'
import President from '@/entities/President'
import Address from '@/entities/Address'

export default class Restaurant extends FModel {
	tableName: string = 'restaurants'
	id: string = ''
	name: string = ''
	categoryId: number = 0
	detailId: string = ''
	reviews?: Review[] = []
	detail?: RestaurantDetail = new RestaurantDetail()
	president?: President = new President()
	addresses?: Address[] = []

	constructor(data?: IIndexable) {
		super(data)
		this.fillable = ['id', 'name', 'categoryId', 'reviews', 'detailId', 'detail', 'president', 'addresses']
		this.sender = ['id', 'name', 'categoryId', 'detailId']

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
			new ArrayMappable(Review).bind('reviews'),
			new ArrayMappable(Address).bind('addresses')
		)

		if(data) {
			this.data = data
		}
	}

	_reviews() {
		return this.hasRelationships.hasMany(Review)
	}

	_detail() {
		return this.hasRelationships.belongsTo(RestaurantDetail, 'detail_id')
	}

	_addresses() {
		return this.hasRelationships.hasManySub(Address, 'addresses')
	}

	_president() {
		return this.hasRelationships.hasOne(President)
	}

	static async test() {
		[
			{tel: '0311112222', email: 'test1@mail.com', name: 'ジョナサン', categoryId: 1},
		].map(async x => {
			const res = await new Restaurant({...x}).saveSub([
			])
		})
	}

	static async seed() {
		await Restaurant.truncate();
		await RestaurantDetail.truncate();
		await Review.truncate();
		await President.truncate();
		await Address.truncate();
		[
			{tel: '0311112222', email: 'test1@mail.com', name: 'ジョナサン', categoryId: 1},
			{tel: '0322223333', email: 'test2@mail.com', name: 'ガスト', categoryId: 1},
			{tel: '0343432322', email: 'test3@mail.com', name: 'デニーズ', categoryId: 1},
			{tel: '0319393939', email: 'test4@mail.com', name: '吉野家', categoryId: 2},
			{tel: '0338948210', email: 'test5@mail.com', name: 'すき家', categoryId: 2},
			{tel: '0348849100', email: 'test6@mail.com', name: '松屋', categoryId: 2},
		]
		.map(async x => {
			const r = await new RestaurantDetail(x).save()
			const res = await new Restaurant({...x, detailId: r.id}).saveSub([
				new Address({address: '錦糸町'}),
				new Address({address: '新小岩'})
			])
			new President({
				name: `${x.name}社長`,
				restaurantId: res.id
			}).save()
			Array.from(Array(10)).map((v,i) => {
				new Review({
					title: `${x.name}おいしい_${i}`,
					body: `${x.name}おいしかった_${i}`,
					restaurantId: res.id,
					sort: i
				}).save()
			})
		});
	}
}