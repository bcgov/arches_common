import os, json
from bcgov_arches_common.views.search import SearchView
from django.test import TestCase
from django.test.client import RequestFactory
from arches.app.models.models import User
from django.core import management
from tests import test_settings


class TestSearchView(TestCase):
    search_view = None
    layers_dir = (
        test_settings.PROJECT_TEST_ROOT
        + "/../bcgov_arches_common/pkg/map_layers/mapbox_spec_json"
    )

    @classmethod
    def setUpClass(cls):
        super(TestSearchView, cls).setUpClass()
        cls.search_view = SearchView()
        request_factory = RequestFactory()
        cls.search_view.request = request_factory.get("/bcgov_arches_common/search")
        cls.search_view.request.user = User.objects.get(username="admin")
        for subdir in ["basemaps", "overlays"]:
            for layerdir in os.listdir(os.path.join(cls.layers_dir, subdir)):
                filename = os.path.join(
                    cls.layers_dir, subdir, layerdir, layerdir + ".json"
                )
                with open(filename) as f:
                    d = json.load(f)
                    layer_name = d["name"]
                management.call_command(
                    "packages",
                    operation="add_mapbox_layer",
                    layer_name=layer_name,
                    mapbox_json_path=filename,
                    verbosity=3,
                )

    def test_format_url(self):
        search_view = self.search_view
        self.assertEqual(
            search_view.format_url("/this_should_not_add_a_prefix"),
            "/this_should_not_add_a_prefix",
        )
        self.assertEqual(
            search_view.format_url("/bctileserver/this_should_add_a_prefix"),
            "/bcgov_arches_core/bctileserver/this_should_add_a_prefix",
        )
        self.assertEqual(
            search_view.format_url("/bclocaltileserver/this_should_add_a_prefix"),
            "/bcgov_arches_core/bclocaltileserver/this_should_add_a_prefix",
        )
        self.assertEqual(
            search_view.format_url("/bclocaltileserver"),
            "/bcgov_arches_core/bclocaltileserver",
        )

    def test_get_context_data(self):
        search_view = self.search_view
        context = search_view.get_context_data(kwargs={"request": {}})
        for source in context["map_sources"]:
            print("Map source %s: %s" % (source.name, source.source))
            if source.name not in [
                "mapbox-streets",
                "mapbox-satellite",
                "geocode-point",
                "search-query",
            ]:
                print("Processing: %s" % source.name)
                if source.name == "planet-source-Planet SPOT 15":
                    print("Map source: %s" % source.source)
                    self.assertTrue(
                        source.source["tiles"][0].startswith(
                            "https://tiles.planet.com/"
                        ),
                        "Wrong prefix for layer %s: %s"
                        % (source.name, source.source["tiles"][0]),
                    )
                else:
                    self.assertTrue(
                        source.source["tiles"][0].startswith("/bcgov_arches_core/"),
                        "Wrong prefix for layer %s: %s"
                        % (source.name, source.source["tiles"][0]),
                    )
