import { FModel } from '@/index'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import Review from '@/entities/Review'
import HasRelationships from '@/entities/traits/HasRelationships'
import { ArrayMappable } from '@team-decorate/alcts/dist/index'
import RestaurantDetail from '@/entities/RestaurantDetail'
import President from '@/entities/President'
import Address from '@/entities/Address'
import {faker} from '@faker-js/faker'
import PresidentDetail from '@/entities/PresidentDetail'
import Pref from '@/entities/Pref'
import Test from '@/entities/Test'
import Info from '@/entities/Info'

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

	static async seed(num = 1) {
		await Promise.all(Array.from(Array(num))
			.map(async (x, i) => {

				const reviews = this.randomArr(11).map((v, k) => {
					return new Review({
						title: faker.random.word(),
						body: faker.random.words()
					})
				})

				const addresses = this.randomArr(5).map(x => {
					const pref = this.randomArr(5).map(v => {
						const infos = this.randomArr(3).map(k => {
							return new Info({
								body: faker.random.words()
							})
						})
						const tests = this.randomArr(3).map(k => {
							return new Test({
								text: faker.random.word(),
								infos
							})
						})
						return new Pref({
							text: faker.address.state(),
							tests
						})
					})
					return new Address({
						address: faker.address.cityName(),
						pref
					})
				})

				await new Restaurant({
					name: faker.company.name(),
					detail: new RestaurantDetail({
						tel: faker.phone.number(),
						email: faker.internet.email()
					}),
					president: new President({
						name: faker.name.fullName(),
						detail: new PresidentDetail({
							tel: faker.phone.number(),
						})
					}),
					reviews: reviews,
					addresses: addresses
				}).save()
			}))
	}

	static randomArr(max :number) {
		return [...Array(Math.floor(Math.random() * max) + 1)]
	}
}