"""
Minimum Cost Road Network - Streamlit Web Application
Interactive DAA college-level prototype for demonstrating and comparing
Prim's Algorithm, Kruskal's Algorithm, and Disjoint Set Union (DSU).
"""

import streamlit as st
import pandas as pd
from graph import RoadNetwork, Road
from disjoint_set import DisjointSet
from prim import run_prim
from kruskal import run_kruskal
from visualization import compute_fixed_layout, render_graph_figure
from datasets import (
    DATASET_PRESETS,
    generate_random_network,
    create_small_village,
    create_city_network,
    create_equal_cost_network,
    create_disconnected_network
)
from utils import compare_algorithms, get_complexity_guide, get_conceptual_comparison_text

# Configure page
st.set_page_config(
    page_title="Minimum Cost Road Network",
    page_icon="🛣️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize Session State
if "graph" not in st.session_state:
    st.session_state.graph = create_small_village()
    st.session_state.pos = compute_fixed_layout(st.session_state.graph)
    st.session_state.dataset_name = "Small Village (5 Towns)"
    st.session_state.step_idx = 0
    st.session_state.selected_algo = "Prim's Algorithm"
    st.session_state.prim_start_town = st.session_state.graph.towns[0]

# Helper function to reload dataset
def load_preset(name: str):
    if name == "Small Village (5 Towns)":
        st.session_state.graph = create_small_village()
    elif name == "City Network (8 Towns)":
        st.session_state.graph = create_city_network()
    elif name == "Equal-Cost Network (Ties)":
        st.session_state.graph = create_equal_cost_network()
    elif name == "Disconnected Network (Error Demo)":
        st.session_state.graph = create_disconnected_network()
    st.session_state.pos = compute_fixed_layout(st.session_state.graph)
    st.session_state.step_idx = 0
    if st.session_state.graph.towns:
        st.session_state.prim_start_town = st.session_state.graph.towns[0]


# ---------------- SIDEBAR ----------------
with st.sidebar:
    st.header("⚙️ Network Configuration")

    # 1. Dataset Selection
    st.subheader("1. Preset Datasets")
    preset_choice = st.selectbox(
        "Choose Road Network:",
        options=list(DATASET_PRESETS.keys()) + ["Random Connected Network"],
        index=0
    )

    if preset_choice != "Random Connected Network":
        if st.button("📥 Load Preset", use_container_width=True):
            load_preset(preset_choice)
            st.session_state.dataset_name = preset_choice
            st.success(f"Loaded {preset_choice}!")
    else:
        num_t = st.slider("Towns count", 4, 10, 6)
        extra_r = st.slider("Cross roads", 1, 8, 3)
        seed_val = st.number_input("Random Seed", value=42, step=1)
        if st.button("🎲 Generate Random Network", use_container_width=True):
            st.session_state.graph = generate_random_network(num_t, extra_r, seed=seed_val)
            st.session_state.pos = compute_fixed_layout(st.session_state.graph)
            st.session_state.step_idx = 0
            if st.session_state.graph.towns:
                st.session_state.prim_start_town = st.session_state.graph.towns[0]
            st.success("Generated random network!")

    st.divider()

    # 2. Add / Remove Towns
    st.subheader("2. Manage Towns")
    with st.expander("Add / Remove Towns"):
        new_town_name = st.text_input("New Town Name (e.g. Haven)")
        if st.button("➕ Add Town", use_container_width=True):
            try:
                st.session_state.graph.add_town(new_town_name)
                st.session_state.pos = compute_fixed_layout(st.session_state.graph)
                st.session_state.step_idx = 0
                st.success(f"Added town '{new_town_name}'.")
                st.rerun()
            except ValueError as e:
                st.error(str(e))

        if st.session_state.graph.towns:
            rem_town = st.selectbox("Select Town to Remove", options=st.session_state.graph.towns)
            if st.button("🗑️ Remove Town", use_container_width=True):
                try:
                    st.session_state.graph.remove_town(rem_town)
                    st.session_state.pos = compute_fixed_layout(st.session_state.graph)
                    st.session_state.step_idx = 0
                    st.warning(f"Removed town '{rem_town}'.")
                    st.rerun()
                except ValueError as e:
                    st.error(str(e))

    # 3. Add / Remove / Update Roads
    st.subheader("3. Manage Roads")
    with st.expander("Add / Remove / Edit Roads"):
        towns_list = st.session_state.graph.towns
        if len(towns_list) >= 2:
            col_u, col_v = st.columns(2)
            with col_u:
                u_sel = st.selectbox("From Town", options=towns_list, key="road_u")
            with col_v:
                v_sel = st.selectbox("To Town", options=[t for t in towns_list if t != u_sel], key="road_v")
            r_cost = st.number_input("Construction Cost ($k)", min_value=0.5, value=5.0, step=0.5)

            if st.button("➕ Add Road", use_container_width=True):
                try:
                    st.session_state.graph.add_road(u_sel, v_sel, r_cost)
                    st.session_state.step_idx = 0
                    st.success(f"Added road {u_sel} - {v_sel} (${r_cost}k).")
                    st.rerun()
                except ValueError as e:
                    st.error(str(e))

            if st.button("✏️ Update Road Cost", use_container_width=True):
                try:
                    st.session_state.graph.update_road_cost(u_sel, v_sel, r_cost)
                    st.session_state.step_idx = 0
                    st.success(f"Updated road cost to ${r_cost}k.")
                    st.rerun()
                except ValueError as e:
                    st.error(str(e))

            if st.button("🗑️ Remove Road", use_container_width=True):
                try:
                    st.session_state.graph.remove_road(u_sel, v_sel)
                    st.session_state.step_idx = 0
                    st.warning(f"Removed road {u_sel} - {v_sel}.")
                    st.rerun()
                except ValueError as e:
                    st.error(str(e))
        else:
            st.info("Add at least 2 towns to create roads.")

    st.divider()

    # 4. Algorithm Selection
    st.subheader("4. Algorithm & Execution")
    algo_choice = st.radio(
        "Select Algorithm to Explore:",
        options=["Prim's Algorithm", "Kruskal's Algorithm", "Compare Both"],
        index=0
    )
    st.session_state.selected_algo = algo_choice

    if algo_choice in ["Prim's Algorithm", "Compare Both"] and st.session_state.graph.towns:
        current_start = st.session_state.prim_start_town if st.session_state.prim_start_town in st.session_state.graph.towns else st.session_state.graph.towns[0]
        start_town_sel = st.selectbox(
            "Prim's Starting Town:",
            options=st.session_state.graph.towns,
            index=st.session_state.graph.towns.index(current_start)
        )
        if start_town_sel != st.session_state.prim_start_town:
            st.session_state.prim_start_town = start_town_sel
            st.session_state.step_idx = 0

    if st.button("🔄 Reset / Start From Step 0", use_container_width=True):
        st.session_state.step_idx = 0
        st.rerun()


# ---------------- MAIN PAGE ----------------
st.title("🛣️ Minimum Cost Road Network")
st.markdown(
    "**DAA Laboratory**: Given a set of towns and potential road connections with construction costs, "
    "determine the minimum-cost set of roads to connect every town. Interactive trace of **Prim's Algorithm**, "
    "**Kruskal's Algorithm**, and **Disjoint Set Union (DSU)**."
)

graph = st.session_state.graph
pos = st.session_state.pos

# Run algorithms
prim_result = run_prim(graph, starting_town=st.session_state.get("prim_start_town", None))
kruskal_result = run_kruskal(graph)

# Choose active algorithm steps for visualizer
if st.session_state.selected_algo == "Prim's Algorithm":
    active_result = prim_result
    steps = prim_result.steps
elif st.session_state.selected_algo == "Kruskal's Algorithm":
    active_result = kruskal_result
    steps = kruskal_result.steps
else:
    # Compare both mode default to Kruskal for step scrubber
    active_result = kruskal_result
    steps = kruskal_result.steps

# Clamp step_idx
total_steps = len(steps)
st.session_state.step_idx = max(0, min(st.session_state.step_idx, total_steps - 1))
curr_step = steps[st.session_state.step_idx]

# ==================== SECTION 1 ====================
st.header("1. Input Road Network")

col1, col2, col3, col4, col5 = st.columns(5)
with col1:
    st.metric("Towns (V)", graph.num_towns)
with col2:
    st.metric("Candidate Roads (E)", graph.num_roads)
with col3:
    st.metric("Target MST Roads (V - 1)", max(0, graph.num_towns - 1))
with col4:
    st.metric("Total Candidate Cost", f"${graph.total_network_cost():g}k")
with col5:
    is_conn = graph.is_connected()
    st.metric("Connectivity", "✅ Connected" if is_conn else "❌ Disconnected")

with st.expander("📋 View All Candidate Roads Table"):
    if graph.roads:
        df_roads = pd.DataFrame([
            {"Town A": r.u, "Town B": r.v, "Cost ($k)": r.cost}
            for r in graph.roads
        ])
        st.dataframe(df_roads, use_container_width=True)
    else:
        st.info("No roads currently defined.")


# ==================== SECTION 2 & 3 ====================
col_vis, col_ctrl = st.columns([1.3, 1.0])

with col_ctrl:
    st.header("3. Algorithm Execution Controls")

    # Step Navigation Buttons
    bcol1, bcol2, bcol3, bcol4 = st.columns(4)
    with bcol1:
        if st.button("⏮️ Start", use_container_width=True):
            st.session_state.step_idx = 0
            st.rerun()
    with bcol2:
        if st.button("◀️ Prev", use_container_width=True):
            if st.session_state.step_idx > 0:
                st.session_state.step_idx -= 1
                st.rerun()
    with bcol3:
        if st.button("Next ▶️", use_container_width=True):
            if st.session_state.step_idx < total_steps - 1:
                st.session_state.step_idx += 1
                st.rerun()
    with bcol4:
        if st.button("Final ⏭️", use_container_width=True):
            st.session_state.step_idx = total_steps - 1
            st.rerun()

    step_slider = st.slider(
        f"Step Scrubber (0 to {total_steps - 1})",
        min_value=0,
        max_value=max(0, total_steps - 1),
        value=st.session_state.step_idx,
        key="step_slider_input"
    )
    if step_slider != st.session_state.step_idx:
        st.session_state.step_idx = step_slider
        st.rerun()

    # Status Badge
    status_color = "#3b82f6"
    status_text = "INITIALIZATION"
    if st.session_state.selected_algo == "Prim's Algorithm":
        if curr_step.action_type == "EDGE_SELECTED":
            status_color = "#10b981"
            status_text = "ROAD SELECTED INTO MST"
        elif curr_step.action_type == "DISCONNECTED_ERROR":
            status_color = "#ef4444"
            status_text = "DISCONNECTED GRAPH ERROR"
        elif curr_step.action_type == "FINISHED":
            status_color = "#8b5cf6"
            status_text = "ALGORITHM COMPLETED"
    else:
        if curr_step.status == "SELECTED":
            status_color = "#10b981"
            status_text = "ROAD SELECTED INTO MST"
        elif curr_step.status == "REJECTED_CYCLE":
            status_color = "#ef4444"
            status_text = "CYCLE DETECTED - ROAD REJECTED"
        elif curr_step.status == "DISCONNECTED_ERROR":
            status_color = "#ef4444"
            status_text = "DISCONNECTED GRAPH ERROR"
        elif curr_step.status == "FINISHED":
            status_color = "#8b5cf6"
            status_text = "ALGORITHM COMPLETED"

    st.markdown(
        f"<div style='background-color: {status_color}; color: white; padding: 10px; border-radius: 8px; font-weight: bold; text-align: center; margin-bottom: 12px;'>"
        f"Step {st.session_state.step_idx} of {total_steps - 1}: {status_text}</div>",
        unsafe_allow_html=True
    )

    st.metric("Running MST Cost", f"${curr_step.running_cost:g}k")

with col_vis:
    st.header("2. Graph Visualization")

    # Extract visualization highlights from current step
    selected_tuples = [(r.u, r.v) for r in curr_step.mst_roads]
    considered_tuple = (curr_step.considered_edge.u, curr_step.considered_edge.v) if curr_step.considered_edge else None
    
    # Track rejected roads up to current step
    rejected_tuples = []
    if st.session_state.selected_algo == "Kruskal's Algorithm" or st.session_state.selected_algo == "Compare Both":
        for s in steps[:st.session_state.step_idx + 1]:
            if getattr(s, "status", "") == "REJECTED_CYCLE" and s.considered_edge:
                rejected_tuples.append((s.considered_edge.u, s.considered_edge.v))

    visited_nodes = getattr(curr_step, "visited_towns", None)
    
    # For Kruskal, compute node colors by component
    node_comp_map = None
    if st.session_state.selected_algo != "Prim's Algorithm" and hasattr(curr_step, "dsu_snapshot"):
        dsu_comps = curr_step.dsu_snapshot["components"]
        node_comp_map = {}
        for idx, (root, members) in enumerate(dsu_comps.items()):
            for m in members:
                node_comp_map[m] = idx

    fig = render_graph_figure(
        graph=graph,
        pos=pos,
        selected_edges=selected_tuples,
        considered_edge=considered_tuple,
        rejected_edges=rejected_tuples,
        visited_nodes=visited_nodes,
        node_component_map=node_comp_map,
        title=f"{st.session_state.selected_algo} — Step {st.session_state.step_idx}/{total_steps - 1}"
    )
    st.pyplot(fig, use_container_width=True)

    st.markdown(
        "<div style='font-size: 13px; text-align: center; color: #94a3b8;'>"
        "🟢 <b style='color:#10b981'>Green:</b> Selected MST Roads &nbsp;|&nbsp; "
        "🟡 <b style='color:#f59e0b'>Amber:</b> Currently Considered &nbsp;|&nbsp; "
        "🔴 <b style='color:#ef4444'>Red Dashed:</b> Rejected Cycle Roads &nbsp;|&nbsp; "
        "⚪ <b style='color:#94a3b8'>Gray:</b> Unprocessed Roads"
        "</div>",
        unsafe_allow_html=True
    )


# ==================== SECTION 4 ====================
st.header("4. Step-by-Step Educational Explanation")

if st.session_state.selected_algo == "Prim's Algorithm":
    st.info(f"**Step Description:** {curr_step.description}")
    st.markdown(f"**Why this action occurred:** {curr_step.reason}")

    c1, c2 = st.columns(2)
    with c1:
        st.markdown(f"**Towns Inside MST Tree ({len(curr_step.visited_towns)}):**")
        st.code(", ".join(curr_step.visited_towns) if curr_step.visited_towns else "None")
    with c2:
        st.markdown(f"**Towns Outside MST ({len(curr_step.unvisited_towns)}):**")
        st.code(", ".join(curr_step.unvisited_towns) if curr_step.unvisited_towns else "All towns connected!")

    if curr_step.candidate_cut_edges:
        st.markdown("**Candidate Boundary Roads Evaluated in this Step:**")
        df_cut = pd.DataFrame(curr_step.candidate_cut_edges)
        st.dataframe(df_cut, use_container_width=True)

else:
    # Kruskal / DSU explanation
    st.info(f"**Step Rationale:** {curr_step.reason}")

    if hasattr(curr_step, "dsu_snapshot"):
        st.subheader("Disjoint Set Union (DSU / Union-Find) Internal State")
        st.markdown(f"**Connected Components Representation:** `{curr_step.dsu_snapshot['display_str']}`")

        dsu_table = []
        for town in graph.towns:
            parent = curr_step.dsu_snapshot["parent"].get(town, town)
            rank = curr_step.dsu_snapshot["rank"].get(town, 0)
            dsu_table.append({
                "Town": town,
                "Parent Pointer in DSU": parent,
                "Rank (Subtree Depth Bound)": rank,
                "Is Root Representative?": "✅ Yes" if parent == town else "❌ No (Child)"
            })
        st.dataframe(pd.DataFrame(dsu_table), use_container_width=True)


# ==================== SECTION 5 ====================
st.header("5. Final Minimum Spanning Tree (MST)")

if not active_result.success:
    st.error(f"❌ **Algorithm Error:** {active_result.error_message}")
else:
    mc1, mc2, mc3, mc4 = st.columns(4)
    with mc1:
        st.metric("Total Optimal Cost", f"${active_result.total_cost:g}k")
    with mc2:
        st.metric("Roads in MST", f"{len(active_result.mst_roads)} / {graph.num_towns - 1}")
    with mc3:
        savings = round((graph.total_network_cost() - active_result.total_cost) / graph.total_network_cost() * 100, 1) if graph.total_network_cost() > 0 else 0
        st.metric("Budget Savings vs All Roads", f"{savings}%")
    with mc4:
        st.metric("Network Status", "Optimal & Connected")

    mst_df = pd.DataFrame([
        {"Road #": idx + 1, "Town A": r.u, "Town B": r.v, "Cost ($k)": r.cost}
        for idx, r in enumerate(active_result.mst_roads)
    ])
    st.dataframe(mst_df, use_container_width=True)

    # Correctness Checklist
    st.markdown("### Correctness Verification Checklist")
    chk1 = len(active_result.mst_roads) == max(0, graph.num_towns - 1)
    chk2 = active_result.success
    chk3 = abs(prim_result.total_cost - kruskal_result.total_cost) < 1e-6 if (prim_result.success and kruskal_result.success) else False

    st.write(f"- {'✅' if chk1 else '❌'} Contains exactly $V - 1$ edges: **{len(active_result.mst_roads)} edges** (Target: {graph.num_towns - 1})")
    st.write(f"- {'✅' if chk2 else '❌'} Completely connects all towns without isolating any vertex.")
    st.write(f"- {'✅' if chk3 else '❌'} Prim and Kruskal find identical minimum cost: **${active_result.total_cost:g}k**")


# ==================== SECTION 6 ====================
st.header("6. Prim vs Kruskal Comparison")

comp_data = compare_algorithms(graph, prim_result, kruskal_result)

col_t1, col_t2 = st.columns(2)
with col_t1:
    st.subheader("📊 Metric Comparison Table")
    summary_df = pd.DataFrame([
        {"Metric": "Optimal MST Cost", "Prim's Algorithm": f"${prim_result.total_cost:g}k", "Kruskal's Algorithm": f"${kruskal_result.total_cost:g}k"},
        {"Metric": "Edges in Final MST", "Prim's Algorithm": len(prim_result.mst_roads), "Kruskal's Algorithm": len(kruskal_result.mst_roads)},
        {"Metric": "Edges Evaluated", "Prim's Algorithm": prim_result.edges_considered_count, "Kruskal's Algorithm": kruskal_result.edges_considered_count},
        {"Metric": "Edges Rejected (Cycles)", "Prim's Algorithm": "N/A (Cut edges only)", "Kruskal's Algorithm": kruskal_result.edges_rejected_count},
        {"Metric": "Total Trace Steps", "Prim's Algorithm": prim_result.steps_count, "Kruskal's Algorithm": kruskal_result.steps_count},
        {"Metric": "Budget Savings", "Prim's Algorithm": f"{comp_data['prim']['cost_savings_pct']}%", "Kruskal's Algorithm": f"{comp_data['kruskal']['cost_savings_pct']}%"},
    ])
    st.dataframe(summary_df, use_container_width=True)

with col_t2:
    st.subheader("💡 Conceptual Differences")
    st.markdown(get_conceptual_comparison_text())

st.divider()

# Complexity Section
st.subheader("⏱️ Theoretical Complexity Analysis (for Engineering Students)")
complexities = get_complexity_guide()
c_col1, c_col2, c_col3 = st.columns(3)

with c_col1:
    st.markdown("### 🌲 Prim's Algorithm")
    st.markdown(f"**Time Complexity:** `{complexities[\"Prim's Algorithm\"]['time_complexity']}`")
    st.markdown(f"**Space Complexity:** `{complexities[\"Prim's Algorithm\"]['space_complexity']}`")
    st.caption(complexities["Prim's Algorithm"]["mechanism"])
    st.info(f"**Intuition:** {complexities[\"Prim's Algorithm\"]['first_year_analogy']}")

with c_col2:
    st.markdown("### 🔗 Kruskal's Algorithm")
    st.markdown(f"**Time Complexity:** `{complexities[\"Kruskal's Algorithm\"]['time_complexity']}`")
    st.markdown(f"**Space Complexity:** `{complexities[\"Kruskal's Algorithm\"]['space_complexity']}`")
    st.caption(complexities["Kruskal's Algorithm"]["mechanism"])
    st.info(f"**Intuition:** {complexities[\"Kruskal's Algorithm\"]['first_year_analogy']}")

with c_col3:
    st.markdown("### 🧩 Disjoint Set Union (DSU)")
    st.markdown(f"**Time Complexity:** `{complexities[\"Disjoint Set Union (DSU)\"]['time_complexity']}`")
    st.markdown(f"**Space Complexity:** `{complexities[\"Disjoint Set Union (DSU)\"]['space_complexity']}`")
    st.caption(complexities["Disjoint Set Union (DSU)"]["mechanism"])
    st.info(f"**Intuition:** {complexities[\"Disjoint Set Union (DSU)\"]['first_year_analogy']}")
