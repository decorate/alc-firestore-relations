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
  import { collection, getDocs, collectionGroup, query, where, orderBy } from '@firebase/firestore'

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
        .with(['_addresses._pref._tests._infos'])
        // .with(['_reviews'])
        // .with(['_detail'])
        .with([{key: '_addresses', query: () => {
            return [
                orderBy('address', 'desc'),
                where('address', 'in', ['錦糸町', '亀戸'])
            ]
          }}])
      // .with(['_president._detail'])
        .where('name', 'in', ['ジョナサン', 'ガスト'])
        .orderBy('name', 'desc')
        //.limit(2)
        .get()
      a.map(x => console.log(x))
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
