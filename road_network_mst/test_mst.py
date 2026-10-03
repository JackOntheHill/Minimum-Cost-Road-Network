"""
Unit tests for Minimum Cost Road Network algorithms and data structures.
Tests:
- Single vertex graph
- Two vertices graph
- Triangle graph with cycle
- Small village & City network
- Equal edge weights (multiple valid MSTs, same cost)
- Disconnected graph error detection
- DSU make_set, find, union, path compression, and rank tracking
- Input validation (self-loops, negative costs, duplicate roads, nonexistent towns)
"""

import unittest
from graph import RoadNetwork, Road
from disjoint_set import DisjointSet
from prim import run_prim
from kruskal import run_kruskal
from datasets import (
    create_small_village,
    create_city_network,
    create_equal_cost_network,
    create_disconnected_network
)


class TestDisjointSet(unittest.TestCase):
    def test_dsu_basic_operations(self):
        dsu = DisjointSet(["A", "B", "C", "D"])
        self.assertEqual(dsu.find("A"), "A")
        self.assertEqual(dsu.find("B"), "B")
        self.assertEqual(dsu.format_components_display(), "A   B   C   D")

        # Union A and B
        res1 = dsu.union("A", "B")
        self.assertTrue(res1)
        self.assertEqual(dsu.find("A"), dsu.find("B"))
        self.assertEqual(dsu.format_components_display(), "A-B   C   D")

        # Union B and C
        res2 = dsu.union("B", "C")
        self.assertTrue(res2)
        self.assertEqual(dsu.find("A"), dsu.find("C"))
        self.assertEqual(dsu.format_components_display(), "A-B-C   D")

        # Cycle detection: union A and C must fail
        res3 = dsu.union("A", "C")
        self.assertFalse(res3)
        self.assertEqual(dsu.format_components_display(), "A-B-C   D")

    def test_path_compression(self):
        dsu = DisjointSet(["1", "2", "3", "4"])
        dsu.union("1", "2")
        dsu.union("2", "3")
        dsu.union("3", "4")
        # Find should compress path directly to root
        root = dsu.find("4")
        self.assertEqual(dsu.parent["4"], root)


class TestGraphValidation(unittest.TestCase):
    def test_invalid_costs_and_self_loops(self):
        net = RoadNetwork()
        net.add_town("TownA")
        net.add_town("TownB")

        # Negative cost rejected
        with self.assertRaises(ValueError):
            net.add_road("TownA", "TownB", -5.0)

        # Zero cost rejected
        with self.assertRaises(ValueError):
            net.add_road("TownA", "TownB", 0.0)

        # Self-loop rejected
        with self.assertRaises(ValueError):
            net.add_road("TownA", "TownA", 10.0)

        # Nonexistent town rejected
        with self.assertRaises(ValueError):
            net.add_road("TownA", "GhostTown", 10.0)

        # Duplicate edge rejected
        net.add_road("TownA", "TownB", 10.0)
        with self.assertRaises(ValueError):
            net.add_road("TownA", "TownB", 15.0)


class TestMSTAlgorithms(unittest.TestCase):
    def test_single_vertex(self):
        net = RoadNetwork()
        net.add_town("SoloTown")
        prim = run_prim(net)
        kruskal = run_kruskal(net)

        self.assertTrue(prim.success)
        self.assertTrue(kruskal.success)
        self.assertEqual(prim.total_cost, 0.0)
        self.assertEqual(kruskal.total_cost, 0.0)
        self.assertEqual(len(prim.mst_roads), 0)
        self.assertEqual(len(kruskal.mst_roads), 0)

    def test_two_vertices(self):
        net = RoadNetwork()
        net.add_town("A")
        net.add_town("B")
        net.add_road("A", "B", 7.5)

        prim = run_prim(net)
        kruskal = run_kruskal(net)

        self.assertTrue(prim.success)
        self.assertTrue(kruskal.success)
        self.assertEqual(prim.total_cost, 7.5)
        self.assertEqual(kruskal.total_cost, 7.5)
        self.assertEqual(len(prim.mst_roads), 1)
        self.assertEqual(len(kruskal.mst_roads), 1)

    def test_triangle_graph(self):
        net = RoadNetwork()
        net.add_town("A")
        net.add_town("B")
        net.add_town("C")
        net.add_road("A", "B", 2.0)
        net.add_road("B", "C", 3.0)
        net.add_road("A", "C", 6.0)

        prim = run_prim(net)
        kruskal = run_kruskal(net)

        self.assertTrue(prim.success)
        self.assertTrue(kruskal.success)
        self.assertEqual(prim.total_cost, 5.0)  # 2.0 + 3.0
        self.assertEqual(kruskal.total_cost, 5.0)
        self.assertEqual(len(prim.mst_roads), 2)
        self.assertEqual(len(kruskal.mst_roads), 2)

    def test_cycle_rejection(self):
        # 4 vertices: A, B, C, D
        # A-B (2.0) selected, B-C (3.0) selected
        # A-C (4.0) is considered BEFORE C-D (5.0), and must be REJECTED as a cycle!
        # C-D (5.0) selected to complete V-1 = 3 edges
        net = RoadNetwork()
        for t in ["A", "B", "C", "D"]:
            net.add_town(t)
        net.add_road("A", "B", 2.0)
        net.add_road("B", "C", 3.0)
        net.add_road("A", "C", 4.0)
        net.add_road("C", "D", 5.0)

        kruskal = run_kruskal(net)
        self.assertTrue(kruskal.success)
        self.assertEqual(len(kruskal.mst_roads), 3)
        self.assertEqual(kruskal.edges_rejected_count, 1)
        self.assertEqual(kruskal.total_cost, 10.0)  # 2 + 3 + 5

    def test_small_village(self):
        net = create_small_village()
        prim = run_prim(net)
        kruskal = run_kruskal(net)

        self.assertTrue(prim.success)
        self.assertTrue(kruskal.success)
        self.assertEqual(len(prim.mst_roads), net.num_towns - 1)
        self.assertEqual(len(kruskal.mst_roads), net.num_towns - 1)
        self.assertAlmostEqual(prim.total_cost, kruskal.total_cost, places=5)
        # Optimal cost for small village should be 4 + 8 + 2 + 4 = 18.0
        self.assertEqual(prim.total_cost, 18.0)

    def test_city_network(self):
        net = create_city_network()
        prim = run_prim(net)
        kruskal = run_kruskal(net)

        self.assertTrue(prim.success)
        self.assertTrue(kruskal.success)
        self.assertEqual(len(prim.mst_roads), net.num_towns - 1)
        self.assertEqual(len(kruskal.mst_roads), net.num_towns - 1)
        self.assertAlmostEqual(prim.total_cost, kruskal.total_cost, places=5)

    def test_equal_cost_network(self):
        net = create_equal_cost_network()
        prim = run_prim(net)
        kruskal = run_kruskal(net)

        self.assertTrue(prim.success)
        self.assertTrue(kruskal.success)
        # In equal-cost network, 4 towns with several cost 5.0 edges
        # Both must find V - 1 = 3 edges of cost 5.0 => total cost 15.0
        self.assertEqual(len(prim.mst_roads), 3)
        self.assertEqual(len(kruskal.mst_roads), 3)
        self.assertEqual(prim.total_cost, 15.0)
        self.assertEqual(kruskal.total_cost, 15.0)

    def test_disconnected_network_error(self):
        net = create_disconnected_network()
        self.assertFalse(net.is_connected())

        prim = run_prim(net)
        kruskal = run_kruskal(net)

        # Both must report failure and clear error message
        self.assertFalse(prim.success)
        self.assertFalse(kruskal.success)
        self.assertIn("disconnected", prim.error_message.lower())
        self.assertIn("disconnected", kruskal.error_message.lower())


if __name__ == "__main__":
    unittest.main()
