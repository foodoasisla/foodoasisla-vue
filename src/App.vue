<template>
	<div
		class="location-list"
		id="vue-location-list"
		v-bind:class="{
			'has-map-location-summary': selectedLocation,
			'has-active-map': mapBoxSupported
		}">

		<header class="header">

			<div class="primary-nav">

				<h2>
					<a href="/"><img src="/assets/images/fola.svg" width="100" alt="Food Oasis Los Angeles" /></a>
				</h2>
				<p class="tagline">Healthy Food for All Angelenos</p>

				<p class="nav-link">
					<a href="/#navigation">
						<svg width="22" height="19" viewBox="0 0 22 19">
						<switch>
							<g>
								<polygon points="0.450127877 18.1050725 21.5498721 18.1050725 21.5498721 13.9746377 0.450127877 13.9746377"></polygon>
								<polygon points="0.450127877 5.02536232 21.5498721 5.02536232 21.5498721 0.894927536 0.450127877 0.894927536"></polygon>
								<polygon points="0.450127877 11.5652174 21.5498721 11.5652174 21.5498721 7.43478261 0.450127877 7.43478261"></polygon>
							</g>
							<foreignobject>
								Menu
							</foreignobject>
						</switch>
					</svg>
					</a>
				</p>

			</div>
			<!-- /.primary -->

			<location-list-nav v-bind:search-area-name="searchAreaName" v-on:back="onBackToList"></location-list-nav>

		</header>

		<!-- FOLA’s Mapbox API key (token) -->
		<location-map
			v-bind:locations="locations"
			v-bind:selected-location="selectedLocation"
			v-bind:you-are-here="youAreHere"
			v-on:selected="onLocationSelected"
			v-on:search-this-area="onSearchThisArea"
			token="pk.eyJ1IjoiZm9vZG9hc2lzbGEiLCJhIjoiY2l0ZjdudnN4MDhpYzJvbXlpb3IyOHg2OSJ9.POBdqXF5EIsGwfEzCm8Y3Q">
		</location-map>

		<location-details
			v-if="selectedLocation"
			v-bind:location="selectedLocation"
			id="map-location-summary">
		</location-details>

		<main>
			<h2><a href="#list-results" id="list-results-title">List Results</a></h2>

			<location-list
				v-bind:locations="locations"
				v-on:selected="onLocationSelected"
				id="list-results">
			</location-list>

			<!--
			<div class="pagination">
				<p><a href="/locations/page3/"><span>Next 20 results</span> <img src="/assets/images/icons/forward.svg" alt="" /></a></p>
			</div>
			-->
		</main>

	</div>
</template>

<script>
import LocationMap     from './components/LocationMap.vue'
import LocationList    from './components/LocationList.vue'
import LocationListNav from './components/LocationListNav.vue'
import LocationDetails from './components/LocationDetails.vue'

export default {
	name: 'foodoasis-la',
	components: {
		LocationMap, LocationList, LocationListNav, LocationDetails
	},
	data: function () {
		return {
			listOffset: 0,
			listLimit: 20,
			youAreHere: null,
			searchThisArea: null,
			searchAreaName: null,
			selectedLocation: null,
			locations: null
		}
	},
	computed: {
		mapBoxSupported() {
			return 'mapboxgl' in window && mapboxgl.supported()
		}
	},
	created: function () {
		window.oasis.findUserLocation(this.onUserLocation.bind(this))

		window.addEventListener('popstate', this.onPopState.bind(this))
	},
	methods: {
		onUserLocation: function (userLocation) {

			this.youAreHere     = userLocation
			this.searchThisArea = userLocation
			this.searchAreaName = userLocation.name

			this.updateLocations()

			let pathName = window.location.pathname

			let location = window.oasis.getLocationFromPageURI()
			if (location) this.setSelectedLocation(location)
		},
		onSearchThisArea: function (coordinates) {
			this.searchThisArea = {
				latitude: coordinates.latitude,
				longitude: coordinates.longitude
			}

			this.updateLocations()

			// Scroll to the top of the list, since the list content has changed.
			document.querySelector('main').scrollTo(0, 0)

			//this.pushState()
		},
		onBackToList: function (event) {
			this.resetSelectedLocation()
			this.pushState('/locations/')
		},
		onLocationSelected: function (location) {
			this.setSelectedLocation(location)
			this.pushState(location.uri)
		},
		pushState: function(url) {
			let state = {
				locations: this.locations,
				selectedLocation: this.selectedLocation
			}

			url += window.location.search

			console.log('pushState: ' + url)

			window.history.pushState(state, null, url);
		},
		onPopState: function (event) {
			console.log('onPopState: ')
			console.dir(event.state)

			if (event.state && event.state.locations) {
				this.locations = event.state.locations
			}

			if (event.state && event.state.selectedLocation) { // Back to location details
				this.setSelectedLocation(event.state.selectedLocation)
			} else { // Back to the list
				this.resetSelectedLocation()
			}
		},
		setSelectedLocation: function (location) {
			console.log('setSelectedLocation: ' + location.name)
			this.selectedLocation = location

			// Scroll to the top of the page, since the page content has changed.
			window.scrollTo(0, 0)

			setTimeout(function() {
				let locationSummary = document.querySelector('.location-summary-container')
				if (locationSummary) locationSummary.scrollTo(0, 0);
			}, 1)
		},
		resetSelectedLocation: function () {
			this.selectedLocation = null

			// Scroll to the top of the page, since the page content has changed.
			window.scrollTo(0, 0);
		},
		updateLocations: function () {

			if (!this.searchThisArea.latitude || !this.searchThisArea.longitude) {
				this.searchThisArea.latitude  = this.youAreHere.latitude;
				this.searchThisArea.longitude = this.youAreHere.longitude;
			}

			let limitedList = window.oasis.sortByClosest(
				this.listOffset,
				this.listLimit,
				this.youAreHere,
				this.searchThisArea
			)

			for (let index = 0; index < limitedList.length; index++) {
				let category = limitedList[index].category.toLowerCase().replace(/\s/g, '-') // Example: farmers-market

				limitedList[index].id = index
				limitedList[index].categoryCode       = this.getCategoryCode(category)
				limitedList[index].parentCategoryCode = this.getParentCategoryCode(category)
			}

			this.locations = limitedList
		},
		getCategoryCode: function (category) {

			// SHIM: Should we handle this in the CSS instead?
			switch(category) {
				case 'food-pantry':
				case 'summer-lunch':
				case 'community-garden':
				case 'farmers-market':
				case 'supermarket':
				case 'restaurant':
				case 'orchard':
				case 'pop-up-market':
					return category
				case 'cultivate-la':
					return "community-garden"
			}

			return "restaurant"
		},
		getParentCategoryCode: function (category) {

			// SHIM: Should we handle this in the CSS instead?
			switch(category) {
				case 'supermarket':
				case 'restaurant':
				case 'pop-up-market':
				case 'farmers-market':
					return 'buy'
				case 'summer-lunch':
				case 'food-pantry':
				case 'orchard':
					return 'free'
				case 'community-garden':
				case 'cultivate-la':
					return 'grow'
			}

			return 'buy'
		}
	}
}
</script>

