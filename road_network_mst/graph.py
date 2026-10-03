"""
Weighted Undirected Graph representation for the Minimum Cost Road Network.
Provides town and road management, edge canonicalization, and strict validation.
"""

from typing import List, Tuple, Dict, Set, Optional
from collections import deque


class Road:
    """Represents a weighted undirected edge (road) between two towns."""
    def __init__(self, u: str, v: str, cost: float):
        if u == v:
            raise ValueError(f"Town '{u}' cannot have a road connecting directly to itself (self-loop).")
        if cost <= 0:
            raise ValueError(f"Road construction cost must be strictly positive (> 0). Received: {cost}")
        
        # Store endpoints in alphabetical order for canonical comparison
        self.u = min(u, v)
        self.v = max(u, v)
        self.cost = cost

    @property
    def edge_tuple(self) -> Tuple[str, str]:
        return (self.u, self.v)

    def connects(self, town: str) -> bool:
        return town == self.u or town == self.v

    def other(self, town: str) -> str:
        if town == self.u:
            return self.v
        if town == self.v:
            return self.u
        raise ValueError(f"Town '{town}' is not an endpoint of road ({self.u}, {self.v}).")

    def __repr__(self) -> str:
        return f"Road({self.u} <--> {self.v}, cost={self.cost})"

    def __eq__(self, other) -> bool:
        if isinstance(other, Road):
            return (self.u, self.v, self.cost) == (other.u, other.v, other.cost)
        return False

    def __hash__(self) -> int:
        return hash((self.u, self.v, self.cost))


class RoadNetwork:
    """Weighted Undirected Graph representing towns and possible roads."""
    def __init__(self):
        self._towns: Set[str] = set()
        self._roads: Dict[Tuple[str, str], Road] = {}

    @property
    def towns(self) -> List[str]:
        """Returns sorted list of all town names."""
        return sorted(list(self._towns))

    @property
    def roads(self) -> List[Road]:
        """Returns list of all registered roads sorted by cost, then alphabetically."""
        return sorted(list(self._roads.values()), key=lambda r: (r.cost, r.u, r.v))

    @property
    def num_towns(self) -> int:
        return len(self._towns)

    @property
    def num_roads(self) -> int:
        return len(self._roads)

    def add_town(self, town: str) -> None:
        """Adds a new town. Validates non-empty and uniqueness."""
        if not town or not town.strip():
            raise ValueError("Town name cannot be empty.")
        clean_name = town.strip()
        if clean_name in self._towns:
            raise ValueError(f"Town '{clean_name}' already exists in the road network.")
        self._towns.add(clean_name)

    def remove_town(self, town: str) -> None:
        """Removes a town and all incident roads."""
        clean_name = town.strip()
        if clean_name not in self._towns:
            raise ValueError(f"Cannot remove nonexistent town '{clean_name}'.")
        self._towns.remove(clean_name)
        # Remove any roads connected to this town
        keys_to_remove = [k for k in self._roads if clean_name in k]
        for k in keys_to_remove:
            del self._roads[k]

    def add_road(self, u: str, v: str, cost: float) -> Road:
        """Adds an undirected road between town u and town v with given cost."""
        u_clean = u.strip()
        v_clean = v.strip()
        if u_clean not in self._towns:
            raise ValueError(f"Cannot add road: Source town '{u_clean}' does not exist in network.")
        if v_clean not in self._towns:
            raise ValueError(f"Cannot add road: Destination town '{v_clean}' does not exist in network.")
        
        road = Road(u_clean, v_clean, cost)
        pair = road.edge_tuple
        if pair in self._roads:
            existing = self._roads[pair]
            raise ValueError(
                f"Road between '{road.u}' and '{road.v}' already exists with cost {existing.cost}. "
                "To modify cost, please use update_road_cost()."
            )
        self._roads[pair] = road
        return road

    def update_road_cost(self, u: str, v: str, new_cost: float) -> Road:
        """Updates the cost of an existing road."""
        u_clean = u.strip()
        v_clean = v.strip()
        pair = (min(u_clean, v_clean), max(u_clean, v_clean))
        if pair not in self._roads:
            raise ValueError(f"Cannot update cost: No existing road between '{u_clean}' and '{v_clean}'.")
        if new_cost <= 0:
            raise ValueError(f"Road construction cost must be strictly positive (> 0). Received: {new_cost}")
        road = Road(pair[0], pair[1], new_cost)
        self._roads[pair] = road
        return road

    def remove_road(self, u: str, v: str) -> None:
        """Removes a road between u and v."""
        u_clean = u.strip()
        v_clean = v.strip()
        pair = (min(u_clean, v_clean), max(u_clean, v_clean))
        if pair not in self._roads:
            raise ValueError(f"Cannot remove road: No road exists between '{u_clean}' and '{v_clean}'.")
        del self._roads[pair]

    def get_road(self, u: str, v: str) -> Optional[Road]:
        """Gets a road if it exists."""
        pair = (min(u.strip(), v.strip()), max(u.strip(), v.strip()))
        return self._roads.get(pair)

    def get_neighbors(self, town: str) -> List[Tuple[str, float]]:
        """Returns adjacent towns and corresponding road costs: [(neighbor, cost), ...]"""
        if town not in self._towns:
            raise ValueError(f"Town '{town}' does not exist.")
        neighbors = []
        for road in self._roads.values():
            if road.connects(town):
                neighbors.append((road.other(town), road.cost))
        return neighbors

    def get_connected_components(self) -> List[Set[str]]:
        """Finds all connected components via BFS."""
        visited: Set[str] = set()
        components: List[Set[str]] = []

        for town in self.towns:
            if town not in visited:
                comp: Set[str] = set()
                queue = deque([town])
                visited.add(town)
                comp.add(town)
                while queue:
                    curr = queue.popleft()
                    for neighbor, _ in self.get_neighbors(curr):
                        if neighbor not in visited:
                            visited.add(neighbor)
                            comp.add(neighbor)
                            queue.append(neighbor)
                components.append(comp)
        return components

    def is_connected(self) -> bool:
        """Returns True if the network is empty or has exactly 1 connected component."""
        if self.num_towns <= 1:
            return True
        return len(self.get_connected_components()) == 1

    def total_network_cost(self) -> float:
        """Sum of costs of all available candidate roads."""
        return sum(r.cost for r in self._roads.values())
