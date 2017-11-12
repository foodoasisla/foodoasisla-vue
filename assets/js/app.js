'use strict';

window.oasis = window.oasis || {};

window.oasis.vm = new Vue({
	el: '#vue-location-list',
	data: {
		listOffset: 0,
		listLimit: 20,
		youAreHere: null,
		searchThisArea: null,
		searchAreaName: null,
		selectedLocation: null,
		locations: null
	},
	/*
	watch: {
		youAreHere: function() {
			this.updateLocations()
		},
		searchThisArea: function() {
			this.updateLocations()
		}
	},
	*/
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
})
