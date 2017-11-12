'use strict';

Vue.component('location-list', {
	props: ['locations'],
	template: `
	<ul class="location-list">
		<!--
			Now we provide each location-item with the location object
			it's representing, so that its content can be dynamic.
			We also need to provide each component with a "key",
			which will be explained later.
		-->
		<li is="location-list-item"
			v-for="item in locations"
			v-bind:location="item"
			v-bind:key="item.id"
			v-on:selected="onSelected">
		</li>
	</ul>
	`,
	methods: {
		onSelected: function (location) {
			this.$emit('selected', location)
		}
	}
})
