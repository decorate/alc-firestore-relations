<template>
    <div id="app">
      <home/>
    </div>
</template>

<script lang="ts">
import 'bootstrap/dist/css/bootstrap.css'
	import { Component, Vue } from 'vue-property-decorator';
	import HelloWorld from './components/HelloWorld.vue';
  import mock from '../mocks/$mock'
  import Restaurant from './entities/Restaurant'
  import Review from '@/entities/Review'
  import RestaurantDetail from '@/entities/RestaurantDetail'
  import { collection, getDocs, collectionGroup, query, where, orderBy } from '@firebase/firestore'
  import Home from '@/views/Home.vue'

    mock()

	@Component({
		components: {
      Home,
			HelloWorld,
		},
	})
  export default class App extends Vue {

    async created() {
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
