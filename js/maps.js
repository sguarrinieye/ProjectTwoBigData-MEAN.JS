var map;
//Angular App Module and Controller
var sampleApp = angular.module('mapsApp', []);
sampleApp.controller('controllerMarker', function ($scope, $http) {
	$scope.formData = {};

// when landing on the page, get all markers and show them
$http.get('http://localhost:8083/getmarkers')
.success(function(data) {
	initMap($scope, data);
})
.error(function(data) {
	console.log('Error: ' + data);
});

$http.get('http://localhost:8083/getallcarrier')
.success(function(data) {
	google.maps.event.addDomListener(window, "load", function() {
		createControls($scope, data);
	});
})
.error(function(data) {
	console.log('Error: ' + data);
});

$scope.onMarkerOver = function(iataMarker){
	removeAllLines($scope);
	$http.get('http://localhost:8083/getroutesorigin/'+iataMarker)
	.success(function(data) {		
		for(var i = 0; i < data.length; i++){
			drawLine($scope, data[i].OriginIata, data[i].DestIata);
		}
		setMarkersOpacity($scope, 0.6);
		$scope.lastIataMarkerClicked = iataMarker;
	})
	.error(function(data) {
		console.log('Error: ' + data);
	});
};

$scope.onMarkerNotOver = function(iataMarker){
	removeAllLines($scope);
	setMarkersOpacity($scope, 1);
};

$scope.onCarrierClick = function(carrierCode){
	removeAllLines($scope);
	$http.get('http://localhost:8083/getroutescarrier/'+carrierCode)
	.success(function(data) {		
		for(var i = 0; i < data.length; i++){
			drawLine($scope, data[i].OriginIata, data[i].DestIata);
		}
		setMarkersOpacity($scope, 0.4);
	})
	.error(function(data) {
		console.log('Error: ' + data);
	});
};
});

function initMap($scope, data) {
	var mapOptions = {
		zoom: 4,
		center: new google.maps.LatLng(37.4236178,-98.8819956),
		mapTypeId: google.maps.MapTypeId.TERRAIN
	}
	map = new google.maps.Map(document.getElementById("map"), mapOptions);
	$scope.map = map;
	$scope.markers = [];
	$scope.lines = [];
	$scope.lastIataMarkerClicked;

	var bounds = new google.maps.LatLngBounds();
	var infoWindow = new google.maps.InfoWindow();

	var createMarker = function (info){
		var marker = new google.maps.Marker({
			map: $scope.map,
			position: new google.maps.LatLng(info.Latitude, info.Longitude),
			title: info.LabelCity,
			icon: 'js/icons/airport.png',
			opacity: 1
		});

		if(marker.title !== 'Pago Pago, TT' && marker.title !== 'Guam, TT')
			bounds.extend(marker.position);

		marker.content = '<div class="infoWindowContent">' + info.Iata + '</div>';

		google.maps.event.addListener(marker, 'mouseover', function(){
			$scope.onMarkerOver(info.Iata);
		});
		google.maps.event.addListener(marker, 'mouseout', function(){
			$scope.onMarkerNotOver(info.Iata);
		});

		$scope.markers[info.Iata] = marker;
		map.fitBounds(bounds);
	}  

	for (i = 0; i < data.length; i++){
		createMarker(data[i]);
	}
}

function createControls($scope, data){
	var allControl = document.createElement('div');
	allControl.id = "allcarrier";
	allControl.title = "Airline Carrier";

	for(var i=0; i<data.length; i++){
		var controlDiv = document.createElement('div');
		controlDiv.id = "carrierDiv";
		controlDiv.title = "Click to select only the "+data[i]+" routes";
		controlDiv.prop = data[i];
		allControl.appendChild(controlDiv);

		var controlText = document.createElement('div');
		controlText.id = "carrierText";
		controlText.innerHTML = "Air: "+data[i];
		controlDiv.appendChild(controlText);

		var text = data[i];

		controlDiv.addEventListener('click', function() {
			$scope.onCarrierClick(this.prop);
		});
	}
	map.controls[google.maps.ControlPosition.TOP_CENTER].push(allControl);
}

function drawLine($scope, airport1, airport2) {
	var flightPath = new google.maps.Polyline({
		path: [$scope.markers[airport1].position, $scope.markers[airport2].position],
		geodesic: true,
		strokeColor: '#FF0000',
		strokeOpacity: 1.0,
		strokeWeight: 2
	});

	$scope.lines.push(flightPath);

	flightPath.setMap($scope.map);
}

function removeAllLines($scope){
	if($scope.lines != null){
		for (i=0; i<$scope.lines.length; i++) {                           
			$scope.lines[i].setMap(null);
		}
		$scope.lines = [];
	}
}

function setMarkersOpacity($scope, opacity){
	for (var current in $scope.markers) {
		$scope.markers[current].setOpacity(opacity);
	}
}