'use strict';

window.oasis = window.oasis || {};

// Define the icons
window.oasis.MARKER_OPTIONS = {
	'Community Garden': {
		// Specify a class name we can refer to in CSS.
		className: 'community-garden-marker',
		// Set marker width and height
		iconSize: [30, 46],
		iconAnchor: [15, 40],
		popupAnchor: [0, -23]
	},
	'Farmers Market': {
		// Specify a class name we can refer to in CSS.
		className: 'farmers-market-marker',
		// Set marker width and height
		iconSize: [30, 46],
		iconAnchor: [15, 40],
		popupAnchor: [0, -23]
	},
	'Food Pantry': {
		// Specify a class name we can refer to in CSS.
		className: 'food-pantry-marker',
		// Set marker width and height
		iconSize: [30, 46],
		iconAnchor: [15, 40],
		popupAnchor: [0, -23]
	},
	'Orchard': {
		// Specify a class name we can refer to in CSS.
		className: 'orchard-marker',
		// Set marker width and height
		iconSize: [30, 46],
		iconAnchor: [15, 40],
		popupAnchor: [0, -23]
	},
	'Pop Up Market': {
		// Specify a class name we can refer to in CSS.
		className: 'pop-up-market-marker',
		// Set marker width and height
		iconSize: [30, 46],
		iconAnchor: [15, 40],
		popupAnchor: [0, -23]
	},
	'Restaurant': {
		// Specify a class name we can refer to in CSS.
		className: 'restaurant-marker',
		// Set marker width and height
		iconSize: [30, 46],
		iconAnchor: [15, 40],
		popupAnchor: [0, -23]
	},
	'Summer Lunch': {
		// Specify a class name we can refer to in CSS.
		className: 'summer-lunch-marker',
		// Set marker width and height
		iconSize: [30, 46],
		iconAnchor: [15, 40],
		popupAnchor: [0, -23]
	},
	'Supermarket': {
		// Specify a class name we can refer to in CSS.
		className: 'farmers-market-marker',
		// Set marker width and height
		iconSize: [30, 46],
		iconAnchor: [15, 40],
		popupAnchor: [0, -23]
	},
	'Cultivate LA': {
		// Specify a class name we can refer to in CSS.
		className: 'cultivate-la-marker',
		// Set marker width and height
		iconSize: [30, 46],
		iconAnchor: [15, 40],
		popupAnchor: [0, -23]
	}
};

window.oasis.FOOD_DESERTS_SOURCE = {
	'type': 'vector',
	'url': 'mapbox://foodoasisla.d040onrj'
};

window.oasis.FOOD_DESERTS_LAYER = {
	'id': 'Food Deserts',
	'type': 'fill',
	'source': 'Food Deserts',
	'layout': {
		'visibility': 'visible'
	},
	'paint': {
		'fill-color': '#FF0000',
		'fill-opacity': 0.1
	},
	'filter': ["==", "LI LA De_4", "1"],
	'source-layer': 'USDA_Food_Desert_Tracts_2010-65gavx'
};

Vue.component('location-map', {
	props: ['locations', 'selectedLocation', 'token', 'youAreHere'],
	template: `
	<div>
		<p class="action search-this-area"><a href="" v-on:click.prevent="searchThisArea">Search this area</a></p>
		<div id="map" class="map-container" v-bind:class="{ active: mapBoxSupported }"></div>
	</div>
	`,
	mounted: function () {

		/* SHIM: Wait a moment before rendering the map, so the size will be correct */
		setTimeout(function () {
			this.createMap()

			if (this.locations && this.locations.length) {
				this.addMarkers(this.locations, this.youAreHere)
				if (this.selectedLocation) {
					this.updateCurrentMarker(this.selectedLocation);
					let coordinates = {
						lng: this.selectedLocation.longitude,
						lat: this.selectedLocation.latitude
					}

					window.oasis.map.setCenter(coordinates);
				}
			}
		}.bind(this), 1)
	},
	data: function () {
		return {
			map: null,
			dragging: false,  // SHIM: Avoid activing a marker while moving the map
			skipNextMoveMap: false, // SHIM: Avoid moving the map when clicking on markers
			markers: [],
			currentMarker: null,
			initializingMarkers: true,
			markerResetMethods: [],

			MAP_STYLE: 'mapbox://styles/mapbox/basic-v9',

			// Los Angeles County boundaries
			MAP_BOUNDS: [
				[-119.9442369,32.7089729], // Southwest coordinates
				[-116.63282912,35.8275538]  // Northeast coordinates
			]
		}
	},
	watch: {

		// Update the markers if the locations data changes
		locations: function () {
			this.updateMarkers()
		},

		// Deselect the current marker on the map if the detail page has become inactive
		selectedLocation: function () {
			// console.log('selectedLocation changed')
			if (!this.selectedLocation) {
				this.resetCurrentMarker();
			} else {
				this.updateCurrentMarker(this.selectedLocation);
				if (!this.skipNextMoveMap) window.oasis.map.flyTo({ center: [this.selectedLocation.longitude, this.selectedLocation.latitude] });
				this.skipNextMoveMap = false
			}
		}
	},
	computed: {
	},
	methods: {
		mapBoxSupported() {
			return 'mapboxgl' in window && mapboxgl.supported()
		},
		showSearchThisArea() {
			document.body.classList.add('has-search-this-area')
		},
		hideSearchThisArea() {
			document.body.classList.remove('has-search-this-area')
		},
		searchThisArea(event) {
			//this.updateMarkers()
			this.hideSearchThisArea()
			this.resetCurrentMarker()

			let center = window.oasis.map.getCenter().toArray();
			this.$emit('search-this-area', { latitude: center[1], longitude: center[0] })
		},
		createMap() {

			if (document.getElementById('map') && this.mapBoxSupported()) {

				mapboxgl.accessToken = this.token;

				window.oasis.map = new mapboxgl.Map({
					container: document.getElementById('map'),
					style: this.MAP_STYLE,
					maxBounds: this.MAP_BOUNDS
				});

				window.oasis.map.on('load', function() {

					// Add a zoom control
					window.oasis.map.addControl(new mapboxgl.NavigationControl( { position: 'top-right' } )); // position is optional

					// Draw food desert census tracts
					//if (window.oasis.getParameterByName('deserts') === '1') {
						window.oasis.map.addSource('Food Deserts', window.oasis.FOOD_DESERTS_SOURCE);
						window.oasis.map.addLayer(window.oasis.FOOD_DESERTS_LAYER);
					//}
					//window.oasis.map.resize()
				});

				window.oasis.map.on('dragstart', function () {
					this.dragging = true
				}.bind(this));
				window.oasis.map.on('dragend', function () {
					setTimeout(function () {
						this.dragging = false
					}.bind(this), 10)
				}.bind(this));

				window.oasis.map.on('dragend', this.showSearchThisArea.bind(this));
				//map.on('zoomend', showSearchThisArea);
			}
		},
		updateMarkers: function () {
			this.removeAllMarkers()

			this.addMarkers(this.locations)
		},
		addYouAreHere: function (coordinates) {

			let template = document.getElementById('you-are-here-template');

			let marker = document.createElement('div');
			marker.innerHTML = template.innerHTML;

			return new mapboxgl.Marker(marker)
			.setLngLat(coordinates)
			.addTo(window.oasis.map);
		},
		resetMarkers: function () {
			for (let index = 0; index < this.markerResetMethods.length; index++) {
				this.markerResetMethods[index]();
			}
		},
		createMarker: function (options, data) {
			let marker = document.createElement('div');
			marker.className = 'marker ' + options.className;
			let span = document.createElement('span');
			span.textContent = data.name;
			span.className = 'marker-label';
			marker.appendChild(span);
			return marker;
		},
		updateMarkerLabels: function () {
			if (window.oasis.map.getZoom() > 14) { // Zoomed In
				document.body.classList.remove('hidden-marker-labels');
			} else { // Zoomed Out
				document.body.classList.add('hidden-marker-labels');
			}
		},
		// showLocationSummary: function (location, simulated) {
		// 	// let item = window.oasis.createListItem(location, 'div', true);
		// 	// let summary = document.getElementById('map-location-summary');
		// 	// summary.innerHTML = '';
		// 	// summary.appendChild(item);
		// 	// document.querySelector('.location-list').classList.add('has-map-location-summary');

		// 	this.$emit('selected', location)

		// 	//window.oasis.map.resize()
		// 	//document.querySelector('.location-summary-container').scrollTo(0, 0);

		// 	//const url = item.querySelector('a').getAttribute('href');
		// 	// console.log(url);
		// 	//window.history.replaceState({}, null, url);
		// 	// console.log(item.querySelector('a').href);

		// 	// SHIM: Center the marker and zoom in
		// 	if (simulated) {
		// 		// map.setCenter([location.longitude, location.latitude]);
		// 		// map.setZoom(14);
		// 		window.oasis.map.flyTo({ center: [location.longitude, location.latitude] });
		// 	}
		// },
		resetCurrentMarker: function () {
			if (this.currentMarker) this.currentMarker.classList.remove('active')

			//let summary = document.getElementById('map-location-summary');
			//summary.innerHTML = '';

			//document.querySelector('.location-list').classList.remove('has-map-location-summary');
			//this.$emit('reset')
			//window.oasis.map.resize();
		},
		updateCurrentMarker: function (location) {
			// console.log('updateCurrentMarker: ' + location.name)

			if (this.currentMarker) this.currentMarker.classList.remove('active');

			this.currentMarker = this.getMarkerFromLocation(location);
			this.currentMarker.classList.add('active');
		},
		// getMarkerFromLocation: function (location) {

		// 	// Assume that the locations array is in the same order as the markers array
		// 	for (let index = 0; index < this.locations.length; index++) {
		// 		if (this.locations[index] === location) return this.markers[index]
		// 	}
		// },
		getMarkerFromLocation: function (location) {

			// Assume that the markers array is in the same order as the locations array
			for (let index = 0; index < this.markers.length; index++) {
				let match = true
				// for (let prop in locations[index]) {
				// 	if (locations[index][prop] != location[prop]) {
				// 		match = false
				// 	}
				// }
				if (this.locations[index].name      === location.name      && 
					this.locations[index].longitude === location.longitude && 
					this.locations[index].latitude  === location.latitude  ) {
					return this.markers[index]
				}
			}
		},
		addMarker: function (location) {
			let coordinates = [
				location.longitude,
				location.latitude
			];

			let options = window.oasis.MARKER_OPTIONS[location.category];

			if (!options) {
				options = {

					// Specify a class name we can refer to in CSS.
					className: '',

					// Set marker width and height
					iconSize:    [30, 46],
					iconAnchor:  [15, 40],
					popupAnchor: [0, -23]
				}
			}

			let marker = this.createMarker(options, location);

			new mapboxgl.Marker(marker)
				.setLngLat(coordinates)
				.addTo(window.oasis.map);

			let handleMapClick = function(e) {
				//let simulated = (e.clientX === 0 && e.clientY === 0); // This event was triggered by an element in the list, and not an actual click on the marker.

				if (this.dragging) return

				//this.updateCurrentMarker(location)

				this.skipNextMoveMap = true // Avoid moving the map while the user pressing different points

				this.$emit('selected', location)
				//this.showLocationSummary(location, simulated);
			}.bind(this)

			marker.addEventListener('click', handleMapClick)

			this.markerResetMethods.push(function() {
				let icon = icons[location.category];
				marker.setIcon(icon);
			});

			this.markers.push(marker);

			return coordinates;
		},
		removeAllMarkers: function () {
			// for (let index = 0; index < this.markers.length; index++) {
			// 	this.markers[index].remove();
			// }
			// this.markers = [];

			while (this.markers.length > 0) {
				this.markers.pop().remove()
			}
		},
		addMarkers: function (locations) {
			if (!window.oasis.map) return;

			document.body.classList.add('hidden-marker-labels');

			let bounds = [];

			// Loop through the locations
			for (let index = 0; index < locations.length; index++) {

				// Add a marker
				let coordinates = this.addMarker(locations[index]);

				bounds.push(coordinates);
			}

			if (this.initializingMarkers && this.youAreHere && this.youAreHere.latitude && this.youAreHere.longitude) {
				// Add a “You are here” marker
				let coordinates = [this.youAreHere.longitude, this.youAreHere.latitude];
				this.addYouAreHere(coordinates);
				bounds.unshift(coordinates);
			}

			// Increase the size of the viewport to fit the markers
			if (this.initializingMarkers) this.fitMarkers(bounds);

			let updateMarkerLabels = this.updateMarkerLabels.bind(this)

			// Show the marker labels
			setTimeout(updateMarkerLabels, 1000);
			if (this.initializingMarkers) window.oasis.map.on('zoomend', updateMarkerLabels);

			this.initializingMarkers = false;

			//console.dir(this.markers);
		},
		fitMarkers: function (bounds) {

			window.oasis.map.setZoom(15);

			let mapLngLatBounds = new mapboxgl.LngLatBounds();

			let limit = 10;
			for (let index = 0; index < limit && index < bounds.length; index++) {
				mapLngLatBounds.extend(bounds[index]);
			}

			window.oasis.map.fitBounds(mapLngLatBounds, { padding: 10, easing: function() { return 1; } });
		}
		// simulateMapPointClick: function (data) {
		// 	for (let index = 0; index < this.markers.length; index++) {
		// 		if (this.markers[index]._data.name === data.name) {
		// 			this.markers[index].click();
		// 			return true;
		// 		}
		// 	}
		// }
	}
})
