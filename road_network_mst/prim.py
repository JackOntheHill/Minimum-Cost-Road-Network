"""
Manual implementation of Prim's Algorithm for Minimum Spanning Tree (MST).
Maintains full step-by-step state trace for visualization and educational explanations.
"""

from typing import List, Dict, Any, Optional
from graph import RoadNetwork, Road


class PrimStep:
    """Represents the complete algorithm state at one discrete step of Prim's."""
    def __init__(
        self,
        step_number: int,
        visited_towns: List[str],
        unvisited_towns: List[str],
        mst_roads: List[Road],
        candidate_cut_edges: List[Dict[str, Any]],
        considered_edge: Optional[Road],
        action_type: str,  # 'INIT', 'EDGE_SELECTED', 'DISCONNECTED_ERROR', 'FINISHED'
        description: str,
        running_cost: float,
        reason: str
    ):
        self.step_number = step_number
        self.visited_towns = sorted(list(visited_towns))
        self.unvisited_towns = sorted(list(unvisited_towns))
        self.mst_roads = list(mst_roads)
        self.candidate_cut_edges = candidate_cut_edges
        self.considered_edge = considered_edge
        self.action_type = action_type
        self.description = description
        self.running_cost = running_cost
        self.reason = reason

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_number": self.step_number,
            "visited_towns": self.visited_towns,
            "unvisited_towns": self.unvisited_towns,
            "mst_roads": [(r.u, r.v, r.cost) for r in self.mst_roads],
            "candidate_cut_edges": self.candidate_cut_edges,
            "considered_edge": (self.considered_edge.u, self.considered_edge.v, self.considered_edge.cost) if self.considered_edge else None,
            "action_type": self.action_type,
            "description": self.description,
            "running_cost": self.running_cost,
            "reason": self.reason
        }


class PrimResult:
    """Encapsulates the complete result of Prim's algorithm run."""
    def __init__(
        self,
        success: bool,
        mst_roads: List[Road],
        total_cost: float,
        steps: List[PrimStep],
        error_message: Optional[str] = None,
        starting_town: str = ""
    ):
        self.success = success
        self.mst_roads = mst_roads
        self.total_cost = total_cost
        self.steps = steps
        self.error_message = error_message
        self.starting_town = starting_town
        self.edges_considered_count = sum(1 for s in steps if s.considered_edge is not None)
        self.steps_count = len(steps)


def run_prim(graph: RoadNetwork, starting_town: Optional[str] = None) -> PrimResult:
    """
    Executes Prim's algorithm step-by-step from scratch.
    Does NOT use external MST library functions.
    """
    towns = graph.towns
    n = len(towns)

    if n == 0:
        step = PrimStep(
            step_number=0,
            visited_towns=[],
            unvisited_towns=[],
            mst_roads=[],
            candidate_cut_edges=[],
            considered_edge=None,
            action_type="FINISHED",
            description="The road network has no towns. Empty MST created.",
            running_cost=0.0,
            reason="Graph is empty."
        )
        return PrimResult(success=True, mst_roads=[], total_cost=0.0, steps=[step], starting_town="")

    if n == 1:
        single_town = towns[0]
        step = PrimStep(
            step_number=0,
            visited_towns=[single_town],
            unvisited_towns=[],
            mst_roads=[],
            candidate_cut_edges=[],
            considered_edge=None,
            action_type="FINISHED",
            description=f"Only one town '{single_town}' exists. A single town requires 0 roads to be connected.",
            running_cost=0.0,
            reason="Trivial tree with 1 vertex and 0 edges."
        )
        return PrimResult(success=True, mst_roads=[], total_cost=0.0, steps=[step], starting_town=single_town)

    # Determine starting town
    if not starting_town or starting_town not in towns:
        start_node = towns[0]
    else:
        start_node = starting_town

    visited: set = {start_node}
    unvisited: set = set(towns) - visited
    mst_roads: List[Road] = []
    running_cost: float = 0.0
    steps: List[PrimStep] = []

    # Step 0: Initialization
    init_step = PrimStep(
        step_number=0,
        visited_towns=list(visited),
        unvisited_towns=list(unvisited),
        mst_roads=[],
        candidate_cut_edges=[],
        considered_edge=None,
        action_type="INIT",
        description=f"Initialized Prim's algorithm at seed town '{start_node}'. Visited: {{{start_node}}}, Unvisited: {sorted(list(unvisited))}.",
        running_cost=0.0,
        reason=f"Prim starts growing a single connected tree from starting vertex '{start_node}'."
    )
    steps.append(init_step)

    step_counter = 1

    # Main loop: grow the tree until visited contains all towns
    while len(visited) < n:
        # 1. Identify all cut edges: edges with one endpoint in visited and one in unvisited
        candidates: List[Dict[str, Any]] = []
        for road in graph.roads:
            u_in = road.u in visited
            v_in = road.v in visited
            
            if (u_in and not v_in) or (v_in and not u_in):
                in_town = road.u if u_in else road.v
                out_town = road.v if u_in else road.u
                candidates.append({
                    "road": road,
                    "in_town": in_town,
                    "out_town": out_town,
                    "cost": road.cost,
                    "u": road.u,
                    "v": road.v
                })

        # Disconnected check: unvisited towns remain, but no cut edges cross the boundary
        if not candidates:
            error_msg = (
                f"Graph is disconnected! After adding {len(visited)} towns ({sorted(list(visited))}), "
                f"there are no roads connecting to the remaining unvisited towns: {sorted(list(unvisited))}. "
                "A complete Minimum Spanning Tree spanning all towns cannot be formed."
            )
            fail_step = PrimStep(
                step_number=step_counter,
                visited_towns=list(visited),
                unvisited_towns=list(unvisited),
                mst_roads=list(mst_roads),
                candidate_cut_edges=[],
                considered_edge=None,
                action_type="DISCONNECTED_ERROR",
                description=error_msg,
                running_cost=running_cost,
                reason="No candidate cut edges cross the boundary between visited and unvisited towns."
            )
            steps.append(fail_step)
            return PrimResult(
                success=False,
                mst_roads=mst_roads,
                total_cost=running_cost,
                steps=steps,
                error_message=error_msg,
                starting_town=start_node
            )

        # Sort candidate cut edges by cost (tie-break alphabetically)
        candidates.sort(key=lambda c: (c["cost"], c["road"].u, c["road"].v))

        # Best edge is the cheapest cut edge
        best_candidate = candidates[0]
        selected_road = best_candidate["road"]
        new_town = best_candidate["out_town"]
        tree_town = best_candidate["in_town"]

        # Build candidate summary for educational explanation
        candidate_summary = []
        for i, c in enumerate(candidates):
            is_winner = (i == 0)
            candidate_summary.append({
                "road_str": f"{c['road'].u} - {c['road'].v}",
                "cost": c["cost"],
                "connects": f"{c['in_town']} (in MST) -> {c['out_town']} (unvisited)",
                "status": "Selected (Cheapest)" if is_winner else "Deferred (Higher cost)"
            })

        mst_roads.append(selected_road)
        running_cost += selected_road.cost
        visited.add(new_town)
        unvisited.remove(new_town)

        reason = (
            f"Prim examined {len(candidates)} candidate cut edge(s) crossing the boundary. "
            f"Edge '{selected_road.u}-{selected_road.v}' has the minimum cost ({selected_road.cost}). "
            f"Connecting '{tree_town}' to '{new_town}' expands the MST without creating any cycle."
        )

        step = PrimStep(
            step_number=step_counter,
            visited_towns=list(visited),
            unvisited_towns=list(unvisited),
            mst_roads=list(mst_roads),
            candidate_cut_edges=candidate_summary,
            considered_edge=selected_road,
            action_type="EDGE_SELECTED",
            description=f"Step {step_counter}: Selected road '{selected_road.u} <--> {selected_road.v}' (cost {selected_road.cost}). Town '{new_town}' added to MST.",
            running_cost=running_cost,
            reason=reason
        )
        steps.append(step)
        step_counter += 1

    # Final summary step
    final_step = PrimStep(
        step_number=step_counter,
        visited_towns=list(visited),
        unvisited_towns=[],
        mst_roads=list(mst_roads),
        candidate_cut_edges=[],
        considered_edge=None,
        action_type="FINISHED",
        description=f"Prim's algorithm completed successfully! Connected all {n} towns using {len(mst_roads)} roads with total minimum cost {running_cost}.",
        running_cost=running_cost,
        reason=f"All {n} vertices have been included in the single growing tree with exactly {n - 1} edges."
    )
    steps.append(final_step)

    return PrimResult(
        success=True,
        mst_roads=mst_roads,
        total_cost=running_cost,
        steps=steps,
        starting_town=start_node
    )
