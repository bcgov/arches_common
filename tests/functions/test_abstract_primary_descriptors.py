from unittest.mock import patch, MagicMock
from django.test import TestCase

import arches.app.datatypes.datatypes
from bcgov_arches_common.functions.abstract_primary_descriptors import (
    AbstractPrimaryDescriptors,
)


class AbstractPrimaryDescriptorsTestCase(TestCase):
    def setUp(self):
        self.mock_nodes = self._create_mock_nodes()
        self.mock_datatype = MagicMock()
        self.mock_datatype.get_display_value.side_effect = (
            lambda tile, node: f"value_for_{node.alias}"
        )
        self.config = {"first_only": False, "show_name": True}

        self.reset_class_state()

    def reset_class_state(self):
        AbstractPrimaryDescriptors._graph_slug = "test_graph"
        AbstractPrimaryDescriptors._name_node_aliases = ["alias1"]
        AbstractPrimaryDescriptors._card_node_aliases = ["alias2"]
        AbstractPrimaryDescriptors._popup_node_aliases = []
        AbstractPrimaryDescriptors._nodes = {}
        AbstractPrimaryDescriptors._datatypes = {}
        AbstractPrimaryDescriptors._initialized = False

    def _create_mock_nodes(self):
        node1 = MagicMock()
        node1.alias = "alias1"
        node1.nodegroup_id = "group1"
        node1.datatype = "string"
        node1.name = "Node 1"

        node2 = MagicMock()
        node2.alias = "alias2"
        node2.nodegroup_id = "group2"
        node2.datatype = "string"
        node2.name = "Node 2"

        return {"alias1": node1, "alias2": node2}

    @patch("bcgov_arches_common.functions.abstract_primary_descriptors.models.Node")
    @patch("bcgov_arches_common.functions.abstract_primary_descriptors.DataTypeFactory")
    def test_initialize_sets_nodes_and_datatypes(self, mock_factory, mock_node_model):
        mock_factory.return_value.get_instance.return_value = self.mock_datatype
        mock_node_model.objects.filter.return_value.first.side_effect = (
            lambda: self.mock_nodes["alias1"]
        )

        descriptors = AbstractPrimaryDescriptors()
        descriptors.initialize()

        self.assertEqual(descriptors._nodes["alias1"], self.mock_nodes["alias1"])
        self.assertIsInstance(
            descriptors._datatypes["alias1"],
            arches.app.datatypes.datatypes.StringDataType,
        )
        self.assertTrue(descriptors._initialized)

    @patch(
        "bcgov_arches_common.functions.abstract_primary_descriptors.models.TileModel"
    )
    def test_get_value_from_node_with_tile_model(self, mock_tile_model):
        AbstractPrimaryDescriptors._nodes = self.mock_nodes
        AbstractPrimaryDescriptors._datatypes = {"alias1": self.mock_datatype}
        mock_tile_model.objects.filter.return_value.all.return_value = [
            MagicMock(),
            MagicMock(),
        ]

        result = AbstractPrimaryDescriptors._get_value_from_node(
            "alias1", data_tile=self._create_mock_nodes()
        )

        self.assertEqual(result, "value_for_alias1")

    @patch.object(AbstractPrimaryDescriptors, "_get_value_from_node")
    def test_get_values_in_order_returns_formatted_html(self, mock_get_value):
        AbstractPrimaryDescriptors._nodes = {
            "alias1": MagicMock(alias="alias1", name="Mock Node")
        }
        mock_get_value.return_value = "MockValue"

        result = AbstractPrimaryDescriptors().get_values_in_order(
            aliases=["alias1"], config=self.config, resource="res-id"
        )

        self.assertIn("Mock Node", result)
        self.assertIn("MockValue", result)
        self.assertTrue(result.startswith("<div"))

    @patch.object(AbstractPrimaryDescriptors, "get_values_in_order")
    def test_get_name_descriptor_delegates(self, mock_get_values):
        AbstractPrimaryDescriptors._name_node_aliases = ["alias1"]
        mock_get_values.return_value = "NameDescriptor"

        result = AbstractPrimaryDescriptors().get_name_descriptor(
            "res-id", self.config, None
        )

        self.assertEqual(result, "NameDescriptor")
        mock_get_values.assert_called_once()

    @patch.object(AbstractPrimaryDescriptors, "get_values_in_order")
    def test_get_search_card_descriptor_delegates(self, mock_get_values):
        AbstractPrimaryDescriptors._card_node_aliases = ["alias2"]
        mock_get_values.return_value = "CardDescriptor"

        result = AbstractPrimaryDescriptors().get_search_card_descriptor(
            "res-id", self.config, None
        )

        self.assertEqual(result, "CardDescriptor")
        mock_get_values.assert_called_once()

    @patch.object(AbstractPrimaryDescriptors, "get_values_in_order")
    def test_get_map_popup_descriptor_delegates(self, mock_get_values):
        AbstractPrimaryDescriptors._popup_node_aliases = ["alias2"]
        mock_get_values.return_value = "PopupDescriptor"

        result = AbstractPrimaryDescriptors().get_map_popup_descriptor(
            "res-id", self.config, None
        )

        self.assertEqual(result, "PopupDescriptor")
        mock_get_values.assert_called_once()

    @patch.object(AbstractPrimaryDescriptors, "initialize")
    @patch.object(AbstractPrimaryDescriptors, "get_name_descriptor")
    @patch.object(AbstractPrimaryDescriptors, "get_search_card_descriptor")
    @patch.object(AbstractPrimaryDescriptors, "get_map_popup_descriptor")
    def test_get_primary_descriptor_from_nodes_dispatches_properly(
        self, mock_map, mock_card, mock_name, mock_init
    ):
        AbstractPrimaryDescriptors._initialized = False
        mock_name.return_value = "NameResult"
        mock_card.return_value = "CardResult"
        mock_map.return_value = "MapResult"

        func = AbstractPrimaryDescriptors()

        result = func.get_primary_descriptor_from_nodes(
            "res-id", self.config, descriptor="name"
        )
        self.assertEqual(result, "NameResult")

        result = func.get_primary_descriptor_from_nodes(
            "res-id", self.config, descriptor="description"
        )
        self.assertEqual(result, "CardResult")

        result = func.get_primary_descriptor_from_nodes(
            "res-id", self.config, descriptor="map_popup"
        )
        self.assertEqual(result, "MapResult")

        self.assertTrue(mock_init.called)
