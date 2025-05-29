const resourceGeomCallbackFactory = {
    // Return a function that can extract the geometry from the resource model
    getCallbackForFeature: function (feature) {
        // if (feature.sourceLayer === "2336968c-1035-11ec-a3aa-5254008afee6") // BC Fossil Site
        // {
        //     return this.fossilSiteCallback;
        // } else ...
        return function (resource) {
            return {};
        };
    },
};
export default resourceGeomCallbackFactory;
