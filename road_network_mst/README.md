# Minimum Cost Road Network — College DAA Interactive Laboratory

An interactive educational laboratory designed to teach, demonstrate, and compare:
1. **Prim's Algorithm** (Single growing tree from seed vertex, cut-property evaluation)
2. **Kruskal's Algorithm** (Global greedy edge sorting, forest joining, cycle prevention)
3. **Disjoint Set Union (DSU / Union-Find)** (Manual implementation with Path Compression & Union by Rank)

---

## Project Structure

```text
road_network_mst/
├── graph.py            # RoadNetwork and Road classes, validation, connectivity check
├── disjoint_set.py     # DisjointSet with path compression, union by rank, and snapshot tracking
├── prim.py             # Prim's algorithm implementation with step-by-step trace
├── kruskal.py          # Kruskal's algorithm implementation with step-by-step trace
├── visualization.py    # Deterministic graph visualizer using NetworkX and Matplotlib
├── datasets.py         # Preset networks (Small Village, City, Equal-Cost, Disconnected, Random)
├── utils.py            # Metric comparisons and undergraduate complexity explanations
├── test_mst.py         # Complete automated test suite
├── app.py              # Streamlit interactive web application
├── requirements.txt    # Project dependencies
└── README.md           # Instructions and documentation
```

---

## Quickstart Instructions

### 1. Requirements
Ensure Python 3.8+ is installed. Install the dependencies:

```bash
pip install -r requirements.txt
```

### 2. Run Automated Verification Tests
Run the 11 unit tests covering single vertices, triangles, cycles, equal weights, disconnected networks, and DSU operations:

```bash
python3 test_mst.py
```

### 3. Launch the Streamlit Web Application
Launch the visual interactive interface:

```bash
streamlit run app.py
```

---

## Theoretical Complexity Summary

| Algorithm / Structure | Time Complexity | Space Complexity | Best Applied To |
| :--- | :--- | :--- | :--- |
| **Prim's Algorithm** | $O(E \log V)$ | $O(V + E)$ | Dense networks where $E \approx V^2$ |
| **Kruskal's Algorithm** | $O(E \log E) \equiv O(E \log V)$ | $O(V + E)$ | Sparse networks where $E \ll V^2$ |
| **Disjoint Set Union (DSU)** | $O(\alpha(V))$ amortized | $O(V)$ | Fast cycle detection and dynamic equivalence |
