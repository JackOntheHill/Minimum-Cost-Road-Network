"""
Network visualization using NetworkX and Matplotlib.
Supports stateful rendering with distinct edge styles:
- Unprocessed edges (subtle gray)
- Currently considered edge (amber/orange highlight)
- Selected MST edges (vibrant green, bold)
- Rejected cycle edges (dashed crimson red)
Uses fixed deterministic layout positions to keep nodes stable across steps.
"""

from typing import Dict, Tuple, Optional, List
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import networkx as nx

from graph import RoadNetwork, Road


def compute_fixed_layout(graph: RoadNetwork) -> Dict[str, Tuple[float, float]]:
    """
    Computes a deterministic 2D coordinate layout for graph towns.
    Uses spring layout with fixed seed, or circular layout for small graphs.
    """
    G = nx.Graph()
    for t in graph.towns:
        G.add_node(t)
    for r in graph.roads:
        G.add_edge(r.u, r.v, weight=r.cost)

    if graph.num_towns <= 6:
        pos = nx.circular_layout(G)
    else:
        # Fixed seed ensures identical node positions regardless of algorithm step
        pos = nx.spring_layout(G, seed=42, k=1.8 / (graph.num_towns ** 0.5 + 0.1), iterations=80)
    return pos


def render_graph_figure(
    graph: RoadNetwork,
    pos: Dict[str, Tuple[float, float]],
    selected_edges: Optional[List[Tuple[str, str]]] = None,
    considered_edge: Optional[Tuple[str, str]] = None,
    rejected_edges: Optional[List[Tuple[str, str]]] = None,
    visited_nodes: Optional[List[str]] = None,
    node_component_map: Optional[Dict[str, int]] = None,
    title: str = "Road Network",
    figsize: Tuple[int, int] = (9, 6)
) -> plt.Figure:
    """
    Renders the road network state onto a clean Matplotlib figure.
    """
    selected_set = set((min(u, v), max(u, v)) for u, v in (selected_edges or []))
    rejected_set = set((min(u, v), max(u, v)) for u, v in (rejected_edges or []))
    curr_considered = (min(considered_edge[0], considered_edge[1]), max(considered_edge[0], considered_edge[1])) if considered_edge else None

    # Categorize roads
    mst_roads = []
    considered_roads = []
    rejected_roads = []
    unprocessed_roads = []

    for r in graph.roads:
        pair = (r.u, r.v)
        if curr_considered and pair == curr_considered:
            considered_roads.append(pair)
        elif pair in selected_set:
            mst_roads.append(pair)
        elif pair in rejected_set:
            rejected_roads.append(pair)
        else:
            unprocessed_roads.append(pair)

    fig, ax = plt.subplots(figsize=figsize, facecolor="#0f172a")
    ax.set_facecolor("#0f172a")

    G = nx.Graph()
    for t in graph.towns:
        G.add_node(t)

    # 1. Draw Unprocessed Edges
    if unprocessed_roads:
        nx.draw_networkx_edges(
            G, pos, edgelist=unprocessed_roads,
            ax=ax, edge_color="#475569", width=2.0, alpha=0.5, style="solid"
        )

    # 2. Draw Rejected Edges (cycles)
    if rejected_roads:
        nx.draw_networkx_edges(
            G, pos, edgelist=rejected_roads,
            ax=ax, edge_color="#ef4444", width=2.5, alpha=0.8, style="dashed"
        )

    # 3. Draw Selected MST Edges
    if mst_roads:
        nx.draw_networkx_edges(
            G, pos, edgelist=mst_roads,
            ax=ax, edge_color="#10b981", width=4.5, alpha=0.95, style="solid"
        )

    # 4. Draw Currently Considered Edge (glow effect with halo)
    if considered_roads:
        # Outer glow
        nx.draw_networkx_edges(
            G, pos, edgelist=considered_roads,
            ax=ax, edge_color="#fbbf24", width=7.0, alpha=0.4
        )
        # Inner bright core
        nx.draw_networkx_edges(
            G, pos, edgelist=considered_roads,
            ax=ax, edge_color="#f59e0b", width=3.5, alpha=1.0
        )

    # 5. Determine Node Colors
    node_colors = []
    node_border_colors = []
    palette = ["#38bdf8", "#a78bfa", "#f472b6", "#fb923c", "#34d399", "#facc15", "#818cf8"]

    for town in graph.towns:
        if node_component_map and town in node_component_map:
            comp_id = node_component_map[town]
            color = palette[comp_id % len(palette)]
            node_colors.append(color)
            node_border_colors.append("#ffffff")
        elif visited_nodes is not None:
            if town in visited_nodes:
                node_colors.append("#10b981")  # visited: emerald
                node_border_colors.append("#ecfdf5")
            else:
                node_colors.append("#334155")  # unvisited: slate
                node_border_colors.append("#64748b")
        else:
            node_colors.append("#1e293b")
            node_border_colors.append("#38bdf8")

    # 6. Draw Nodes
    nx.draw_networkx_nodes(
        G, pos, nodelist=graph.towns,
        ax=ax, node_color=node_colors, node_size=1100,
        edgecolors=node_border_colors, linewidths=2.2
    )

    # 7. Draw Node Labels
    nx.draw_networkx_labels(
        G, pos, ax=ax,
        font_size=10, font_weight="bold", font_color="#ffffff",
        font_family="sans-serif"
    )

    # 8. Draw Edge Cost Labels
    edge_labels = { (r.u, r.v): f"${r.cost:g}k" if r.cost.is_integer() else f"${r.cost}k" for r in graph.roads }
    
    # Custom colored label backgrounds depending on edge status
    nx.draw_networkx_edge_labels(
        G, pos, edge_labels=edge_labels, ax=ax,
        font_size=9, font_color="#f8fafc", font_weight="bold",
        bbox=dict(boxstyle="round,pad=0.25", fc="#1e293b", ec="#475569", lw=1.2, alpha=0.92)
    )

    ax.set_title(title, fontsize=13, fontweight="bold", color="#f8fafc", pad=12)
    ax.axis("off")
    plt.tight_layout()
    return fig
