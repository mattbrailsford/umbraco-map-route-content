angular.module("umbraco").controller("Our.Umbraco.Controllers.MapRouteContentController",
[
	"$scope",
	"$http",
	"$timeout",
	"entityResource",
	"assetsService",
	"innerContentService",

	function ($scope, $http, $timeout, entityResource, assetsService, innerContentService) {

		var vm = this;
		var map, tiles, polyline, traceMarker, markerGroup;

		// /media/1031/route.geojson
		// umb://media/50ff512de78e4c7fa1ea5fc655ea168a
		// umb://media/841880c5434442adb2caa03e7814f484
		// 1151

		/*
		 * ========================================================
		 *	Model setup
		 * ========================================================
		 */

		vm.model = $scope.model;

		vm.model.value = vm.model.value || {
			fileId: "",
			markers: []
		}

		/*
		 * ========================================================
		 *	Helper Methods
		 * ========================================================
		 */

		// Adapted from epolys.js for google maps
		var calcLatLngAtDistance = function (latLngs, metres) {

			// some awkward special cases
			if (metres == 0) return latLngs[0];
			if (metres < 0) return null;
			if (latLngs.length < 2) return null;

			var dist = 0;
			var olddist = 0;
			for (var i = 1; (i < latLngs.length && dist < metres); i++) {
				olddist = dist;
				dist += L.latLng(latLngs[i - 1]).distanceTo(L.latLng(latLngs[i]));
			}

			if (dist < metres) {
				return null;
			}

			var p1 = latLngs[i - 2];
			var p2 = latLngs[i - 1];
			var m = (metres - olddist) / (dist - olddist);

			return { lat: p1.lat + (p2.lat - p1.lat) * m, lng: p1.lng + (p2.lng - p1.lng) * m };

		}

		//var getLatLngsToDistance = function (latLngs, metres, snapToLatLngs = false) {

		//	var dist = 0;
		//	var resultLatLngs = [];

		//	if (latLngs.length > 0)
		//		resultLatLngs.push(latLngs[0]);

		//	for (var i = 1; i < latLngs.length; i++) {
		//		dist += L.latLng(latLngs[i - 1]).distanceTo(L.latLng(latLngs[i]));
		//		if (dist < metres)
		//			resultLatLngs.push(latLngs[i]);
		//		else
		//			break;
		//	}

		//	if (!snapToLatLngs) {
		//		var endPoint = calcLatLngAtDistance(latLngs, metres);
		//		if (endPoint) {
		//			resultLatLngs.push(endPoint);
		//		}
		//	}

		//	return resultLatLngs;
		//}

		var syncIcons = function () {
			if (vm.model.value != null && vm.model.value.markers != null && vm.model.value.markers.length > 0) {

				var guids = _.uniq(vm.model.value.markers.map(function (itm) {
					return itm.content.icContentTypeGuid;
				}));

				innerContentService.getContentTypeIconsByGuid(guids).then(function (data) {
					_.each(vm.model.value.markers, function (itm) {
						if (data.hasOwnProperty(itm.content.icContentTypeGuid)) {
							itm.content.icon = data[itm.content.icContentTypeGuid];
						}
					});
				});

			}
		}

		var goTo = function (i) {
			vm.currentDistance = Math.min(Math.max(i, 0), vm.route.lengthMetres);
		}

		var loadRouteJson = function (url, callback) {

			$http({
				url: url,
				method: "GET"
			}).success(function (data) {

				// Organise route data
				var route = {
					coordinates: data,
					lengthMetres: 0,
					lengthMiles: 0
				};

				// Calculate route lengths
				var routeLength = 0;
				var prevLatLng = undefined;
				route.coordinates.forEach(function (ll) {
					var latLng = L.latLng(ll);
					if (prevLatLng) {
						routeLength += prevLatLng.distanceTo(latLng)
					}
					prevLatLng = latLng;
				});
				route.lengthMetres = Math.ceil(routeLength);
				route.lengthMiles = Math.round((0.00062137 * routeLength) * 10) / 10;

				// Store route in scope
				vm.route = route;

				// Reset vars
				vm.currentDistance = 0;
				vm.currentLatLng = route.coordinates[0];

				// vm.model.value.markers = [];

				// Run callback
				if (callback) {
					callback();
				}
			});

		}

		var initMap = function () {

			// Select this property editors map container
			var mapEl = document.querySelector("#mrc-" + vm.model.id + " .mrc-map");

			// Create the map
			map = L.map(mapEl).setView([51.505, -0.09], 13);

			// Load the map tiles
			tiles = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png', {
				attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
				subdomains: 'abcd',
				maxZoom: 19
			});
			tiles.addTo(map);

		}

		var initMapLayers = function () {

			// Draw the route on the map
			polyline = L.polyline(vm.route.coordinates, {
				weight: 3,
				color: "#333",
				opacity: .5
			});
			polyline.addTo(map);

			// Create trace marker to show current position
			var traceMarkerIcon = L.divIcon({
				className: 'mrc-trace-marker-icon',
				iconSize: [12, 12],
				iconAnchor: [6, 6]
			});
			traceMarker = L.marker(vm.route.coordinates[0], {
				icon: traceMarkerIcon,
				zIndexOffset: 1000
			});
			traceMarker.addTo(map);

			// Create a marker group layer
			markerGroup = L.layerGroup().addTo(map);

			// Add any existing markers
			redrawMarkers();

			// Resize map to fit the bounds
			map.fitBounds(polyline.getBounds());

		}

		var updateMarkerNames = function () {
			vm.model.value.markers.forEach(function (marker, idx) {
				innerContentService.populateName(marker.content, idx, vm.model.config.contentTypes);
			})
		}

		var redrawMarkers = function () {
			markerGroup.clearLayers();
			if (vm.model.value && vm.model.value.markers && vm.model.value.markers.length > 0) {
				vm.model.value.markers.forEach(function (marker, idx) {
					var markerIcon = L.divIcon({
						className: 'mrc-marker-icon',
						iconSize: [20, 20],
						iconAnchor: [10, 24]
					});
					L.marker(marker.latLng, {
						icon: markerIcon
					}).addTo(markerGroup);
				});
			}
		}

		/*
		 * ========================================================
		 *	View model setup
		 * ========================================================
		 */

		vm.hasRouteFile = false;
		vm.handlePick = function (value) {
			vm.model.value.fileId = value.udi;
			initValue();
		}

		// Define a getter / setter for currentDistance to enforce
		// the value as being an int (the input range doesn't)
		Object.defineProperty(vm, 'currentDistance', {
			get: function () {
				return this._currentDistance;
			},
			set: function (val) {
				this._currentDistance = parseInt(val);
			}
		});

		vm.currentDistance = 0;
		vm.currentLatLng = undefined;

		vm.icOverlayConfig = {
			propertyAlias: vm.model.alias,
			contentTypes: vm.model.config.contentTypes,
			show: false,
			data: {
				idx: 0,
				model: null
			},
			callback: function (data) {

				data.marker.content = data.model;

				if (!($scope.model.value.markers instanceof Array)) {
					$scope.model.value.markers = [];
				}

				if (data.action === "add") {
					vm.model.value.markers.splice(data.idx, 0, data.marker);
				} else if (data.action === "edit") {
					vm.model.value.markers[data.idx] = data.marker;
				}

				updateMarkerNames();
				redrawMarkers();

			}
		}

		vm.deleteRoute = function () {
			if (confirm("Are you sure you want to delete this route? Doing so will clear all the route markers")) {
				if (polyline) polyline.remove();
				if (markerGroup) markerGroup.remove();
				if (traceMarker) traceMarker.remove();
				if (map) map.remove();
				vm.route = undefined;
				vm.model.value.markers = [];
				vm.model.value.fileId = "";
				vm.hasRouteFile = false;
			}
		}

		vm.jumpToStart = function () {
			goTo(0);
		}

		vm.jumpBack = function () {
			goTo(vm.currentDistance - 50);
		}

		vm.stepBack = function () {
			goTo(vm.currentDistance - 1);
		}

		vm.stepForward = function () {
			goTo(vm.currentDistance + 1);
		}

		vm.jumpForward = function () {
			goTo(vm.currentDistance + 100);
		}

		vm.jumpToEnd = function () {
			goTo(vm.route.lengthMetres);
		}

		vm.getMarkerName = function (idx, marker) {
			return marker.content.name; // innerContentService.populateName(marker.content, idx, vm.model.config.contentTypes);
		}

		vm.getMarkerDescription = function (marker) {
			return "Distance: " + (marker.distance / 1000).toFixed(2) + "km";
		}

		vm.canAddMarker = function () {
			return !vm.model.config.maxItems || vm.model.value.markers.length < vm.model.config.maxItems;
		}

		vm.addMarker = function (evt) {
			
			// Create the new marker
			var newMarker = {
				distance: vm.currentDistance,
				latLng: {
					lat: vm.currentLatLng.lat,
					lng: vm.currentLatLng.lng
				},
				content: null
			}

			// Find it's target index
			var idx = _.sortedIndex(vm.model.value.markers.map(function (itm) {
				return itm.distance;
			}), newMarker.distance);

			// Edit it's content
			vm.icOverlayConfig.event = evt;
			vm.icOverlayConfig.data = { model: newMarker.content, idx: idx, action: "add", marker: newMarker };
			vm.icOverlayConfig.show = true;

		};

		vm.removeMarker = function (idx) {
			vm.model.value.markers.splice(idx, 1);
			updateMarkerNames();
			redrawMarkers();
		}

		vm.editMarkerContent = function (evt, idx, marker) {
			vm.icOverlayConfig.event = evt;
			vm.icOverlayConfig.data = { model: marker.content, idx: idx, action: "edit", marker: marker };
			vm.icOverlayConfig.show = true;
		}

		/*
		 * ========================================================
		 *	Watchers
		 * ========================================================
		 */
		$scope.$watch("vm.currentDistance", _.throttle(function (newVal, oldVal) {
			if (traceMarker) {
				vm.currentLatLng = calcLatLngAtDistance(vm.route.coordinates, newVal);
				traceMarker.setLatLng(vm.currentLatLng);
			}
		}, 50));

		/*
		 * ========================================================
		 *	Initialize
		 * ========================================================
		 */
		var initValue = function () {

			if (vm.model.value && vm.model.value.fileId) {

				vm.hasRouteFile = true;
				
				$timeout(function () {
					initMap();

					// See if there is a route file parser url defined and use that to get the media files contents
					if (vm.model.config.routeFileParserUrl) {
						loadRouteJson(vm.model.config.routeFileParserUrl + "?id=" + vm.model.value.fileId, function () {
							initMapLayers();
						});
					} else {
						// Otherwise just load the media files contents directly
						entityResource.getById(vm.model.value.fileId, "Media").then(function (media) {

							var url = media.hasOwnProperty("metaData") && media.metaData.hasOwnProperty("umbracoFile")
								? media.metaData["umbracoFile"].Value : "";

							if (url) {
								loadRouteJson(url, function () {
									initMapLayers();
								});
							}

						});
					}

				}, 1, false);

			} else {
				vm.model.value.fileId = "";
				vm.model.value.markers = [];
				vm.hasRouteFile = false;
			}

		}

		// Sync any model icons with server ones
		syncIcons();

		// Dependant scripts / styles
		var filesToLoad = [];

		// Check for leaflet
		if (typeof L == "undefined") {
			filesToLoad.push("/App_Plugins/MapRouteContent/js/leaflet.min.js");
			filesToLoad.push("/App_Plugins/MapRouteContent/css/leaflet.css");
		}

		// Check for leaflet-knn
		if (typeof leafletKnn == "undefined") {
			filesToLoad.push("/App_Plugins/MapRouteContent/js/leaflet-knn.min.js");
		}

		if (filesToLoad.length > 0) {
			assetsService.load(filesToLoad, $scope).then(function () {
				initValue();
			});	
		} else {
			initValue();
		}	

	}

]);