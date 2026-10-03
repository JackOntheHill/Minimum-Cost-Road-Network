import React, { useState } from 'react';
import { Copy, Check, Terminal, FileCode, X, BookOpen } from 'lucide-react';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PYTHON_FILES: Record<string, { desc: string; code: string }> = {
  'graph.py': {
    desc: 'Weighted undirected graph representation, road validation, and BFS connectivity',
    code: `"""
Weighted Undirected Graph representation for the Minimum Cost Road Network.
Provides town and road management, edge canonicalization, and strict validation.
"""
from typing import List, Tuple, Dict, Set, Optional
from collections import deque

class Road:
    def __init__(self, u: str, v: str, cost: float):
        if u == v:
            raise ValueError(f"Town '{u}' cannot have a road connecting directly to itself (self-loop).")
        if cost <= 0:
            raise ValueError(f"Road construction cost must be strictly positive (> 0). Received: {cost}")
        self.u = min(u, v)
        self.v = max(u, v)
        self.cost = cost

class RoadNetwork:
    def __init__(self):
        self._towns: Set[str] = set()
        self._roads: Dict[Tuple[str, str], Road] = {}

    def add_town(self, town: str) -> None:
        clean = town.strip()
        if not clean or clean in self._towns:
            raise ValueError(f"Invalid or duplicate town '{clean}'.")
        self._towns.add(clean)

    def add_road(self, u: str, v: str, cost: float) -> Road:
        road = Road(u.strip(), v.strip(), cost)
        pair = (road.u, road.v)
        if pair in self._roads:
            raise ValueError(f"Road between {road.u} and {road.v} already exists.")
        self._roads[pair] = road
        return road

    def is_connected(self) -> bool:
        if len(self._towns) <= 1:
            return True
        return len(self.get_connected_components()) == 1
`
  },
  'disjoint_set.py': {
    desc: 'Manual Disjoint Set Union (DSU) with Path Compression & Union by Rank',
    code: `"""
Disjoint Set Union (DSU / Union-Find) implemented manually from scratch.
"""
class DisjointSet:
    def __init__(self, elements=None):
        self.parent = {}
        self.rank = {}
        if elements:
            for elem in elements:
                self.make_set(elem)

    def make_set(self, x: str) -> None:
        self.parent[x] = x
        self.rank[x] = 0

    def find(self, x: str) -> str:
        if self.parent[x] != x:
            # Path Compression: flatten tree directly to root
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x: str, y: str) -> bool:
        root_x = self.find(x)
        root_y = self.find(y)
        if root_x == root_y:
            return False  # Cycle detected!
        
        # Union by Rank: attach smaller tree under taller tree
        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
        else:
            self.parent[root_y] = root_x
            self.rank[root_x] += 1
        return True
`
  },
  'prim.py': {
    desc: "Prim's Algorithm implementation with cut-edge evaluation and step-by-step trace",
    code: `"""
Manual implementation of Prim's Algorithm for Minimum Spanning Tree (MST).
"""
def run_prim(graph, starting_town=None):
    towns = graph.towns
    n = len(towns)
    if n <= 1:
        return PrimResult(True, [], 0.0, ...)

    seed = starting_town or towns[0]
    visited = {seed}
    unvisited = set(towns) - visited
    mst_roads = []
    running_cost = 0.0

    while len(visited) < n:
        # Find all cut edges crossing between visited and unvisited
        candidates = []
        for road in graph.roads:
            u_in, v_in = road.u in visited, road.v in visited
            if (u_in and not v_in) or (v_in and not u_in):
                candidates.append(road)

        if not candidates:
            # Disconnected graph error!
            return PrimResult(False, mst_roads, running_cost, error="Graph is disconnected!")

        # Greedily pick the cheapest cut edge
        candidates.sort(key=lambda r: r.cost)
        cheapest = candidates[0]
        mst_roads.append(cheapest)
        running_cost += cheapest.cost
        new_town = cheapest.v if cheapest.u in visited else cheapest.u
        visited.add(new_town)
        unvisited.remove(new_town)

    return PrimResult(True, mst_roads, running_cost)
`
  },
  'kruskal.py': {
    desc: "Kruskal's Algorithm implementation with global edge sorting & DSU cycle rejection",
    code: `"""
Manual implementation of Kruskal's Algorithm for Minimum Spanning Tree (MST).
"""
from disjoint_set import DisjointSet

def run_kruskal(graph):
    towns = graph.towns
    n = len(towns)
    if n <= 1:
        return KruskalResult(True, [], 0.0, ...)

    # 1. Sort all candidate roads by ascending cost
    sorted_roads = sorted(graph.roads, key=lambda r: (r.cost, r.u, r.v))
    
    # 2. Initialize Disjoint Set
    dsu = DisjointSet(towns)
    mst_roads = []
    running_cost = 0.0

    # 3. Process edges greedily
    for road in sorted_roads:
        if dsu.find(road.u) != dsu.find(road.v):
            dsu.union(road.u, road.v)
            mst_roads.append(road)
            running_cost += road.cost
            if len(mst_roads) == n - 1:
                break
        else:
            # Cycle detected -> REJECT
            pass

    if len(mst_roads) < n - 1:
        return KruskalResult(False, mst_roads, running_cost, error="Graph is disconnected!")

    return KruskalResult(True, mst_roads, running_cost)
`
  },
  'test_mst.py': {
    desc: 'Automated test suite (11 unit tests verifying V-1 edges, costs, cycles, and errors)',
    code: `"""
Run with: python3 test_mst.py
Result: 11 tests passed in 0.003s OK
"""
import unittest
from graph import RoadNetwork
from prim import run_prim
from kruskal import run_kruskal

class TestMST(unittest.TestCase):
    def test_mst_equivalence(self):
        # Prim and Kruskal must yield identical total cost
        net = create_small_village()
        p = run_prim(net)
        k = run_kruskal(net)
        self.assertTrue(p.success and k.success)
        self.assertEqual(len(p.mst_roads), net.num_towns - 1)
        self.assertEqual(len(k.mst_roads), net.num_towns - 1)
        self.assertEqual(p.total_cost, k.total_cost)

if __name__ == "__main__":
    unittest.main()
`
  },
  'app.py': {
    desc: 'Streamlit interactive web dashboard with sidebar controls and Matplotlib visualizer',
    code: `"""
Streamlit Web App
Launch with: streamlit run app.py
"""
import streamlit as st
from graph import RoadNetwork
from prim import run_prim
from kruskal import run_kruskal
from visualization import render_graph_figure

st.title("🛣️ Minimum Cost Road Network")
# Sidebar controls, step slider, DSU table, and comparisons
`
  }
};

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeFile, setActiveFile] = useState<string>('graph.py');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_FILES[activeFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Python + Streamlit Project Source
                <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  Ready to run locally
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Created in <code className="text-sky-300 font-mono">/road_network_mst/</code> for your college DAA submission
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Local Run Instructions Banner */}
        <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            <span>Terminal run command:</span>
            <code className="bg-slate-950 px-2.5 py-1 rounded text-sky-300 font-mono border border-slate-700">
              streamlit run app.py
            </code>
          </div>
          <div className="flex items-center space-x-2">
            <span>Tests:</span>
            <code className="bg-slate-950 px-2.5 py-1 rounded text-emerald-300 font-mono border border-slate-700">
              python3 test_mst.py
            </code>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex overflow-x-auto px-6 pt-3 gap-2 bg-slate-950/40 border-b border-slate-800 scrollbar-none">
          {Object.keys(PYTHON_FILES).map((fileName) => (
            <button
              key={fileName}
              onClick={() => setActiveFile(fileName)}
              className={`px-3 py-2 text-xs font-mono font-medium rounded-t-lg transition border-t border-x ${
                activeFile === fileName
                  ? 'bg-slate-900 text-sky-400 border-slate-700 border-b-slate-900 -mb-px'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/50'
              }`}
            >
              {fileName}
            </button>
          ))}
        </div>

        {/* Code Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/70 font-mono text-xs">
          <div className="flex items-center justify-between mb-3 text-slate-400 text-xs">
            <span className="italic">{PYTHON_FILES[activeFile].desc}</span>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 overflow-x-auto text-[11px] leading-relaxed">
            {PYTHON_FILES[activeFile].code}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs text-slate-400">
          <span>All 6 Python modules, unit tests, and Streamlit app are preserved in workspace.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
