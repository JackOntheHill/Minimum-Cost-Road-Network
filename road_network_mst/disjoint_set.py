"""
Disjoint Set Union (DSU / Union-Find) implemented manually from scratch.
Features:
- make_set(x)
- find(x) with Path Compression
- union(x, y) with Union by Rank
- Human-readable component string formatting (e.g. A-B  C  D)
- Internal snapshot exposure for step-by-step educational visualization
"""

from typing import Dict, List, Set, Any


class DisjointSet:
    """
    Disjoint Set Union data structure for cycle detection and connected component tracking.
    """
    def __init__(self, elements: List[str] = None):
        # parent[x] points to x's parent in the forest
        self.parent: Dict[str, str] = {}
        # rank[x] bounds the depth of tree rooted at x
        self.rank: Dict[str, int] = {}
        # Track historical operations for educational explanations
        self.operation_history: List[str] = []

        if elements:
            for elem in elements:
                self.make_set(elem)

    def make_set(self, x: str) -> None:
        """Initializes a new singleton set containing only x."""
        self.parent[x] = x
        self.rank[x] = 0

    def find(self, x: str) -> str:
        """
        Finds the representative (root) of the set containing x.
        Applies Path Compression: links x directly to the root.
        """
        if x not in self.parent:
            raise KeyError(f"Element '{x}' is not present in the Disjoint Set.")
        
        if self.parent[x] != x:
            # Recursively find root and compress path
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x: str, y: str) -> bool:
        """
        Merges the sets containing x and y using Union by Rank.
        Returns:
            True if elements were in separate sets (merge succeeded, no cycle).
            False if elements were already in the same set (cycle detected).
        """
        root_x = self.find(x)
        root_y = self.find(y)

        if root_x == root_y:
            self.operation_history.append(f"union({x}, {y}) -> Cycle detected: already in component rooted at '{root_x}'.")
            return False

        # Union by rank: attach shorter tree under taller tree
        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
            self.operation_history.append(f"union({x}, {y}) -> Linked '{root_x}' under '{root_y}' (rank {self.rank[root_y]}).")
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
            self.operation_history.append(f"union({x}, {y}) -> Linked '{root_y}' under '{root_x}' (rank {self.rank[root_x]}).")
        else:
            # Equal rank: choose one root and increment its rank
            self.parent[root_y] = root_x
            self.rank[root_x] += 1
            self.operation_history.append(f"union({x}, {y}) -> Equal ranks: linked '{root_y}' under '{root_x}', incremented rank to {self.rank[root_x]}.")

        return True

    def get_components(self) -> Dict[str, List[str]]:
        """
        Groups all elements by their current root representative.
        Returns a dictionary mapping root -> sorted list of member elements.
        """
        components: Dict[str, List[str]] = {}
        for elem in sorted(self.parent.keys()):
            root = self.find(elem)
            if root not in components:
                components[root] = []
            components[root].append(elem)
        for root in components:
            components[root].sort()
        return components

    def format_components_display(self) -> str:
        """
        Formats components into the educational representation requested:
        Example: A-B   C   D or A-B-C   D
        """
        groups = self.get_components()
        group_strings = []
        # Sort groups by first element in group for stable readable display
        sorted_groups = sorted(groups.values(), key=lambda g: g[0])
        for g in sorted_groups:
            group_strings.append("-".join(g))
        return "   ".join(group_strings)

    def get_snapshot(self) -> Dict[str, Any]:
        """
        Returns a complete copy of the internal DSU state for visualization.
        """
        # Ensure path compression has been run on all elements for accurate roots
        for elem in list(self.parent.keys()):
            self.find(elem)

        components = self.get_components()
        return {
            "parent": dict(self.parent),
            "rank": dict(self.rank),
            "components": components,
            "display_str": self.format_components_display(),
            "num_components": len(components)
        }
