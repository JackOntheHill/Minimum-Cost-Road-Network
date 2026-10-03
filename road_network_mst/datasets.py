"""
Predefined datasets and random generator for the Minimum Cost Road Network.
Includes:
- Small Village (5 towns, 7 roads)
- City Network (8 towns, 13 roads)
- Equal-Cost Network (demonstrating alternative MSTs with identical cost)
- Disconnected Network (demonstrating graph disconnection detection)
- Random Graph Generator
"""

import random
from graph import RoadNetwork


def create_small_village() -> RoadNetwork:
    """
    Small Village: 5 towns with 7 candidate roads.
    Clear cycles for demonstration.
    Towns: Meadowbrook, Oakdale, Pinecrest, Riverdale, Stonebridge
    """
    net = RoadNetwork()
    for t in ["Meadowbrook", "Oakdale", "Pinecrest", "Riverdale", "Stonebridge"]:
        net.add_town(t)

    net.add_road("Meadowbrook", "Oakdale", 4.0)
    net.add_road("Meadowbrook", "Stonebridge", 8.0)
    net.add_road("Oakdale", "Stonebridge", 11.0)
    net.add_road("Oakdale", "Pinecrest", 8.0)
    net.add_road("Pinecrest", "Riverdale", 2.0)
    net.add_road("Stonebridge", "Riverdale", 7.0)
    net.add_road("Stonebridge", "Pinecrest", 4.0)

    return net


def create_city_network() -> RoadNetwork:
    """
    City Network: 8 regional towns with 13 candidate roads and multiple cross-cutting cycles.
    Towns: A, B, C, D, E, F, G, H
    """
    net = RoadNetwork()
    towns = ["Avalon", "Bayview", "Crestwood", "Dunmore", "Eastwick", "Fairhaven", "Greenfield", "Hillcrest"]
    for t in towns:
        net.add_town(t)

    roads = [
        ("Avalon", "Bayview", 4.0),
        ("Avalon", "Eastwick", 8.0),
        ("Bayview", "Eastwick", 11.0),
        ("Bayview", "Crestwood", 8.0),
        ("Crestwood", "Dunmore", 7.0),
        ("Crestwood", "Hillcrest", 2.0),
        ("Crestwood", "Fairhaven", 4.0),
        ("Dunmore", "Hillcrest", 6.0),
        ("Dunmore", "Greenfield", 9.0),
        ("Eastwick", "Fairhaven", 1.0),
        ("Eastwick", "Greenfield", 7.0),
        ("Fairhaven", "Greenfield", 2.0),
        ("Greenfield", "Hillcrest", 10.0),
    ]

    for u, v, c in roads:
        net.add_road(u, v, c)

    return net


def create_equal_cost_network() -> RoadNetwork:
    """
    Equal-Cost Network: Demonstrates that when multiple edges share identical weights,
    Prim and Kruskal (or Prim with different start vertices) can choose different subsets of edges,
    yet both yield the exact same minimum total cost.
    Square with cross roads or diamond pattern.
    """
    net = RoadNetwork()
    towns = ["Northport", "Eastlake", "Southgate", "Westfield"]
    for t in towns:
        net.add_town(t)

    # 4 towns in a symmetric ring where each perimeter edge is 5.0, diagonal is 5.0
    net.add_road("Northport", "Eastlake", 5.0)
    net.add_road("Eastlake", "Southgate", 5.0)
    net.add_road("Southgate", "Westfield", 5.0)
    net.add_road("Westfield", "Northport", 5.0)
    net.add_road("Northport", "Southgate", 5.0)
    net.add_road("Eastlake", "Westfield", 7.0)

    return net


def create_disconnected_network() -> RoadNetwork:
    """
    Disconnected Network: 6 towns split into two unreachable clusters.
    Cluster 1: Alpha, Beta, Gamma
    Cluster 2: Delta, Epsilon, Zeta
    No roads bridge the two clusters.
    """
    net = RoadNetwork()
    towns = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"]
    for t in towns:
        net.add_town(t)

    # Cluster 1
    net.add_road("Alpha", "Beta", 3.0)
    net.add_road("Beta", "Gamma", 4.0)
    net.add_road("Alpha", "Gamma", 6.0)

    # Cluster 2
    net.add_road("Delta", "Epsilon", 5.0)
    net.add_road("Epsilon", "Zeta", 2.0)
    net.add_road("Delta", "Zeta", 7.0)

    return net


def generate_random_network(num_towns: int = 6, extra_roads: int = 3, seed: int = 42) -> RoadNetwork:
    """
    Generates a guaranteed-connected random graph by first building a random tree,
    then adding additional random cross roads to create cycles.
    """
    rng = random.Random(seed)
    net = RoadNetwork()
    town_names = [f"Town_{chr(65 + i)}" for i in range(min(num_towns, 26))]

    for t in town_names:
        net.add_town(t)

    # Build spanning backbone to guarantee connectivity
    available = [town_names[0]]
    remaining = town_names[1:]
    rng.shuffle(remaining)

    for target in remaining:
        source = rng.choice(available)
        cost = round(rng.uniform(2.0, 15.0), 1)
        net.add_road(source, target, cost)
        available.append(target)

    # Add extra random edges for interesting cycles
    all_possible_pairs = []
    for i in range(len(town_names)):
        for j in range(i + 1, len(town_names)):
            u, v = town_names[i], town_names[j]
            if net.get_road(u, v) is None:
                all_possible_pairs.append((u, v))

    rng.shuffle(all_possible_pairs)
    for u, v in all_possible_pairs[:extra_roads]:
        cost = round(rng.uniform(3.0, 20.0), 1)
        net.add_road(u, v, cost)

    return net


DATASET_PRESETS = {
    "Small Village (5 Towns)": create_small_village,
    "City Network (8 Towns)": create_city_network,
    "Equal-Cost Network (Ties)": create_equal_cost_network,
    "Disconnected Network (Error Demo)": create_disconnected_network,
}
