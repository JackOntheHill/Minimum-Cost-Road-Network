"""
Manual implementation of Kruskal's Algorithm for Minimum Spanning Tree (MST).
Uses manual DisjointSet (Union-Find) with Path Compression and Union by Rank.
Records detailed step-by-step trace for visualization and cycle detection explanation.
"""

from typing import List, Dict, Any, Optional
from graph import RoadNetwork, Road
from disjoint_set import DisjointSet


class KruskalStep:
    """Represents algorithm state at one edge evaluation in Kruskal's algorithm."""
    def __init__(
        self,
        step_number: int,
        considered_edge: Optional[Road],
        status: str,  # 'INIT', 'SELECTED', 'REJECTED_CYCLE', 'FINISHED', 'DISCONNECTED_ERROR'
        reason: str,
        mst_roads: List[Road],
        running_cost: float,
        dsu_snapshot: Dict[str, Any],
        edge_index: int,
        total_candidate_edges: int
    ):
        self.step_number = step_number
        self.considered_edge = considered_edge
        self.status = status
        self.reason = reason
        self.mst_roads = list(mst_roads)
        self.running_cost = running_cost
        self.dsu_snapshot = dsu_snapshot
        self.edge_index = edge_index
        self.total_candidate_edges = total_candidate_edges

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_number": self.step_number,
            "considered_edge": (self.considered_edge.u, self.considered_edge.v, self.considered_edge.cost) if self.considered_edge else None,
            "status": self.status,
            "reason": self.reason,
            "mst_roads": [(r.u, r.v, r.cost) for r in self.mst_roads],
            "running_cost": self.running_cost,
            "dsu_snapshot": self.dsu_snapshot,
            "edge_index": self.edge_index,
            "total_candidate_edges": self.total_candidate_edges
        }


class KruskalResult:
    """Encapsulates the complete result of Kruskal's algorithm run."""
    def __init__(
        self,
        success: bool,
        mst_roads: List[Road],
        total_cost: float,
        steps: List[KruskalStep],
        edges_considered_count: int,
        edges_rejected_count: int,
        error_message: Optional[str] = None
    ):
        self.success = success
        self.mst_roads = mst_roads
        self.total_cost = total_cost
        self.steps = steps
        self.edges_considered_count = edges_considered_count
        self.edges_rejected_count = edges_rejected_count
        self.error_message = error_message
        self.steps_count = len(steps)


def run_kruskal(graph: RoadNetwork) -> KruskalResult:
    """
    Executes Kruskal's algorithm step-by-step from scratch.
    Does NOT use external MST library functions.
    """
    towns = graph.towns
    n = len(towns)

    if n == 0:
        dsu = DisjointSet([])
        step0 = KruskalStep(
            step_number=0,
            considered_edge=None,
            status="FINISHED",
            reason="Empty graph has 0 vertices and 0 edges.",
            mst_roads=[],
            running_cost=0.0,
            dsu_snapshot=dsu.get_snapshot(),
            edge_index=0,
            total_candidate_edges=0
        )
        return KruskalResult(True, [], 0.0, [step0], 0, 0)

    if n == 1:
        dsu = DisjointSet(towns)
        step0 = KruskalStep(
            step_number=0,
            considered_edge=None,
            status="FINISHED",
            reason=f"Single town '{towns[0]}' requires 0 roads to be connected.",
            mst_roads=[],
            running_cost=0.0,
            dsu_snapshot=dsu.get_snapshot(),
            edge_index=0,
            total_candidate_edges=0
        )
        return KruskalResult(True, [], 0.0, [step0], 0, 0)

    # 1. Sort all candidate roads by ascending cost (break ties by town names)
    sorted_roads = sorted(graph.roads, key=lambda r: (r.cost, r.u, r.v))
    total_edges = len(sorted_roads)

    # 2. Initialize Disjoint Set for all towns
    dsu = DisjointSet(towns)
    mst_roads: List[Road] = []
    running_cost: float = 0.0
    steps: List[KruskalStep] = []
    rejected_count = 0
    considered_count = 0

    # Step 0: Initial State
    init_step = KruskalStep(
        step_number=0,
        considered_edge=None,
        status="INIT",
        reason=f"Initialized Disjoint Set for {n} towns. Sorted all {total_edges} candidate roads by increasing cost. Initial components: {dsu.format_components_display()}.",
        mst_roads=[],
        running_cost=0.0,
        dsu_snapshot=dsu.get_snapshot(),
        edge_index=0,
        total_candidate_edges=total_edges
    )
    steps.append(init_step)

    step_counter = 1

    # 3. Consider edges in ascending order of cost
    for idx, road in enumerate(sorted_roads):
        considered_count += 1
        root_u = dsu.find(road.u)
        root_v = dsu.find(road.v)

        if root_u != root_v:
            # Endpoints belong to different components -> Union them & add to MST
            dsu.union(road.u, road.v)
            mst_roads.append(road)
            running_cost += road.cost

            reason = (
                f"Road '{road.u} <--> {road.v}' (cost {road.cost}) connects two separate components: "
                f"[{root_u}] and [{root_v}]. Merging components prevents cycles. Road ACCEPTED into MST."
            )
            step = KruskalStep(
                step_number=step_counter,
                considered_edge=road,
                status="SELECTED",
                reason=reason,
                mst_roads=list(mst_roads),
                running_cost=running_cost,
                dsu_snapshot=dsu.get_snapshot(),
                edge_index=idx + 1,
                total_candidate_edges=total_edges
            )
            steps.append(step)
            step_counter += 1

            # Early termination check: once we have V - 1 edges, MST is complete!
            if len(mst_roads) == n - 1:
                break
        else:
            # Endpoints already in the same component -> Reject because it forms a cycle
            rejected_count += 1
            reason = (
                f"Road '{road.u} <--> {road.v}' (cost {road.cost}) connects towns that ALREADY belong to the "
                f"same component (both share root '{root_u}'). Adding this road would create a CYCLE. Road REJECTED."
            )
            step = KruskalStep(
                step_number=step_counter,
                considered_edge=road,
                status="REJECTED_CYCLE",
                reason=reason,
                mst_roads=list(mst_roads),
                running_cost=running_cost,
                dsu_snapshot=dsu.get_snapshot(),
                edge_index=idx + 1,
                total_candidate_edges=total_edges
            )
            steps.append(step)
            step_counter += 1

    # 4. Check if we managed to connect all towns (V - 1 edges)
    if len(mst_roads) < n - 1:
        error_msg = (
            f"Graph is disconnected! Kruskal's algorithm examined all {total_edges} roads but only found "
            f"{len(mst_roads)} valid roads out of the {n - 1} required to connect {n} towns. "
            f"Final components: {dsu.format_components_display()}."
        )
        fail_step = KruskalStep(
            step_number=step_counter,
            considered_edge=None,
            status="DISCONNECTED_ERROR",
            reason=error_msg,
            mst_roads=list(mst_roads),
            running_cost=running_cost,
            dsu_snapshot=dsu.get_snapshot(),
            edge_index=total_edges,
            total_candidate_edges=total_edges
        )
        steps.append(fail_step)
        return KruskalResult(
            success=False,
            mst_roads=mst_roads,
            total_cost=running_cost,
            steps=steps,
            edges_considered_count=considered_count,
            edges_rejected_count=rejected_count,
            error_message=error_msg
        )

    # Final completion step
    final_step = KruskalStep(
        step_number=step_counter,
        considered_edge=None,
        status="FINISHED",
        reason=(
            f"Kruskal's algorithm successfully constructed the MST with {len(mst_roads)} edges "
            f"(target V - 1 = {n - 1}) and total cost {running_cost}. All towns unified into component: "
            f"{dsu.format_components_display()}."
        ),
        mst_roads=list(mst_roads),
        running_cost=running_cost,
        dsu_snapshot=dsu.get_snapshot(),
        edge_index=considered_count,
        total_candidate_edges=total_edges
    )
    steps.append(final_step)

    return KruskalResult(
        success=True,
        mst_roads=mst_roads,
        total_cost=running_cost,
        steps=steps,
        edges_considered_count=considered_count,
        edges_rejected_count=rejected_count
    )
