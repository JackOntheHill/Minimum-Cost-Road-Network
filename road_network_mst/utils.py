"""
Utility functions for Minimum Cost Road Network:
- Metric comparisons between Prim and Kruskal
- Pedagogical explanations of theoretical complexity
- Conceptual comparisons between tree-growing and forest-joining approaches
"""

from typing import Dict, Any
from prim import PrimResult
from kruskal import KruskalResult
from graph import RoadNetwork


def compare_algorithms(graph: RoadNetwork, prim_res: PrimResult, kruskal_res: KruskalResult) -> Dict[str, Any]:
    """Generates comparison summary between Prim and Kruskal algorithm runs."""
    total_candidate_cost = graph.total_network_cost()
    prim_savings = round(((total_candidate_cost - prim_res.total_cost) / total_candidate_cost * 100), 1) if total_candidate_cost > 0 else 0.0
    kruskal_savings = round(((total_candidate_cost - kruskal_res.total_cost) / total_candidate_cost * 100), 1) if total_candidate_cost > 0 else 0.0

    return {
        "prim": {
            "success": prim_res.success,
            "total_cost": prim_res.total_cost,
            "edges_in_mst": len(prim_res.mst_roads),
            "edges_considered": prim_res.edges_considered_count,
            "steps_count": prim_res.steps_count,
            "cost_savings_pct": prim_savings,
            "starting_town": prim_res.starting_town
        },
        "kruskal": {
            "success": kruskal_res.success,
            "total_cost": kruskal_res.total_cost,
            "edges_in_mst": len(kruskal_res.mst_roads),
            "edges_considered": kruskal_res.edges_considered_count,
            "edges_rejected": kruskal_res.edges_rejected_count,
            "steps_count": kruskal_res.steps_count,
            "cost_savings_pct": kruskal_savings
        },
        "cost_match": abs(prim_res.total_cost - kruskal_res.total_cost) < 1e-6,
        "both_successful": prim_res.success and kruskal_res.success
    }


def get_complexity_guide() -> Dict[str, Dict[str, str]]:
    """Returns educational complexity explanations tailored for undergraduate DAA students."""
    return {
        "Prim's Algorithm": {
            "time_complexity": "O(E log V)",
            "space_complexity": "O(V + E)",
            "best_suited_for": "Dense graphs where E ≈ V² (many interconnected roads)",
            "mechanism": "Maintains a single growing connected tree. At each step, a priority queue extracts the cheapest cut edge crossing from visited towns to unvisited towns.",
            "first_year_analogy": "Imagine planting a tree seed in one town and paving roads outward like roots, always choosing the cheapest road that touches fresh ground."
        },
        "Kruskal's Algorithm": {
            "time_complexity": "O(E log E) which is O(E log V)",
            "space_complexity": "O(V + E)",
            "best_suited_for": "Sparse graphs where E << V² (edges are few, sorting is fast)",
            "mechanism": "Sorts all candidate edges upfront. Uses Disjoint Set Union (DSU) to test whether edge endpoints are in the same component. Merges disjoint components and rejects cycle-causing edges.",
            "first_year_analogy": "Imagine a highway contractor sorting all bidding contracts from cheapest to most expensive, building the cheapest available road anywhere in the state, skipping only those that connect towns already reachable through existing paved roads."
        },
        "Disjoint Set Union (DSU)": {
            "time_complexity": "O(α(V)) amortized per operation",
            "space_complexity": "O(V) for parent and rank arrays",
            "best_suited_for": "Fast dynamic equivalence checking and cycle prevention",
            "mechanism": "Path compression flattens the parent tree on find(), while union by rank keeps trees shallow. The inverse Ackermann function α(V) grows so slowly it is ≤ 4 for any value of V up to 10⁸⁰ (the estimated atoms in the universe!).",
            "first_year_analogy": "Think of student friend groups. When two students from different groups shake hands, their entire groups merge under one elected leader. Path compression gives every student the direct phone number to their leader."
        }
    }


def get_conceptual_comparison_text() -> str:
    """Returns clear breakdown of algorithmic design choices."""
    return (
        "### Algorithmic Comparison\n\n"
        "| Feature | Prim's Algorithm | Kruskal's Algorithm |\n"
        "| :--- | :--- | :--- |\n"
        "| **Strategy** | Greedy, local growth from a starting vertex | Greedy, global selection from sorted edge list |\n"
        "| **Intermediate State** | Always forms a **single connected tree** that expands town by town | Forms a **forest of multiple disjoint trees** that gradually merge |\n"
        "| **Core Data Structure** | Priority Queue / Min-Heap | Disjoint Set Union (DSU / Union-Find) |\n"
        "| **Cycle Prevention** | Inherently avoided by selecting edges from visited to unvisited | Explicitly tested via `find(u) == find(v)` in DSU |\n"
        "| **Graph Suitability** | Excellent for **dense networks** (many roads) | Excellent for **sparse networks** (few roads) |\n"
        "| **Optimal Cost** | Minimum total cost (Identical to Kruskal) | Minimum total cost (Identical to Prim) |\n"
    )
