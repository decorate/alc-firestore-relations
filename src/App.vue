<template>
    <div id="app">
        <img alt="Vue logo" src="./assets/logo.png">
        <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>
    </div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';
	import HelloWorld from './components/HelloWorld.vue';
  import mock from '../mocks/$mock'
  import Restaurant from './entities/Restaurant'
  import Review from '@/entities/Review'
  import RestaurantDetail from '@/entities/RestaurantDetail'

    mock()

	@Component({
		components: {
			HelloWorld,
		},
	})
  export default class App extends Vue {

    async created() {
      const a = await Restaurant
        .query()
        .with(['_reviews', '_detail'])
        .where('category_id', '==', 1)
        //.where('name', '==', '日高屋')
        .get()
      // const d = await a[0]._reviews().where('title', '==', 'おいしい2').get()
      // const b = await a[0]._detail().get()
      a.map(x => console.log(x.getPostable()))
      // const r = new Restaurant({name: 'ジョナサン', categoryId: 2})
      //r.save()
      // const reviews = (await r.reviews())
      // const d = await reviews.get()
      // console.log(d)
      // new Review({title: 'おいしい', body: 'ok body', restaurantId: r.id}).save()
      // new Review({title: 'おいしい2', body: 'ok body2', restaurantId: r.id}).save()
      // new Review({title: 'おいしい3', body: 'ok body3', restaurantId: r.id}).save()
    }

  }

</script>

<style>
    #app {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        margin-top: 60px;
    }
</style>
