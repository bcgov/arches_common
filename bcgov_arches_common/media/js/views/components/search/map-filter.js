define([
    'jquery',
    'underscore',
    'knockout',
    'arches',
    'templates/views/components/search/map-filter.htm',
    'views/components/search/base-filter',
    'views/components/map',
    'views/components/widgets/map/bin-feature-collection',
    'views/components/widgets/map/map-styles',
    'models/graph',
    'turf',
    'geohash',
    'geojson-extent',
    'uuid',
    'geojsonhint',
    'utils/map-popup-provider',
    'utils/map-filter-utils',
    'utils/resource-geom-callback-factory',
], function($, _, ko, arches, mapFilterTemplate, BaseFilter, MapComponentViewModel, binFeatureCollection, mapStyles, GraphModel, turf, geohash,  geojsonExtent, uuid, geojsonhint) {
    var componentName = 'map-filter';
    const viewModel = BaseFilter.extend({
        initialize: function(options) {
            var self = this;

            this.dependenciesLoaded = ko.observable(false);
            this.resultsAutoZoomEnabled = ko.observable(arches.mapFilterAutoZoom);
            this.mapFitBounds = function(bounds, options, force){
                this.lastResultsBounds = bounds;
                if(this.resultsAutoZoomEnabled() || force){
                    this.map().fitBounds(bounds, options);
                }
            }

            require(['mapbox-gl', 'mapbox-gl-draw'], (mapbox, mbdraw) => {
                self.mapboxgl = mapbox;
                self.MapboxDraw = mbdraw;
                self.dependenciesLoaded(true);
                if(self.map()){
                    self.map.valueHasMutated();
                }
            });

            options.name = "Map Filter";
            BaseFilter.prototype.initialize.call(this, options);

            options.sources = {
                "geojson-search-buffer-data": {
                    "type": "geojson",
                    "generateId": true,
                    "data": {
                        "type": "FeatureCollection",
                        "features": []
                    }
                }
            };

            options.layers = ko.observable(
                [
                    {
                        "id": "geojson-search-buffer-outline-base",
                        "source": "geojson-search-buffer-data",
                        "type": "line",
                        "filter": [
                            "==", "$type", "Polygon"
                        ],
                        "layout": {
                            "line-cap": "round",
                            "line-join": "round"
                        },
                        "paint": {
                            "line-color": "#fff",
                            "line-width": 4
                        }
                    },
                    {
                        "id": "geojson-search-buffer-outline",
                        "source": "geojson-search-buffer-data",
                        "type": "line",
                        "filter": [
                            "==", "$type", "Polygon"
                        ],
                        "layout": {
                            "line-cap": "round",
                            "line-join": "round"
                        },
                        "paint": {
                            "line-color": "#3bb2d0",
                            "line-width": 2
                        }
                    },
                    {
                        "id": "geojson-search-buffer",
                        "type": "fill",
                        "layout": {
                            "visibility": "visible"
                        },
                        "paint": {
                            "fill-color": "#3bb2d0",
                            "fill-outline-color": "#3bb2d0",
                            "fill-opacity": 0.2
                        },
                        "source": "geojson-search-buffer-data"
                    }
                ]
            );

            options.search = true;

            MapComponentViewModel.apply(this, [options]);

            this.updateLayers = function(layers) {
                var map = self.map();
                var style = map.getStyle();
                style.layers = self.draw ? layers.concat(self.draw.options.styles) : layers;
                map.setStyle(style);
            };

            this.searchGeometries = ko.observableArray(null);
            this.searchAggregations = ko.observable();
            this.selectedTool = ko.observable();
            this.geoJSONString = ko.observable(undefined);
            this.geoJSONErrors = ko.observableArray();
            this.pageLoaded = false;
            this.maxBuffer = 100000;
            this.maxBufferUnits = 'm';
            this.maxZoom = arches.mapDefaultMaxZoom;
            this.filter.feature_collection = ko.observable({
                "type": "FeatureCollection",
                "features": []
            });

            this.bufferUnits = [{
                name: 'meters',
                val: 'm'
            },{
                name: 'feet',
                val: 'ft'
            }];

            this.geometryOperations = [{
                name: 'Intersection',
                val: 'intersect'
            },{
                name: 'Union',
                val: 'union'
            }];

            this.hasMultipleGeometries = ko.observable(false);

            this.mapLinkData.subscribe(function(data) {
                this.zoomToGeoJSON(data);
            },this);

            var bins = binFeatureCollection(this.searchAggregations);

            this.geoJSONString.subscribe(function(geoJSONString) {
                this.geoJSONErrors(this.getGeoJSONErrors(geoJSONString));
                if(this.geoJSONErrors().length === 0){
                    var geoJSON = JSON.parse(geoJSONString);
                    // remove any extra geometries as only one geometry is allowed for search
                    // geoJSON.features = geoJSON.features.slice(0, 1);
                    if(geoJSON.features.length > 0){
                        var extent = geojsonExtent(geoJSON);
                        var bounds = new this.mapboxgl.LngLatBounds(extent);
                        this.mapFitBounds(bounds, {
                            padding: parseInt(this.buffer(), 10)
                        });
                    }
                    this.searchGeometries(geoJSON.features);
                    this.draw.set(geoJSON);
                }
            }, this);

            this.getGeoJSONErrors = function(geoJSONString) {
                var hint = geojsonhint.hint(geoJSONString);
                var errors = [];
                try{
                    var geoJSON = JSON.parse(geoJSONString);
                    if (geoJSON.features.length > 1){
                        hint.push({
                            "level": 'warning',
                            "message": 'Only one feature is allowed for search filtering.  Ignorning all all but the first feature.'
                        });
                    }
                    var feature = geoJSON.features[0];
                    let bufferWidth;
                    if (!!feature.properties && !!feature.properties.buffer){
                        var buffer = feature.properties.buffer;
                        try{
                            bufferWidth = parseInt(buffer.width, 10);
                            if(bufferWidth < 0 || bufferWidth > this.maxBuffer){
                                throw new Error('Whoops!');
                            }
                        }
                        catch {
                            hint.push({
                                "level": 'warning',
                                "message": 'Buffer must be an integer between 0 and ' + this.maxBuffer
                            });
                        }

                        try{
                            var bufferUnit = buffer.unit;
                            if(bufferUnit !== 'ft' && bufferUnit !== 'm'){
                                throw new Error('Whoops!');
                            }
                        }
                        catch {
                            hint.push({
                                "level": 'warning',
                                "message": 'Buffer unit must be either "ft" of "m"'
                            });
                        }
                    }

                    if (!!feature.properties && !!feature.properties.geometryOperation){
                        var geometryOperation = feature.properties.geometryOperation;
                        try{
                            if(geometryOperation !== 'intersect' && geometryOperation !== 'union'){
                                throw new Error('Whoops!');
                            }
                        }
                        catch {
                            hint.push({
                                "level": 'warning',
                                "message": 'Group operation be either "intersect" or "union"'
                            });
                        }

                    }

                    if (!!feature.properties && !!feature.properties.inverted){
                        var inverted = feature.properties.inverted;
                        try{
                            bufferWidth = parseInt(buffer.width, 10);
                            if(inverted !== true && inverted !== false){
                                throw new Error('Whoops!');
                            }
                        }
                        catch {
                            hint.push({
                                "level": 'warning',
                                "message": 'Property "inverted" must be the boolean "true" or "false" (no quotes)'
                            });
                        }
                    }
                }finally{
                    hint.forEach(function(item) {
                        if (item.level !== 'message') {
                            errors.push(item);
                        }
                    });
                    return errors; // eslint-disable-line no-unsafe-finally
                }
            };

            this.spatialFilterTypes = [{
                name: 'Point',
                title: 'Draw a Marker',
                class: 'leaflet-draw-draw-marker',
                icon: 'ion-location',
                drawMode: 'draw_point',
                active: ko.observable(false)
            }, {
                name: 'Line',
                title: 'Draw a Polyline',
                icon: 'ion-steam',
                class: 'leaflet-draw-draw-polyline',
                drawMode: 'draw_line_string',
                active: ko.observable(false)
            }, {
                name: 'Polygon',
                title: 'Draw a Polygon',
                icon: 'fa fa-pencil-square-o',
                class: 'leaflet-draw-draw-polygon',
                drawMode: 'draw_polygon',
                active: ko.observable(false)
            }, {
                name: 'Extent',
                title: 'Search by Map Extent',
                icon: 'fa fa-pencil-square-o',
                class: 'leaflet-draw-draw-polygon',
                drawMode: 'extent',
                active: ko.observable(false)
            }];

            this.drawModes = _.pluck(this.spatialFilterTypes, 'drawMode');

            this.selectedTool.subscribe(function(selectedDrawTool){
                if(!!selectedDrawTool){
                    if(selectedDrawTool === 'extent'){
                        this.searchByExtent();
                    } else {
                        this.draw.changeMode(selectedDrawTool);
                        self.map().draw_mode = selectedDrawTool;
                    }
                }
            }, this);

            this.searchResults.timestamp.subscribe(function(timestamp) {
                if(this.pageLoaded) {
                    this.updateResults();
                }
            }, this);

            /*
            selectFeatureAsFilter: function(feature) {
                var searchFeatures;
                this.featureSearchError(null);
                if (mapFilterUtils.isArchesGeometry(feature)) {
                    let callbackFunction = geomCallbackFactory.getCallbackForFeature(feature);
                    if (!!callbackFunction)
                    {
                        searchFeatures = mapFilterUtils.getGeometryFromResource(feature, callbackFunction);
                    }
                    else
                    {
                        this.featureSearchError('Resource layer has not been configured as a map filter' + feature.sourceLayer);
                        return;
                    }
                }
                else
                {
                    searchFeatures = [mapFilterUtils.getFeatureFromWFS(feature, feature.sourceLayer)];
                }
                var featureSet = this.draw.getAll();
                //var searchGeoms = this.externalSearchGeometries();
                _.each(searchFeatures, function(searchFeature){
                    featureSet.features.push(searchFeature);
                    //searchGeoms.push(searchFeature);
                });
                this.draw.set(featureSet);
                this.searchGeometries(this.draw.getAll().features);
                this.updateFilter();
                this.selectedTool(undefined);
            },
             */

            /**
             * Filter by one or more geometries.
             * @param feature Feature to filter by
             * @param addToFilter if true, add to any existing features already selected, owtherwise clear selection and
             * set the feature as the sole geometry filter
             */
            this.filterByFeatureGeom = function(feature, addToFilter) {
                if (feature.geometry.type === 'Point' && this.buffer() === 0) { this.buffer(25); }
                if (!addToFilter)
                {
                    self.searchGeometries.removeAll();
                    this.draw.deleteAll();
                    this.draw.set({
                        "type": "FeatureCollection",
                        "features": [feature]
                    });
                    self.searchGeometries([feature]);
                }
                else
                {
                    this.draw.add(feature);
                    self.searchGeometries().push(feature);
                }
                self.updateFilter();
            };

            var updateSearchResultPointLayer = function() {
                var pointSource = self.map().getSource('search-results-points');
                var agg = ko.unwrap(self.searchAggregations);
                var features = [];
                var mouseoverInstanceId = self.mouseoverInstanceId();

                if (agg) {
                    _.each(agg.results, function(result) {
                        _.each(result._source.points, function(point) {
                            var feature = turf.point([point.point.lon, point.point.lat], _.extend(result._source, {
                                resourceinstanceid: result._id,
                                highlight: result._id === mouseoverInstanceId
                            }));
                            features.push(feature);
                        });
                    });
                }

                var pointsFC = turf.featureCollection(features);
                pointSource.setData(pointsFC);
            };

            this.updateSearchResultsLayers = function() {
                if (self.filter.feature_collection() && self.filter.feature_collection()['features'].length > 0) {
                    var geojsonFC = self.filter.feature_collection();
                    var extent = geojsonExtent(geojsonFC);
                    var bounds = new this.mapboxgl.LngLatBounds(extent);
                    self.mapFitBounds(bounds, {
                        padding: self.buffer()
                    });
                } else {
                    self.fitToAggregationBounds();
                }
                var features = [];
                var agg = ko.unwrap(self.searchAggregations);
                _.each(agg.geo_aggs.grid.buckets, function(cell) {
                    var pt = geohash.decode(cell.key);
                    var feature = turf.point([pt.lon, pt.lat], {
                        doc_count: cell.doc_count
                    });
                    features.push(feature);
                });
                var pointsFC = turf.featureCollection(features);

                var aggregated = turf.collect(ko.unwrap(bins), pointsFC, 'doc_count', 'doc_count');
                _.each(aggregated.features, function(feature) {
                    feature.properties.doc_count = _.reduce(feature.properties.doc_count, function(i, ii) {
                        return i + ii;
                    }, 0);
                });

                var aggData = {
                    points: pointsFC,
                    agg: aggregated
                };

                var aggSource = self.map().getSource('search-results-hex');
                var hashSource = self.map().getSource('search-results-hashes');
                aggSource.setData(aggData.agg);
                hashSource.setData(aggData.points);
                updateSearchResultPointLayer();
            };

            this.searchFilterVms[componentName](this);
            this.map.subscribe(function(){
                this.setupDraw();
                this.restoreState();

                var filterUpdated = ko.computed(function() {
                    return JSON.stringify(ko.toJS(this.filter.feature_collection())) + this.filter.inverted();
                }, this);
                filterUpdated.subscribe(function() {
                    this.updateQuery();
                }, this);

                this.buffer.subscribe(function(val) {
                    this.updateFilter();
                }, this);

                this.bufferUnit.subscribe(function(val) {
                    this.updateFilter();
                }, this);

                this.geometryOperation.subscribe(function(val) {
                    this.updateFilter();
                }, this);

                this.searchAggregations.subscribe(this.updateSearchResultsLayers, this);
                if (ko.isObservable(bins)) {
                    bins.subscribe(this.updateSearchResultsLayers, this);
                }
                if (this.searchAggregations()) {
                    this.updateSearchResultsLayers();
                }
                this.mouseoverInstanceId.subscribe(updateSearchResultPointLayer);
            }, this);
        },

        setupDraw: function() {
            if(!this.map() || !this.dependenciesLoaded()){
                return;
            }
            var self = this;
            var modes = this.MapboxDraw.modes;
            modes.static = {
                toDisplayFeatures: function(state, geojson, display) {
                    display(geojson);
                }
            };
            this.draw = new this.MapboxDraw({
                displayControlsDefault: false,
                modes: modes
            });
            this.map().addControl(this.draw);
            this.map().on('draw.create', function(e) {
                /*
            self.draw.getAll().features.forEach(function(feature){
                if(feature.id !== e.features[0].id){
                    self.draw.delete(feature.id);
                }
            });
        */
                self.searchGeometries().push(...e.features);
                self.updateFilter();
                self.selectedTool(undefined);
            });
            this.map().on('draw.update', function(e) {
                let updatedGeoms = _.filter(self.searchGeometries(), function (geom) {
                    return geom.id !== e.features[0].id
                });
                updatedGeoms.push(...e.features);
                self.searchGeometries(updatedGeoms);
                self.updateFilter();
            });
            this.map().on("draw.modechange", function(e) {
                self.map().draw_mode = e.mode;
            });
        },

        searchByExtent: function() {
            if (_.contains(this.drawModes, this.selectedTool())) {
                this.draw.deleteAll();
            }
            var bounds = this.map().getBounds();
            var ll = bounds.getSouthWest().toArray();
            var ul = bounds.getNorthWest().toArray();
            var ur = bounds.getNorthEast().toArray();
            var lr = bounds.getSouthEast().toArray();
            var coordinates = [ll, ul, ur, lr, ll];
            var boundsFeature = {
                "type": "Feature",
                "properties": {},
                "id": uuid.generate(),
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coordinates]
                }
            };
            this.draw.set({
                "type": "FeatureCollection",
                "features": [boundsFeature]
            });
            this.searchGeometries([boundsFeature]);
            this.updateFilter();
            this.selectedTool(undefined);
        },
            showDetailsFromFilter: function(resourceinstanceid) {
                const url = arches.urls.search_results+`?id=${resourceinstanceid}&tiles=true`
                const searchResults = this.searchFilterVms["search-results"]
                const instanceCache = searchResults().bulkDisambiguatedResourceInstanceCache;
                searchResults().selectedTab('search-result-details');
                searchResults().details.loading(true);
                if (!instanceCache()[resourceinstanceid])
                {
                    $.getJSON(url, (resp) => {
                        const result = resp.results.hits.hits[0];
                        const graphId = result._source.graph_id;
                        instanceCache()[resourceinstanceid] = result._source;
                        searchResults().bulkDisambiguatedResourceInstanceCache(instanceCache());
                        if (!searchResults().bulkResourceReportCache()[graphId])
                        {
                            this.getMissingGraphAndShowReport(graphId, result, searchResults());
                        }
                        else
                        {
                            // Otherwise load the details page directly
                            console.log("Showing details from showDetailsFromFilter");
                            this.searchFilterVms["search-results"]().showResourceSummaryReport(result)();
                        }
                    });
                }
                else
                {
                    searchResults().showResourceSummaryReport({_source: instanceCache()[resourceinstanceid]})();
                }
            },
            getMissingGraphAndShowReport: function(graphId, resource, searchResults) {
                if (!!searchResults.bulkResourceReportCache()[graphId])
                {
                    return false;
                }
                let url = arches.urls.api_bulk_resource_report + `?graph_ids=${[graphId]}`;
                $.getJSON(url, function(resp) {
                    var bulkResourceReportCache = searchResults.bulkResourceReportCache();

                    Object.keys(resp).forEach(function(graphId) {
                        var graphData = resp[graphId];

                        if (graphData.graph) {
                            graphData['graphModel'] = new GraphModel({
                                data: graphData.graph,
                                datatypes: graphData.datatypes
                            });
                        }
                        bulkResourceReportCache[graphId] = graphData;
                    });
                    searchResults.bulkResourceReportCache(bulkResourceReportCache);
                    searchResults.showResourceSummaryReport(resource)();
                });
                return true;
            },

        useMaxBuffer: function(unit, buffer, maxBuffer) {
            let res = false;
            if (unit === 'ft') {
                res = (buffer * 0.3048) > maxBuffer;
            } else {
                res = buffer > maxBuffer;
            }
            return res;
        },

        updateFilter: function(){
            if (this.buffer() < 0) {
                this.buffer(0);
            }

            var useMaxBuffer = this.useMaxBuffer(this.bufferUnit(), this.buffer(), this.maxBuffer);
            if (useMaxBuffer) {
                const max = this.bufferUnit() === 'ft' ? 328084 : this.maxBuffer;
                this.buffer(max);
            }

            this.searchGeometries().forEach(function(feature){
                if(!feature.properties){
                    feature.properties = {};
                }
                feature.properties.buffer = {
                    "width": this.buffer(),
                    "unit": this.bufferUnit()
                };
                feature.properties.inverted = this.filter.inverted();
            }, this);
            this.filter.feature_collection({
                "type": "FeatureCollection",
                "operation": this.geometryOperation(),
                "features": this.searchGeometries()
            });
        },

        editGeoJSON: function(feature) {
            var geoJSON = feature();
            var geoJSONString = JSON.stringify(geoJSON, null, 4);
            this.geoJSONString(geoJSONString);
        },

        updateGeoJSON: function() {
            if (this.geoJSONErrors().length === 0) {
                var geoJSON = JSON.parse(this.geoJSONString());
                this.draw.set(geoJSON);
                this.searchGeometries(geoJSON.features);
                geoJSON.features.forEach(function(feature){
                    if(!!feature.properties && !!feature.properties.buffer){
                        this.buffer(parseInt(feature.properties.buffer.width, 10));
                        this.bufferUnit(feature.properties.buffer.unit);
                    }
                    if(!!feature.properties && Object.prototype.hasOwnProperty.call(feature.properties, 'inverted')){
                        this.filter.inverted(feature.properties.inverted);
                    }
                }, this);
                this.selectedTool(undefined);
                this.geoJSONString(undefined);
            }
        },

        zoomToGeoJSON: function(data) {
            var mapData = data.properties.geometries.reduce(function(fc1, fc2) {
                fc1.geom.features = fc1.geom.features.concat(fc2.geom.features);
                return fc1;
            }, {
                "geom": {
                    "type": "FeatureCollection",
                    "features": []
                }
            });
            var bounds = new this.mapboxgl.LngLatBounds(geojsonExtent(mapData.geom));
            var maxZoom = ko.unwrap(this.maxZoom);
            this.mapFitBounds(bounds, {
                maxZoom: maxZoom > 17 ? 17 : maxZoom
            }, true);
        },

        updateQuery: function() {
            var self = this;
            var queryObj = this.query();
            if (this.filter.feature_collection().features.length > 0) {
                if (this.getFilterByType('term-filter-type').hasTag(this.type) === false) {
                    this.getFilterByType('term-filter-type').addTag('Map Filter Enabled', this.name, this.filter.inverted);
                }
                this.filter.feature_collection().features[0].properties['inverted'] = this.filter.inverted();
                queryObj[componentName] = ko.toJSON(this.filter.feature_collection());
                this.hasMultipleGeometries( this.filter.feature_collection().features.length > 1);
            } else {
                delete queryObj[componentName];
            }
            this.query(queryObj);
        },

        restoreState: function() {
            var query = this.query();
            var buffer = 10;
            var bufferUnit = 'm';
            var geometryOperation = 'union';
            var inverted = false;
            var hasSpatialFilter = false;
            if (componentName in query) {
                var mapQuery = JSON.parse(query[componentName]);
                if (mapQuery.features.length > 0) {
                    hasSpatialFilter = true;
                    var properties = mapQuery.features[0].properties;
                    inverted = properties.inverted;
                    this.filter.feature_collection(mapQuery);
                    buffer = properties.buffer.width;
                    bufferUnit = properties.buffer.unit;
                    this.draw.set({
                        "type": "FeatureCollection",
                        "features": mapQuery.features
                    });
                }
            }
            // we need to add these observables here AFTER initial values have been discovered
            // because of the race nature of these variables' subscriptions
            this.buffer = ko.observable(buffer).extend({ deferred: true });
            this.geometryOperation = ko.observable(geometryOperation).extend( {deferred: true})
            this.bufferUnit = ko.observable(bufferUnit).extend({ deferred: true });
            this.filter.inverted = ko.observable(inverted).extend({ deferred: true });
            if (hasSpatialFilter) {
                this.getFilterByType('term-filter-type').addTag('Map Filter Enabled', this.name, this.filter.inverted);
            }
            this.updateResults();
            this.pageLoaded = true;
        },

        updateResults: function() {
            if (!!this.searchResults.results){
                this.searchAggregations({
                    results: this.searchResults.results.hits.hits,
                    geo_aggs: this.searchResults.results.aggregations.geo_aggs.inner.buckets[0]
                });
                this.fitToAggregationBounds();
            }
            if(!!this.searchResults[componentName]) {
                var buffer = this.searchResults[componentName].search_buffer;
                this.map().getSource('geojson-search-buffer-data').setData(
                    {
                        "type": "FeatureCollection",
                        "features": buffer
                    });
            }
        },

        clear: function(reset_features) {
            this.filter.feature_collection({
                "type": "FeatureCollection",
                "features": []
            });
            this.map().getSource('geojson-search-buffer-data').setData({
                "type": "FeatureCollection",
                "features": []
            });
            this.getFilterByType('term-filter-type').removeTag('Map Filter Enabled');
            this.draw.deleteAll();
            this.searchGeometries([]);
        },

        deleteFilter: function() {
            this.draw.trash();
            this.searchGeometries(this.draw.getAll().features);
            this.updateFilter();
        },

        zoomToAllFeaturesHandler: function(){
            this.fitToAggregationBounds(true);
        },

        fitToAggregationBounds: function(forceFitBounds) {
            var agg = this.searchAggregations();
            var aggBounds;
            if (agg && agg.geo_aggs.bounds.bounds && this.map()) {
                aggBounds = agg.geo_aggs.bounds.bounds;
                var bounds = [
                    [
                        aggBounds.top_left.lon,
                        aggBounds.bottom_right.lat
                    ],
                    [
                        aggBounds.bottom_right.lon,
                        aggBounds.top_left.lat
                    ]
                ];
                var maxZoom = ko.unwrap(this.maxZoom);
                maxZoom = maxZoom > 17 ? 17 : maxZoom;
                forceFitBounds = forceFitBounds == undefined ? !this.pageLoaded : forceFitBounds == true;
                this.mapFitBounds(bounds, {
                    padding: 45,
                    maxZoom: maxZoom
                }, forceFitBounds);
            }
        },
    });

    return ko.components.register(componentName, {
        viewModel: viewModel,
        template: mapFilterTemplate,
    });
});
