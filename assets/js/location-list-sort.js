'use strict';

window.oasis = window.oasis || {};

(function() {

	// youAreHere is the position of the center of the map
	// searchThisArea is the position the user searched for

	// These two sets of coordinates are the same, when the page first loads
	// but may diverge if the user presses the “search here” button on the map
	function sortByClosest(offset, limit, youAreHere, searchThisArea) {

		// console.log('youAreHere.latitude: ' + youAreHere.latitude)
		// console.log('youAreHere.longitude: ' + youAreHere.longitude)
		// console.log('searchThisArea.latitude: ' + searchThisArea.latitude)
		// console.log('searchThisArea.longitude: ' + searchThisArea.longitude)

		let list = [];
		let nextLatitude, nextLongitude, distanceFromYou, distanceFromSearchArea;
		for (let index = 0; index < window.oasis.locations.length; index++) {
			nextLatitude  = window.oasis.locations[ index ].latitude;
			nextLongitude = window.oasis.locations[ index ].longitude;
			if (nextLatitude != null && nextLatitude != '') {
				distanceFromYou        = window.oasis.getDistanceInKilometers(youAreHere.latitude,     youAreHere.longitude,     parseFloat(nextLatitude), parseFloat(nextLongitude));
				distanceFromSearchArea = window.oasis.getDistanceInKilometers(searchThisArea.latitude, searchThisArea.longitude, parseFloat(nextLatitude), parseFloat(nextLongitude));
			} else {
				distanceFromYou        = window.oasis.INFINITY;
				distanceFromSearchArea = window.oasis.INFINITY;
			}
			window.oasis.locations[index].distanceFromYou        = distanceFromYou;
			window.oasis.locations[index].distanceFromSearchArea = distanceFromSearchArea;
			list.push(window.oasis.locations[index]);
		}

		list.sort(function(a, b) {
			if (a.distanceFromSearchArea > b.distanceFromSearchArea) {
				return 1;
			}
			if (a.distanceFromSearchArea < b.distanceFromSearchArea) {
				return -1;
			}
			// a must be equal to b
			return 0;
		});

		let type = window.oasis.getParameterByName('type');
		if (type) {
			let types = type.split('|');

			list = list.filter(function(item) {
				for (let index = 0; index < types.length; index++) {
					if (item.category.toLowerCase().replace(/\s/g, '-') === types[index]) {
						return true;
					}
				}

				// SHIM: Always show misc locations, if we’re showing all types
				if (item.uri.indexOf('locations/') >= 0 && (types.length === 8 || types.length === 0)) {
					return true;
				}

				return false;
			});
		}
		let openNow   = window.oasis.getParameterByName("open");
		let openStart = window.oasis.getParameterByName("open_start");
		let openEnd   = window.oasis.getParameterByName("open_end");
		let openDays  = window.oasis.getParameterByName("open_days");

		if (openNow) {
			list = list.filter(function(item) {
				let open = false;
				for (let index = 0; index < item.hours.length; index++) {
					if (window.oasis.isOpenNow(item.hours[index], openStart, item)) {
						open = true;
					}
				}

				return open;
			});
		}

		let upperBound = offset + limit
		if (upperBound > list.length) upperBound = list.length

		return list.slice(offset, upperBound);
	}

	window.oasis.sortByClosest = sortByClosest;
})();
