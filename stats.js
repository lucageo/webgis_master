
//Initialise map
//-------------------------------------------------------------------------------------------------------------
// https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio (if youhave to work wit canvas)
var pixel_ratio = parseInt(window.devicePixelRatio) || 1;
// leaflet max zoom
var max_zoom = 16;
// Width and height of tiles (reduce number of tiles and increase tile size)
var tile_size = 512;
// zoom to italy (lat,lon, zoom)
var map = L.map('map', {
}).setView([42, 10], 6);

// create the sidebar instance and add it to the map
var sidebar = L.control.sidebar({ container: 'sidebar' }).addTo(map);
// add panels dynamically to the sidebar
sidebar.addPanel({
       id:   'population_trend',
       tab:  '<i class="fa fa-signal"></i>',
       title: 'Residential population (1975-2015)',
       pane: '<p class="chart_text">Provinces population calculated using the Global Human Settlement Layer (GHSL) global layer (1km resulution)</p>\
      <div id="chart_population"></div>',
   })
sidebar.addPanel({
      id:   'population_density',
      tab:  '<i class="fa fa-signal"></i>',
      title: 'Population density (1975-2015)',
      pane: '<p class="chart_text">Provinces population calculated using the Global Human Settlement Layer (GHSL) global layer (1km resulution)</p>\
     <div id="chart_population_density"></div>',
  })
// open legend after a second!
setTimeout(function(){
sidebar.open('legend')
}, 1000);


// Define basemaps
// choose one from https://leaflet-extras.github.io/leaflet-providers/preview/
var WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
 attribution: ''
});

var light  =  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd',
	maxZoom: 19
}).addTo(map);


// Lable pane (no additional library required)
var topPane = map.createPane('leaflet-top-pane', map.getPanes().mapPane);
var topLayer =  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png', {
	subdomains: 'abcd',
  opacity: 1,
	maxZoom: 19
}).addTo(map);
topPane.appendChild(topLayer.getContainer());
topLayer.setZIndex(2);

// Define Rregion layer
var url_region = 'https://lrm-maps.jrc.ec.europa.eu/geoserver/mastergis/wms';
var provinces=L.tileLayer.wms(url_region, {
		layers: 'mastergis:CMprov2016_WGS84_2',
		transparent: true,
		format: 'image/png',
		opacity:'0.8',
		zIndex: 2
	}).addTo(map);

// Define Rregion HIGHLIGHT layer
var provinces_selected=L.tileLayer.wms(url_region, {
		layers: 'mastergis:CMprov2016_WGS84_2',
		transparent: true,
		format: 'image/png',
		opacity:'1',
    styles: 'polygon',
    zIndex: 44
 }).addTo(map);
provinces_selected.setParams({CQL_FILTER:"sigla LIKE ''"});


// on click function
map.on('click', function(e) {
	 if (map.hasLayer(provinces)) {
		var latlng= e.latlng;
		var url = getFeatureInfoUrl(
										map,
										provinces,
										e.latlng,
										{
												'info_format': 'text/javascript',  //it allows us to get a jsonp
												'propertyName': ' den_cmpro,sigla,pop1975_su,pop1990_su,pop2000_su,pop2015_su,pop1975_de,pop1990_de,pop2000_de,pop2015_de',
												'query_layers': 'mastergis:CMprov2016_WGS84_2',
												'format_options':'callback:getJson'
										}
								);
			 $.ajax({
							 jsonp: false,
							 url: url,
							 dataType: 'jsonp',
							 jsonpCallback: 'getJson',
							 success: handleJson_featureRequest
						 });
					function handleJson_featureRequest(data)
					{
						 if (typeof data.features[0]!=='undefined')
								 {
										var prop=data.features[0].properties;
										var filter="sigla='"+prop['sigla']+"'";
										provinces_selected.setParams({CQL_FILTER:filter});
										select_region(prop,latlng);
							}
							else {}
						}
				 }
				 else {
			 }
});


// get feature info function
function getFeatureInfoUrl(map, layer, latlng, params) {

var point = map.latLngToContainerPoint(latlng, map.getZoom()),
    size = map.getSize(),
    bounds = map.getBounds(),
    sw = bounds.getSouthWest(),
    ne = bounds.getNorthEast();
var defaultParams = {
    request: 'GetFeatureInfo',
    service: 'WMS',
    srs: 'EPSG:4326',
    styles: '',
    version: layer._wmsVersion,
    format: layer.options.format,
    bbox: bounds.toBBoxString(),
    height: size.y,
    width: size.x,
    layers: layer.options.layers,
    info_format: 'text/javascript'
};
params = L.Util.extend(defaultParams, params || {});
params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;
return layer._url + L.Util.getParamString(params, layer._url, true);
}


function select_region(info,latlng){

  var den_cmpro=info['den_cmpro'];
  var sigla=info['sigla'];
  var pop1975_su=info['pop1975_su'];
  var pop1990_su=info['pop1990_su'];
  var pop2000_su=info['pop2000_su'];
  var pop2015_su=info['pop2015_su'];
  var pop1975_de=info['pop1975_de'];
  var pop1990_de=info['pop1990_de'];
  var pop2000_de=info['pop2000_de'];
  var pop2015_de=info['pop2015_de'];
  var popupContent = '<center><h5>'+den_cmpro+'</h5></center>';
  var popup = L.popup()
  .setLatLng([latlng.lat, latlng.lng])
  .setContent(popupContent)
  .openOn(map);

// open sidebar
$("#chart_population").show();
sidebar.open('population_trend');


$('#chart_population').highcharts({
  chart: {
  type:'column',
   height: 300,
  backgroundColor:'rgba(255, 255, 255, 0)',
  legend: {enabled: false}
  },
  title: {text: null},
  subtitle: {text: null},
  credits: {
      enabled: false,
      text: '© DOPA Services',
      href: 'http://dopa.jrc.ec.europa.eu/en/services'
  },
   xAxis: {
     categories: [den_cmpro]
  },
  yAxis: {
        title: { text: null },
        labels: {overflow: 'justify'}
  },
  series:[{
           name: '1975',
           color: '#4e6269',
           data: [parseInt(pop1975_su)]
         },{
           name: '1990',
           color: '#8f9da2',
           data: [parseInt(pop1990_su)]
         },{
           name: '2000',
           color: '#bbc9ce',
           data: [parseInt(pop2000_su)]
         },{
           name: '2015',
           color: '#d9e4e8',
           data: [parseInt(pop2015_su)]
         }
       ]
});


$('#chart_population_density').highcharts({
  chart: {
  type:'column',
   height: 300,
  backgroundColor:'rgba(255, 255, 255, 0)',
  legend: {enabled: false}
  },
  title: {text: null},
  subtitle: {text: null},
  credits: {
      enabled: false,
      text: '© DOPA Services',
      href: 'http://dopa.jrc.ec.europa.eu/en/services'
  },
   xAxis: {
     categories: [den_cmpro]
  },
  yAxis: {
        title: { text: null },
        labels: {overflow: 'justify'}
  },
  series:[{
           name: '1975',
           color: '#4e6269',
           data: [parseInt(pop1975_de)]
         },{
           name: '1990',
           color: '#8f9da2',
           data: [parseInt(pop1990_de)]
         },{
           name: '2000',
           color: '#bbc9ce',
           data: [parseInt(pop2000_de)]
         },{
           name: '2015',
           color: '#d9e4e8',
           data: [parseInt(pop2015_de)]
         }
       ]
});



} // end of "select_region" function

// opacity slider
var sliderVal;
$(function () {
    $('#slider_pop').bootstrapSlider().on('slide', function (ev) {
    sliderVal = ev.value;
    provinces.setOpacity(sliderVal/100);
    });
    if (sliderVal) {
    $('#slider_pop').bootstrapSlider('setValue', sliderVal);
    }
});
function rangeSlider(sliderVal) {
    provinces.setOpacity(sliderVal)
}

// HIDE CHARTS WHEN CLOSING POPUP
map.on('popupclose', function (){
sidebar.close();
});

//Available Layers
var baseMaps = {"White" : light, "WorldImagery":WorldImagery};
var overlayMaps = {'provinces': provinces};

//Add Layer Control
layerControl = L.control.layers(baseMaps, overlayMaps, null,  {position: 'topleft'}).addTo(map);
