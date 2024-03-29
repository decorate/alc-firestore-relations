import { SetUpFirestore } from '@/entities/SetUpFirestore'
import config from '@/private/config.json'
import Restaurant from '@/entities/Restaurant'
import { collection, collectionGroup, getDocs, limit, orderBy, query, Timestamp, where } from '@firebase/firestore'
import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, doc, getFirestore, setDoc } from 'firebase/firestore'
import axios from 'axios'
import Address from '@/entities/Address'
import RestaurantDetail from '@/entities/RestaurantDetail'
import Review from '@/entities/Review'
import { camelCase } from '@/utility/stringUtility'
import pluralize from 'pluralize'
import President from '@/entities/President'
import Test from '@/entities/Test'
import Info from '@/entities/Info'
import PresidentDetail from '@/entities/PresidentDetail'
import Pref from '@/entities/Pref'
import Model from '@/entities/Model'
import Child from '@/entities/Child'
import ModelDetail from '@/entities/ModelDetail'
import Target from '@/entities/Target'
config.prefix = 'jest_'

async function clearDb() {
	await Promise.all([
		'jest_restaurants',
		'jest_restaurant_detail',
		'jest_reviews',
		'jest_presidents',
		'jest_president_details',
		'jest_addresses',
		'jest_tests',
		'jest_pref',
		'jest_model',
		'jest_models',
		'jest_child',
		'jest_model_detail',
		'jest_targets'
	].map(async x => {
		await axios.delete(`http://localhost:9092/emulator/v1/projects/test/databases/(default)/documents/${x}`)
	}))
}

describe('firestore test', () => {
	let isClear = true
	beforeAll( () => {
		new SetUpFirestore(config)
	})

	beforeEach(() => {
	})

	afterAll(() => {
	})

	afterEach(() => {
		if(isClear) {
			return clearDb()
		}
	})

	test('update sub collection', async () => {
		await new Restaurant({
			id: 'test',
			name: 'test data'
		}).save()

		let r = await Restaurant.query().find('test')
		expect(r?.name).toBe('test data')

		r?.update({addresses: [
				new Address({address: 'A'}),
				new Address({address: 'B'}),
			]})
		await r?.save()
		r = await Restaurant.query().with(['_addresses']).find('test')
		expect(r?.addresses?.length).toBe(2)
		const a = r!.addresses.map(x => x.address).sort().join(',')
		expect(a).toBe('A,B')
	})

	test('save sub collection', async () => {
		await new Restaurant({
			id: 'test',
			name: 'test data',
			addresses: [
				new Address({address: 'A'}),
				new Address({address: 'B'})
			]
		}).save()

		const r = await Restaurant.query().with(['_addresses']).find('test')
		expect(r?.addresses?.length).toBe(2)
		const a = r!.addresses.map(x => x.address).sort().join(',')
		expect(a).toBe('A,B')
	})

	test('save belongsTo', async () => {
		await new Restaurant({
			id: 'test',
			name: 'test data',
			detail: new RestaurantDetail({
				tel: '09011112222',
				email: 'test@mail.com'
			})
		}).save()

		const r = await Restaurant.query().with(['_detail']).find('test')
		expect(r?.detail?.email).toBe('test@mail.com')
	})

	test('belongsTo update', async () => {
		await new Restaurant({
			id: 'test',
			name: 'test data',
			detail: new RestaurantDetail({
				tel: '09011112222',
				email: 'test@mail.com'
			})
		}).save()

		let r = await Restaurant.query().with(['_detail']).find('test')
		r?.detail?.update({email: 'test1@mail.com'})
		await r?._detail().save(r!.detail!)

		r = await Restaurant.query().with(['_detail']).find('test')
		expect(r?.detail?.email).toBe('test1@mail.com')

		r?.detail?.update({email: 'test2@mail.com'})
		await r?.save()
		r = await Restaurant.query().with(['_detail']).find('test')
		expect(r?.detail?.email).toBe('test2@mail.com')
	})

	test('hasMany save', async () => {
		await new Restaurant({
			id: 'test',
			name: 'test data',
			reviews: [
				new Review({title: 'A', body: 'body'}),
				new Review({title: 'B', body: 'body2'}),
			]
		}).save()

		const r = await Restaurant.query().with(['_reviews']).find('test')
		expect(r?.reviews?.length).toBe(2)
		const reviews = r!.reviews.map(x => x.title).sort().join(',')
		expect(reviews).toBe('A,B')
	})

	test('hasMany update', async () => {
		await new Restaurant({
			id: 'test',
			name: 'test data',
			reviews: [
				new Review({title: 'A', body: 'body'}),
				new Review({title: 'B', body: 'body2'}),
			]
		}).save()
		let r = await Restaurant.query().with(['_reviews']).find('test')
		await r?._reviews().save(new Review({title: 'C', body: 'body3'}))

		r = await Restaurant.query().with(['_reviews']).find('test')
		expect(r?.reviews?.length).toBe(3)

		const reviews = [...r?.reviews!, new Review({title: 'D'})]
		r?.setValueByKey('reviews', reviews)
		await r?.save()

		r = await Restaurant.query().with(['_reviews']).find('test')
		expect(r?.reviews?.length).toBe(4)
		const res = r!.reviews.map(x => x.title).sort().join(',')
		expect(res).toBe('A,B,C,D')

		const v = r!.reviews[0]
		v.update({title: 'A+'})
		await v.save()
		r = await Restaurant.query().with(['_reviews']).find('test')
		expect(r!.reviews[0].title).toBe('A+')
		expect(r!.reviews.length).toBe(4)
	})

	test('hasOne save', async () => {
		await new Restaurant({
			id: 'test',
			name: 'test data',
			president: new President({name: 'has one test'})
		}).save()

		let r = await Restaurant.query().with(['_president']).find('test')
		expect(r?.president?.restaurantId).toBe(r?.id)
		expect(r?.president?.name).toBe('has one test')
	})

	test('hasOne update', async() => {
		await new Restaurant({
			id: 'test',
			name: 'test data',
			president: new President({name: 'has one test'})
		}).save()

		let r = await Restaurant.query().with(['_president']).find('test')
		const oldId = r?.president?.id
		r?.update({president: new President({name: 'has one test2'})})
		await r?.save()

		r = await Restaurant.query().with(['_president']).find('test')
		expect(r?.president?.id).toBe(oldId)
		expect(r?.president?.name).toBe('has one test2')
	})

	test('all relation save', async () => {
		await new Restaurant({
			id: 'A',
			name: 'test',
			addresses: [
				new Address({
					address: 'A+',
					pref: [
						new Pref({
							text: 'A++',
							tests: [
								new Test({
									text: 'A+++',
									infos: [new Info({text: 'A++++'})]
								})
							]
						}),
						new Pref({text: 'B++'})
					],
				})
			],
			detail: new RestaurantDetail({email: 'A@mail.com'}),
			president: new President({name: 'A#', detail: new PresidentDetail({tel: 'A##'})}),
			reviews: [new Review({title:'A&'})]
		}).save()

		let r = await Restaurant.query()
			.with(['_detail'])
			.with(['_addresses._pref._tests._infos'])
			.with(['_president._detail'])
			.with(['_reviews'])
			.find('A')

		r = r!

		expect(r.reviews?.length).toBe(1)
		expect(r.reviews.map(x => x.title).join(',')).toBe('A&')
		expect(r.addresses?.length).toBe(1)
		expect(r.addresses.map(x => x.address).join(',')).toBe('A+')
		expect(r.addresses![0].pref.length).toBe(2)
		expect(r.addresses![0].pref.map(x => x.text).sort().join(',')).toBe('A++,B++')
		const pref = r.addresses![0].pref!.filter(x => x.text == 'A++')[0]
		expect(pref.tests.length).toBe(1)
		expect(pref.tests.map(x => x.text).join(',')).toBe('A+++')
		expect(pref.tests![0].infos.length).toBe(1)
		expect(r.president?.id).not.toBe('')
		expect(r.president!.detail.id).toBe(r.president!.detailId)
		expect(r.president.detail.tel).toBe('A##')
	})

	test('with in query', async () => {
		await new Restaurant({
			id: 'test',
			addresses: [
				new Address({address: 1}),
				new Address({address: 2}),
				new Address({address: 3}),
			]
		}).save()

		let r = await Restaurant.query()
		.with([{key: '_addresses', query: () => {
			return [orderBy('address', 'desc')]
			}}])
		.first()

		expect(r!.addresses!.length).toBe(3)
		expect(r!.addresses!.map(x => x.address).join(',')).toBe('3,2,1')

		r = await Restaurant.query()
		.with([{key: '_addresses', query: () => {
				return [
					orderBy('address', 'desc'),
					where('address', '!=', 2)
				]
			}}])
		.first()

		expect(r!.addresses!.length).toBe(2)
		expect(r!.addresses!.map(x => x.address).join(',')).toBe('3,1')
	})

	test('relation save hasManySub', async () => {
		await new Restaurant({
			id: 'test',
		}).save()

		let r = await Restaurant.query().first()
		r = r!
		await r._addresses().save(new Address({address: 'A'}))

		r = await Restaurant.query().with(['_addresses']).first()
		expect(r!.addresses!.length).toBe(1)
		expect(r!.addresses[0].address).toBe('A')

		const address = r!.addresses![0]
		await address._pref().save(new Pref({text: 'A+'}))

		r = await Restaurant.query().with(['_addresses._pref']).first()
		expect(r!.addresses![0].pref.length).toBe(1)
		expect(r!.addresses![0].pref[0].text).toBe('A+')
	})

	test('relation array save hasManySub', async () => {
		await new Restaurant({
			id: 'test',
		}).save()

		let r = await Restaurant.query().first()
		r = r!
		await r._addresses().save([
			new Address({address: 'A'}),
			new Address({address: 'B'}),
		])

		r = await Restaurant.query().with(['_addresses']).first()
		expect(r!.addresses!.length).toBe(2)
		const res = r!.addresses.map(x => x.address).sort().join(',')
		expect(res).toBe('A,B')

		const address = r!.addresses![0]
		await address._pref().save([
			new Pref({text: 'A+'}),
			new Pref({text: 'B+'}),
		])

		r = await Restaurant.query().with(['_addresses._pref']).first()
		expect(r!.addresses![0].pref.length).toBe(2)
		const pr = r!.addresses[0].pref.map(x => x.text).sort().join(',')
		expect(pr).toBe('A+,B+')
	})

	test('relation save hasMany', async () => {
		await new Restaurant({id: 'test'}).save()

		let r = await Restaurant.query().first()
		await r!._reviews().save([
			new Review({title: 'A'}),
			new Review({title: 'B'}),
		])

		r = await Restaurant.query().with(['_reviews']).first()
		expect(r!.reviews!.length).toBe(2)
		expect(r!.reviews!.every(x => x.restaurantId == r!.id)).toBe(true)
		const res = r!.reviews.map(x => x.title).sort().join(',')
		expect(res).toBe('A,B')
	})

	test('relation save belongsTo', async () => {
		await new Restaurant({id: 'test'}).save()

		let r = await Restaurant.query().first()
		await r!._detail().save(new RestaurantDetail({email: 'ok@mail.com'}))

		r = await Restaurant.query().with(['_detail']).first()
		expect(r!.detail!.email).toBe('ok@mail.com')
		expect(r!.detail!.id).toBe(r!.detailId)
	})

	test('add timestamp', async () => {
		await new Restaurant({id: 'test'}).save()
		let r = await Restaurant.query().with(['_detail']).first()
		expect(r!.detail.id).toBe('')
		expect(r!.createdAt).not.toBeNull()
		expect(r!.updatedAt).not.toBeNull()
	})

	test('relation save add timestamp', async () => {
		await new Restaurant({
			id: 'test',
			addresses: [
				new Address({address: '新小岩', pref: [new Pref({text: 'A'})]})
			],
			detail: new RestaurantDetail({tel: 'A+'})
		}).save()

		const r = await Restaurant.query()
		.with(['_addresses._pref'])
		.with(['_detail'])
			.find('test')

		expect(r!.detail.createdAt).not.toBeNull()
		expect(r!.detail.updatedAt).not.toBeNull()
		expect(r!.addresses[0].createdAt).not.toBeNull()
		expect(r!.addresses[0].updatedAt).not.toBeNull()
		expect(r!.addresses[0].address).toBe('新小岩')
		expect(r!.addresses[0].pref[0].createdAt).not.toBeNull()
		expect(r!.addresses[0].pref[0].updatedAt).not.toBeNull()
	})

	/**
	 * withでorderByされた時正しくデータがセットされるか
	 */
	test('hasManySub with in query orderBy correct data', async () => {
		await new Restaurant({
			id: 'test',
			name: 'test1',
			addresses: [
				new Address({address: 'A', pref: [new Pref({text: 'A+'}), new Pref({text: 'B+'})]}),
				new Address({address: 'B'}),
			]
		}).save()

		const r = await Restaurant.query()
			.with([{key: '_addresses', relation: '_pref', query: () => {
					return [orderBy('address', 'desc')]
				}}])
			.first()

		expect(r!.addresses.map(x => x.address).join(',')).toBe('B,A')
		expect(r!.addresses[1].address).toBe('A')
		expect(r!.addresses[1].pref.length).toBe(2)
		expect(r!.addresses[1].pref.map(x => x.text).sort().join(',')).toBe('A+,B+')
		expect(r!.addresses[0].pref.length).toBe(0)

	})

	test('hasMany relations hasManySub save', async () => {
		await new Restaurant({
			id: 'test',
			reviews: [
				new Review({title: 'A', id: 'A1'}),
				new Review({title: 'B', id: 'B1', tests: [
						new Test({text: 'B+'}),
						new Test({text: 'C+'}),
					]}),
				new Review({title: 'C', id: 'C1'}),
			]
		})
		.save()

		const r = await Restaurant.query()
			.with(['_reviews._tests'])
			.orderBy('id')
			.first()

		expect(r!.id).toBe('test')
		expect(r!.reviews.length).toBe(3)
		expect(r!.reviews[0].title).toBe('A')
		expect(r!.reviews[0].tests.length).toBe(0)
		expect(r!.reviews[1].title).toBe('B')
		expect(r!.reviews[1].tests.length).toBe(2)
		expect(r!.reviews[1].tests.map(x => x.text).sort().join(',')).toBe('B+,C+')
	})

	test('primary key belongsTo change ok', async () => {
		const m = await new Model({
			uid: 'A',
			detail: new RestaurantDetail({tel: '09011112222', email: 'test@mail.com'}),
		}).save()

		const r = await Model.query()
		.with(['_detail'])
		.find('A')

		expect(r!.uid).toBe('A')
		expect(r!.detailId).toBe(r!.detail.id)
		expect(r!.detail.tel).toBe('09011112222')
	})

	test('primary key belongsTo side change ok', async () => {
		const m = await new Model({
			uid: 'A',
			modelDetail: new ModelDetail({text: 'A+'})
		}).save()

		const r = await Model.query()
		.with(['_modelDetail'])
		.find('A')

		expect(r!.uid).toBe('A')
		expect(r!.modelDetailId).not.toBe('')
		expect(r!.modelDetailId).toBe(r!.modelDetail.uid)
		expect(r!.modelDetail.text).toBe('A+')
	})

	test('primary key hasMany change ok', async () => {
		const m = await new Model({
			uid: 'A',
			child: [
				new Child({text: 'A'}),
				new Child({text: 'B'}),
			]
		}).save()

		const r = await Model.query()
		.with(['_child'])
		.find('A')

		expect(r!.uid).toBe('A')
		expect(r!.child.length).toBe(2)
		expect(r!.child.map(x => x.text).sort().join(',')).toBe('A,B')
	})

	test('primary key hasMany side change ok', async () => {
		const m = await new Model({
			uid: 'A',
			targets: [
				new Target({text: 'A'}),
				new Target({text: 'B'}),
			]
		}).save()

		const r = await Model.query()
		.with(['_targets'])
		.find('A')

		expect(r!.uid).toBe('A')
		expect(r!.targets.length).toBe(2)
		expect(r!.targets.map(x => x.text).sort().join(',')).toBe('A,B')
	})

	test('primary key hasManySub change ok', async () => {
		const m = await new Model({
			uid: 'A',
			addresses: [
				new Address({address: 'A'}),
				new Address({address: 'B'}),
			]
		}).save()

		const r = await Model.query()
		.with(['_addresses'])
		.find('A')

		expect(r!.uid).toBe('A')
		expect(r!.addresses.length).toBe(2)
		expect(r!.addresses.map(x => x.address).sort().join(',')).toBe('A,B')
	})

	test('toQuery test', async () => {
		await new Restaurant({
			id: 'A',
			name: 'test',
			addresses: [
				new Address({
					address: 'A+',
					pref: [
						new Pref({
							text: 'A++',
							tests: [
								new Test({
									text: 'A+++',
									infos: [new Info({text: 'A++++'})]
								})
							]
						}),
						new Pref({text: 'B++'})
					],
				})
			],
			detail: new RestaurantDetail({email: 'ok@mail.com'}),
			president: new President({name: 'A#',detail: new PresidentDetail({tel: 'ok'})}),
			reviews: [new Review({text: 'A&'}), new Review({text: 'B&'})]
		}).save()

		const r = Restaurant.query()
			.with(['_addresses._pref._tests._infos'])
			.with(['_detail'])
			.with(['_president._detail'])
			.with(['_reviews'])

		const res = await r.find('A')
		const q = r!.toQuery()
		expect(res!.president.id).not.toBe('')
		expect(res!.president.detail.id).not.toBe('')
		expect(q.log.documentLen).toBe(11)
		expect(q.documentAll).toBe(11)

	})

	test('get collectionGroup', async () => {
		await new Restaurant({
			id: 'A', text: 'AA',
			reviews: [
				new Review({id: 'A+', title: 'A++'}),
				new Review({id: 'B+', title: 'B++'}),
				new Review({id: 'C+', title: 'C++'}),
			]
		}).save()

		const q = Review
			.collectionGroup()
			.where('id', 'in', ['A+', 'C+'])

		const r = await q.get()
		expect(r.map(x => x.id).sort().join(',')).toBe('A+,C+')
	})

	test('hasManySub relation orderBy', async () => {
		await new Model({
			uid: 'A',
			addresses: [
				new Address({address: 'A+'}),
				new Address({
					address: 'B+',
					pref: [
						new Pref({text: 'A++'}),
						new Pref({text: 'B++'}),
						new Pref({text: 'C++'}),
						new Pref({text: 'D++'}),
					]
				}),
				new Address({address: 'C+'}),
				new Address({address: 'D+'}),
			]
		}).save()

		const q = Model.query().with(['_addresses._pref'])
		const r = await q.find('A')
		expect(r!.addresses.length).toBe(4)
		expect(r!.addresses.map(x => x.address).join(',')).toBe('D+,C+,B+,A+')
		expect(r!.addresses.filter(x => x.pref.length).map(x => x.address).join(',')).toBe('B+')
		const a = r!.addresses.filter(x => x.pref.length)
		expect(a[0].pref.length).toBe(4)
		expect(a[0].pref.map(x => x.text).join(',')).toBe('D++,C++,B++,A++')
	})

	test('hasManySub in sub with in query orderBy correct data', async () => {
		await new Restaurant({
			id: 'A',
			name: 'test1',
			addresses: [
				new Address({address: 'A', pref: [
						new Pref({text: 'A+', tests: [
								new Test({text: 'A++', infos: [new Info({text: 'A+++'})]}),
								new Test({text: 'B++'}),
							]}),
						new Pref({text: 'B+'})
					]}),
				new Address({address: 'B'}),
			]
		}).save()

		const q = Restaurant.query()
		.with([{key: '_addresses._pref._tests', relation: '_infos', query: () => {
				return [orderBy('text', 'desc')]
			}}])
		const r = await q.find('A')

		expect(r!.addresses.length).toBe(2)
		expect(r!.addresses[0].pref.length).toBe(2)
		const pref = r!.addresses[0].pref.filter(x => x.text == 'A+')
		expect(pref[0].tests.length).toBe(2)
		expect(pref[0].tests.map(x => x.text).join(',')).toBe('B++,A++')
		expect(pref[0].tests[1].infos.length).toBe(1)
		expect(q.toQuery().log.documentLen).toBe(8)

	})

	test('hasMany in sub with in query orderBy correct data', async () => {
		await new Restaurant({
			id: 'A',
			name: 'test1',
			reviews: [
				new Review({title: 'A+', tests: [
						new Test({text: 'A++'}),
						new Test({text: 'B++'}),
					]}),
				new Review({title: 'B+'})
			]
		}).save()

		const q = Restaurant.query()
		.with([{key: 'reviews.tests', query: () => {
				return [orderBy('text', 'desc')]
			}}])
		const r = await q.find('A')

		expect(r!.reviews.length).toBe(2)
		expect(r!.reviews[0].tests.length).toBe(2)
		expect(r!.reviews[0].tests.map(x => x.text).join(',')).toBe('B++,A++')

	})

	test('Timestamp saved', async () => {
		await new Restaurant({id: 'A', name: 'test'}).save()
		const r = await Restaurant.query().find('A')
		expect(r!.createdAt).toBeInstanceOf(Timestamp)
		expect(r!.updatedAt).toBeInstanceOf(Timestamp)
	})

	test.only('not timestamp', async () => {
		await new Restaurant({id: 'A', name: 'test', createdAt: '2023-05-11'}).save()
		const r = await Restaurant.query().find('A')
		expect(r?.id).toBe('A')
		expect(r?.createdAt).toBeInstanceOf(Timestamp)
		expect(r?.createdAt?.toDate().getFullYear()).toBe(2023)
		expect((r?.createdAt?.toDate().getMonth())! + 1).toBe(5)
		expect(r?.createdAt?.toDate().getDate()).toBe(11)
	})

})
