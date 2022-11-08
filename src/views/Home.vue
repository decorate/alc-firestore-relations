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
import {collection, collectionGroup, getDocs, limit, orderBy, query, startAfter, where, startAt, endBefore} from '@firebase/firestore'
import Review from '@/entities/Review'
import Address from '@/entities/Address'
import Pref from '@/entities/Pref'
import Test from '@/entities/Test'
import Info from '@/entities/Info'
import RestaurantDetail from '@/entities/RestaurantDetail'
import President from '@/entities/President'
import PresidentDetail from '@/entities/PresidentDetail'
import FModel from '@/FModel'
import {camelCase} from '@/utility/stringUtility'
import pluralize, { isPlural, isSingular } from 'pluralize'
import {markRaw} from 'vue'
import { Component } from 'vue-property-decorator'

export default {
  name: 'Home',

  data() {
    return {
      restaurants: Restaurant.paginate()
    }
  },

  async created() {
    //await Restaurant.seed(20)
    //this.test1()
    //this.test2()
    //this.test3()
    //this.test4()
    //this.test5()
    //this.test6()
    //this.test7()
    //this.test8()
    // const r = await Restaurant.query()
    //     .orderBy('id')
    //     .startAfter(10)
    //     .limit(1)
    //     .get()
    // console.log(r[0].name)

    const r = await Review.collectionGroup()
        .where('id', 'in', ['1667224190142_5KMUpnD0bao8beyNPHsm'])
        .get()
    console.log(r)
  },

  methods: {
    async test1() {
      await this.restaurants
          .with(['_addresses._pref._tests._infos'])
          .with(['_reviews'])
          .with(['_detail'])
          // .with([{key: '_addresses', query: () => {
          //     return [
          //       orderBy('address', 'desc'),
          //     ]
          //   }, relation: '_pref._tests'}])
          .with(['_president._detail'])
          // .orderBy('id', 'asc')
      //.limit(1)
      .simplePaginate(1)

      await this.next()
      console.log(this.restaurants.paginator.data[0])
    },
    async next() {
      await this.restaurants.paginator.next()
      console.log(this.restaurants.toQuery())
    },

    // hasManySave
    async test2() {
      const r = await Restaurant.query().first()
      // r._reviews().save([
      //     new Review({title: 'test save', body: 'test save body'})
      // ])
      r._reviews().save(
        new Review({title: 'test save no array', body: 'test save body'})
      )
    },

    // hasManySubSave
    async test3() {
      const r = await Restaurant.query().first()
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
      const r = await Restaurant.query().first()
      r._detail().save(new RestaurantDetail({
        tel: '08011112222',
        email: 'beTest2@mail.com'
      }))
    },

    // rootSave
    async test5() {
      const r = new Restaurant({
        name: 'マクドナルド',
        categoryId: 2,
        addresses: [
            new Address({
              address: '飯田橋',
              pref: [
                new Pref({text: '新潟'}),
                new Pref({text: '沖縄'}),
              ]
            })
        ],
        detail: new RestaurantDetail({email: 'mac@mail.com', tel: '0312123333'}),
        reviews: [
          new Review({title: 'マックレビュー1', body: 'マックレビュー1 body'}),
          //new Review({title: 'マックレビュー2', body: 'マックレビュー2 body'}),
        ],
        // president: new President({
        //   name: 'マック社長',
        //   detail: new PresidentDetail({
        //     tel: '09012345678'
        //   })
        // })
      })

      r.save()
    },

    // hasOneSave
    async test6() {
      const r = await Restaurant.query().first()
      r._president().save(new President({
        name: 'test4社長',
        detail: new PresidentDetail({
          tel: '08019192828'
        })
      }))
    },

    async test7() {
      const r = await Restaurant.query().first()
      const a = await r._addresses().get()
      a.map(async x => {
        const p = await x._pref().limit(1).get()
        p.map(async v => {
          const t = await v._tests().limit(1).get()
          t.map(async k => {
            const i = await k._infos().get()
            console.log(i)
          })
        })
      })
    },

    async test8() {
      const r = await Restaurant.query().with(['_reviews']).find('1667224190213_Ki0NPdWYOqhPUKHSk2j6')
      const reviews = [...r.reviews, new Review({title: 'ok'})]
      r.update({reviews: reviews})
    },
  },

  components: {
  }
}
</script>
