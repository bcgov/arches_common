import re
from arches.app.utils.decorators import group_required
from arches.app.views.search import export_results as base_export_results
from arches.app.models.system_settings import settings
from arches.app.views.search import SearchView as CoreSearchView


class SearchView(CoreSearchView):
    url_prefix = None

    def __init__(self, **kwargs):
        super(SearchView, self).__init__(**kwargs)
        url_context_root = (
            settings.BCGOV_PROXY_PREFIX
            if settings.BCGOV_PROXY_PREFIX
            else settings.FORCE_SCRIPT_NAME
        )
        if url_context_root:
            self.url_prefix = "/" + re.sub(
                re.compile("^/"),
                "",
                re.sub(re.compile("/$"), "", url_context_root),
            )

    def format_url(self, tile_url):
        return (
            "{0}{1}".format(self.url_prefix, tile_url)
            if self.url_prefix
            and (
                tile_url.startswith("/bctileserver")
                or tile_url.startswith("/bclocaltileserver")
            )
            else tile_url
        )

    def get_context_data(self, **kwargs):
        context = super(SearchView, self).get_context_data(**kwargs)
        for map_source in context["map_sources"]:
            if "tiles" in map_source.source:
                map_source.source["tiles"] = [
                    self.format_url(tile) for tile in map_source.source["tiles"]
                ]
        return context


@group_required("Resource Exporter")
def export_results(request):
    # print("In BCGOv specific search results")
    # Merge the GET and POST data. Arches assumes data is in the GET object
    request.GET = request.GET.copy()
    for key, value in request.POST.items():
        # print("%s -> %s" % (key, value))
        request.GET[key] = value

    return base_export_results(request)
