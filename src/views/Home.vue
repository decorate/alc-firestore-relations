<template>
  <div class="home container">
    <ul class="list-group mb-3">
      <li
          class="list-group-item"
          v-for="data in restaurants.paginator.data" v-if="restaurants.paginator.data">
        {{data.name}}<br/>
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

export default {
  name: 'Home',

  data() {
    return {
      restaurants: Restaurant.paginate()
    }
  },

  async created() {
     await this.restaurants
        .with(['_addresses._pref._tests._infos'])
        .with(['_reviews'])
        .with(['_detail'])
        .with([{key: '_addresses', query: () => {
            return [
              orderBy('address', 'desc'),
              //where('address', 'in', ['錦糸町', '亀戸'])
            ]
          }}])
        .with(['_president._detail'])
        // .where('name', 'in', ['ジョナサン', 'ガスト'])
          .orderBy('id', 'asc')
        //.limit(2)
        .simplePaginate(1)

    this.next()
  },

  methods: {
    async next() {
      await this.restaurants.paginator.next()
      console.log(this.restaurants)
    }
  },

  components: {
  }
}
</script>
