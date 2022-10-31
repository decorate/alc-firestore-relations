<template>
  <div class="home container">
    <ul class="list-group mb-3">
      <li
          class="list-group-item"
          v-for="data in restaurants.paginator.data" v-if="restaurants.paginator.data">
        {{data.name}}<br/>
        詳細:{{data.detail.email}}/{{data.detail.tel}}<br/>
        レビュー数:{{data.reviews.length}}件<br/>
        住所: {{data.addresses.map(x => x.address).join(',')}}<br/>
        社長: {{data.president.name}}/{{data.president.detail.tel}}
      </li>
    </ul>
    <button v-if="restaurants.paginator.hasNext"
            class="btn btn-primary"
            @click="next">
      次へ
    </button>
  </div>
</template>

<script>
// @ is an alias to /src
import {IPaginate} from '@/interfaces/IPaginate'
import Restaurant from '@/entities/Restaurant'
import {orderBy, where} from '@firebase/firestore'
import Review from '@/entities/Review'
import Address from '@/entities/Address'
import Pref from '@/entities/Pref'
import Test from '@/entities/Test'
import Info from '@/entities/Info'
import RestaurantDetail from '@/entities/RestaurantDetail'

export default {
  name: 'Home',

  data() {
    return {
      restaurants: Restaurant.paginate()
    }
  },

  async created() {
    this.test1()
    //this.test2()
    //this.test3()
    //this.test4()

  },

  methods: {
    async test1() {
      await this.restaurants
          .with(['_addresses._pref._tests._infos'])
          .with(['_reviews'])
          .with(['_detail'])
          .with([{key: '_addresses', query: () => {
              return [
                orderBy('address', 'desc'),
              ]
            }}])
          .where('id', '==', '1666851262059_IvhuTBs9Y5hZJmsNcd5O')
          .with(['_president._detail'])
          .orderBy('id', 'desc')
      //.limit(1)
      //.simplePaginate(1)

      this.next()
    },
    async next() {
      await this.restaurants.paginator.next()
      console.log(this.restaurants.toQuery())
    },

    // hasManySave
    async test2() {
      const r = await Restaurant.query().find('1666851262059_IvhuTBs9Y5hZJmsNcd5O')
      // r._reviews().save([
      //     new Review({title: 'test save', body: 'test save body'})
      // ])
      r._reviews().save(
        new Review({title: 'test save no array', body: 'test save body'})
      )
    },

    // hasManySubSave
    async test3() {
      const r = await Restaurant.query().find('1666851262059_IvhuTBs9Y5hZJmsNcd5O')
      r._addresses().save([
        new Address({
          address: '秋葉原',
          pref: [new Pref({text: '群馬'}), new Pref({text: '栃木'})],
        }),
        new Address({
          address: '両国',
          pref: [new Pref({text: '愛知'})],
        }),
      ])
      // r._addresses().save(new Address({
      //   address: '平井',
      //   pref: [new Pref({
      //     text: '鹿児島',
      //     tests: [
      //         new Test({
      //           text: 'ok TEST save',
      //           infos: [new Info({body: 'ok Info save'})]
      //         })
      //     ]
      //   })]
      // }))
    },

    // belongsToSave
    async test4() {
      const r = await Restaurant.query().find('1666851262059_IvhuTBs9Y5hZJmsNcd5O')
      r._detail().save(new RestaurantDetail({
        tel: '08011112222',
        email: 'beTest2@mail.com'
      }))
    }
  },

  components: {
  }
}
</script>
