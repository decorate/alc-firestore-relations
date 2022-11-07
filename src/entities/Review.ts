import FModel  from '../FModel'
import { IIndexable } from '@team-decorate/alcts/dist/interfaces/IIndexxable'
import Test from '@/entities/Test'
import { ArrayMappable } from '@team-decorate/alcts/dist/index'

export default class Review extends FModel {
	tableName: string = 'reviews'
	id: string = ''
	title: string = ''
	body: string = ''
	restaurantId: string = ''
	sort: number = 0
	tests: Test[] = []

	constructor(data?: IIndexable) {
		super(data)
		this.fillable = ['id', 'title', 'body', 'restaurantId', 'sort', 'tests']
		this.sender = ['id', 'title', 'body', 'restaurantId', 'sort']
		this.presents = ['sort']

		this.idPrefix = new Date().getTime().toString() + '_'

		this.arrayMap(
			new ArrayMappable(Test).bind('tests')
		)

		if(data) {
			this.data = data
		}
	}

	_tests() {
		return this.hasRelationships.hasManySub(Test, 'tests')
	}

}