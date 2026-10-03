import { RoadNetworkGraph } from './graph.ts';
import { KruskalResult, KruskalStep, Road } from '../types.ts';
import { DisjointSet } from './dsu.ts';

export function runKruskal(graph: RoadNetworkGraph): KruskalResult {
  const towns = [...graph.towns];
  const n = towns.length;

  if (n === 0) {
    const dsu = new DisjointSet([]);
    const step0: KruskalStep = {
      stepNumber: 0,
      consideredEdge: null,
      status: 'FINISHED',
      reason: 'Empty network with 0 towns and 0 roads.',
      mstRoads: [],
      runningCost: 0,
      dsuSnapshot: dsu.getSnapshot(),
      edgeIndex: 0,
      totalCandidateEdges: 0,
    };
    return {
      success: true,
      mstRoads: [],
      totalCost: 0,
      steps: [step0],
      edgesConsideredCount: 0,
      edgesRejectedCount: 0,
    };
  }

  if (n === 1) {
    const dsu = new DisjointSet(towns);
    const step0: KruskalStep = {
      stepNumber: 0,
      consideredEdge: null,
      status: 'FINISHED',
      reason: `Single town '${towns[0]}' requires 0 roads to be connected.`,
      mstRoads: [],
      runningCost: 0,
      dsuSnapshot: dsu.getSnapshot(),
      edgeIndex: 0,
      totalCandidateEdges: 0,
    };
    return {
      success: true,
      mstRoads: [],
      totalCost: 0,
      steps: [step0],
      edgesConsideredCount: 0,
      edgesRejectedCount: 0,
    };
  }

  // 1. Sort all candidate roads by ascending cost (tie-break alphabetically)
  const sortedRoads: Road[] = [...graph.roads].sort(
    (a, b) => a.cost - b.cost || a.u.localeCompare(b.u) || a.v.localeCompare(b.v)
  );
  const totalCandidateEdges = sortedRoads.length;

  // 2. Initialize Disjoint Set
  const dsu = new DisjointSet(towns);
  const mstRoads: Road[] = [];
  let runningCost = 0;
  const steps: KruskalStep[] = [];
  let consideredCount = 0;
  let rejectedCount = 0;

  // Step 0: Initialization
  steps.push({
    stepNumber: 0,
    consideredEdge: null,
    status: 'INIT',
    reason: `Initialized Disjoint Set for all ${n} towns. Sorted all ${totalCandidateEdges} candidate roads by increasing cost. Initial components: ${dsu.formatComponentsDisplay()}.`,
    mstRoads: [],
    runningCost: 0,
    dsuSnapshot: dsu.getSnapshot(),
    edgeIndex: 0,
    totalCandidateEdges,
  });

  let stepCounter = 1;

  // 3. Process edges in ascending order of cost
  for (let idx = 0; idx < sortedRoads.length; idx++) {
    const road = sortedRoads[idx];
    consideredCount++;

    const rootU = dsu.find(road.u);
    const rootV = dsu.find(road.v);

    if (rootU !== rootV) {
      // Different components -> Merge & Add
      dsu.union(road.u, road.v);
      mstRoads.push(road);
      runningCost += road.cost;

      const reason = `Road '${road.u} <--> ${road.v}' (cost $${road.cost}k) connects two separate components: [${rootU}] and [${rootV}]. Unifying them merges the components without creating a cycle. Road ACCEPTED into MST.`;

      steps.push({
        stepNumber: stepCounter,
        consideredEdge: road,
        status: 'SELECTED',
        reason,
        mstRoads: [...mstRoads],
        runningCost,
        dsuSnapshot: dsu.getSnapshot(),
        edgeIndex: idx + 1,
        totalCandidateEdges,
      });
      stepCounter++;

      // Stop once V - 1 edges are reached
      if (mstRoads.length === n - 1) {
        break;
      }
    } else {
      // Same component -> Cycle detected! Reject
      rejectedCount++;
      const reason = `Road '${road.u} <--> ${road.v}' (cost $${road.cost}k) connects towns that ALREADY belong to the same component (both share root '${rootU}'). Adding this road would form a redundant CYCLE. Road REJECTED.`;

      steps.push({
        stepNumber: stepCounter,
        consideredEdge: road,
        status: 'REJECTED_CYCLE',
        reason,
        mstRoads: [...mstRoads],
        runningCost,
        dsuSnapshot: dsu.getSnapshot(),
        edgeIndex: idx + 1,
        totalCandidateEdges,
      });
      stepCounter++;
    }
  }

  // 4. Verify whether all towns are connected (V - 1 edges)
  if (mstRoads.length < n - 1) {
    const errorMsg = `Graph is disconnected! Kruskal's algorithm evaluated all ${totalCandidateEdges} candidate roads but was only able to construct ${mstRoads.length} valid roads out of the ${n - 1} required to connect ${n} towns. Final components: ${dsu.formatComponentsDisplay()}.`;

    steps.push({
      stepNumber: stepCounter,
      consideredEdge: null,
      status: 'DISCONNECTED_ERROR',
      reason: errorMsg,
      mstRoads: [...mstRoads],
      runningCost,
      dsuSnapshot: dsu.getSnapshot(),
      edgeIndex: totalCandidateEdges,
      totalCandidateEdges,
    });

    return {
      success: false,
      mstRoads,
      totalCost: runningCost,
      steps,
      edgesConsideredCount: consideredCount,
      edgesRejectedCount: rejectedCount,
      errorMessage: errorMsg,
    };
  }

  // Final Step
  steps.push({
    stepNumber: stepCounter,
    consideredEdge: null,
    status: 'FINISHED',
    reason: `Kruskal's algorithm successfully connected all ${n} towns into a single component (${dsu.formatComponentsDisplay()}) using exactly ${mstRoads.length} roads (V - 1 = ${n - 1}) with minimum total cost $${runningCost}k.`,
    mstRoads: [...mstRoads],
    runningCost,
    dsuSnapshot: dsu.getSnapshot(),
    edgeIndex: consideredCount,
    totalCandidateEdges,
  });

  return {
    success: true,
    mstRoads,
    totalCost: runningCost,
    steps,
    edgesConsideredCount: consideredCount,
    edgesRejectedCount: rejectedCount,
  };
}
