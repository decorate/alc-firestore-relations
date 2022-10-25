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

    mock()

	@Component({
		components: {
			HelloWorld,
		},
	})
  export default class App extends Vue {

    async created() {
      const r = new Restaurant({name: 'バーミヤン', categoryId: 1})
      await r.truncate()
      const m = await r.save()
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
