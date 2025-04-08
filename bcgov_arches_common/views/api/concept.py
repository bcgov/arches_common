from django.views.generic import View
from arches.app.models import models
from arches.app.models.concept import Concept
from arches.app.utils.response import JSONResponse


class ConceptsForNode(View):

    def get(self, request, graph_slug, node_alias):
        node = models.Node.objects.get(graph__slug=graph_slug, alias=node_alias)
        if node.datatype != "concept" or "rdmCollection" not in node.config:
            return JSONResponse(
                {
                    "error": f"Invalid node datatype",
                    "details": f"Node {node_alias} must have a concept or concept-list datatype, not {node.datatype}.",
                },
                status=500,
            )
        results = Concept().get_e55_domain(node.config["rdmCollection"])
        return JSONResponse(results)
