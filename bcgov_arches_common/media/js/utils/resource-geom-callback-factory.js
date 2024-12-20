define([ ], function($, _, arches, ko, BaseFilter, MapComponentViewModel, binFeatureCollection, mapStyles, turf, geohash, geojsonExtent, uuid, geojsonhint, popupDataProvider, mapFilterUtils) {
    let resourceGeomCallbackFactory = {
        // Return a function that can extract the geometry from the resource model
        getCallbackForFeature: function(feature) {
            // if (feature.sourceLayer === "2336968c-1035-11ec-a3aa-5254008afee6") // BC Fossil Site
            // {
            //     return this.fossilSiteCallback;
            // } else ...
            return function(resource) { return {}; }
        }
    };
    return resourceGeomCallbackFactory;
});