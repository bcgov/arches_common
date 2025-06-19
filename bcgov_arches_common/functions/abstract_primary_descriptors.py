from arches.app.datatypes.datatypes import DataTypeFactory
from arches.app.models import models
from arches.app.functions.primary_descriptors import (
    AbstractPrimaryDescriptorsFunction as CoreDescriptorsFunction,
)


class AbstractPrimaryDescriptors(CoreDescriptorsFunction):
    _graph_slug = ""
    _name_node_aliases = []
    _card_node_aliases = []
    _popup_node_aliases = []

    _datatype_factory = DataTypeFactory()

    _nodes = {}
    _datatypes = {}
    _initialized = False

    # Initializes the static nodes and datatypes data
    def initialize(self):
        for alias in self.get_all_nodes():
            node = models.Node.objects.filter(
                alias=alias, graph__slug=AbstractPrimaryDescriptors._graph_slug
            ).first()
            if node:
                AbstractPrimaryDescriptors._nodes[alias] = node
                AbstractPrimaryDescriptors._datatypes[alias] = (
                    AbstractPrimaryDescriptors._datatype_factory.get_instance(
                        node.datatype
                    )
                )

        AbstractPrimaryDescriptors._initialized = True

    def get_all_nodes(self):
        return (
            AbstractPrimaryDescriptors._name_node_aliases
            + AbstractPrimaryDescriptors._popup_node_aliases
            + AbstractPrimaryDescriptors._card_node_aliases
        )

    def get_name_descriptor(self, resource, config, context):
        return self.get_values_in_order(
            AbstractPrimaryDescriptors._name_node_aliases, config, resource, " - "
        )

    def get_search_card_descriptor(self, resource, config, context):
        return self.get_values_in_order(
            AbstractPrimaryDescriptors._card_node_aliases, config, resource
        )

    def get_map_popup_descriptor(self, resource, config, context):
        return self.get_values_in_order(
            AbstractPrimaryDescriptors._popup_node_aliases, config, resource
        )

    def get_values_in_order(
        self, aliases, config, resource, tile_data=None, connector=""
    ) -> str:
        display_values = []
        for node_alias in aliases:
            value = AbstractPrimaryDescriptors._get_value_from_node(
                node_alias=node_alias,
                resourceinstanceid=resource,
                data_tile=tile_data,
            )
            if value:
                if config["first_only"]:
                    return AbstractPrimaryDescriptors._format_value(
                        AbstractPrimaryDescriptors._nodes[node_alias].name,
                        value,
                        config,
                    )
                display_values.append(
                    AbstractPrimaryDescriptors._format_value(
                        AbstractPrimaryDescriptors._nodes[node_alias].name,
                        value,
                        config,
                    )
                )
        return connector.join(display_values)

    def get_primary_descriptor_from_nodes(
        self, resource, config, context=None, descriptor=None
    ):
        if not AbstractPrimaryDescriptors._initialized:
            self.initialize()
        if descriptor == "name":
            return self.get_name_descriptor(resource, config, context=None)
        elif descriptor == "description":
            return self.get_search_card_descriptor(resource, config, context=None)
        else:
            return self.get_map_popup_descriptor(resource, config, context=None)

    @staticmethod
    def _get_value_from_node(node_alias, resourceinstanceid=None, data_tile=None):
        """
        get the display value from the resource tile(s) for the node with the given name

        Keyword Arguments

        node_alias -- node alias of the data to extract
        resourceinstanceid -- id of resource instance used to fetch the tile(s) if data_tile not specified
        data_tile -- if specified, the tile to extract the value from
        """
        if node_alias not in AbstractPrimaryDescriptors._nodes:
            return None

        display_values = []
        datatype = AbstractPrimaryDescriptors._datatypes[node_alias]

        if data_tile:
            tiles = data_tile if type(data_tile) is list else [data_tile]
        else:
            tiles = (
                models.TileModel.objects.filter(
                    nodegroup_id=AbstractPrimaryDescriptors._nodes[
                        node_alias
                    ].nodegroup_id
                )
                .filter(resourceinstance_id=resourceinstanceid)
                .all()
            )

        for tile in tiles:
            if tile:
                display_values.append(
                    datatype.get_display_value(
                        tile, AbstractPrimaryDescriptors._nodes[node_alias]
                    )
                )

        return (
            None
            if len(display_values) == 0
            else (display_values[0] if len(display_values) == 1 else display_values)
        )

    @staticmethod
    def _format_value(name, value, config):
        if type(value) is list:
            value = set(value)
            if "" in value:
                value.remove("")
            value = ", ".join(sorted(value))

        if value is None:
            return ""
        elif config["show_name"]:
            return (
                "<div class='bc-popup-entry'><div class='bc-popup-label'>%s</div><div class='bc-popup-value'>%s</div></div>"
                % (name, value)
            )
        return value
