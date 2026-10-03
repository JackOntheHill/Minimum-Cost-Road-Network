import { RoadNetworkGraph } from './graph.ts';
import { PrimResult, PrimStep, Road, CandidateCutEdge } from '../types.ts';

export function runPrim(graph: RoadNetworkGraph, startingTown?: string): PrimResult {
  const towns = [...graph.towns];
  const n = towns.length;

  if (n === 0) {
    const step: PrimStep = {
      stepNumber: 0,
      visitedTowns: [],
      unvisitedTowns: [],
      mstRoads: [],
      candidateCutEdges: [],
      consideredEdge: null,
      actionType: 'FINISHED',
      description: 'The road network contains 0 towns. Empty MST created.',
      runningCost: 0,
      reason: 'Network is empty.',
    };
    return {
      success: true,
      mstRoads: [],
      totalCost: 0,
      steps: [step],
      startingTown: '',
      edgesConsideredCount: 0,
    };
  }

  if (n === 1) {
    const single = towns[0];
    const step: PrimStep = {
      stepNumber: 0,
      visitedTowns: [single],
      unvisitedTowns: [],
      mstRoads: [],
      candidateCutEdges: [],
      consideredEdge: null,
      actionType: 'FINISHED',
      description: `Only 1 town '${single}' exists. A single town needs 0 roads to be connected.`,
      runningCost: 0,
      reason: 'Trivial tree with 1 vertex and 0 edges.',
    };
    return {
      success: true,
      mstRoads: [],
      totalCost: 0,
      steps: [step],
      startingTown: single,
      edgesConsideredCount: 0,
    };
  }

  const seed = startingTown && towns.includes(startingTown) ? startingTown : towns[0];
  const visited = new Set<string>([seed]);
  const unvisited = new Set<string>(towns.filter((t) => t !== seed));
  const mstRoads: Road[] = [];
  let runningCost = 0;
  const steps: PrimStep[] = [];

  // Step 0: Initialization
  steps.push({
    stepNumber: 0,
    visitedTowns: Array.from(visited).sort(),
    unvisitedTowns: Array.from(unvisited).sort(),
    mstRoads: [],
    candidateCutEdges: [],
    consideredEdge: null,
    actionType: 'INIT',
    description: `Initialized Prim's algorithm at seed town '${seed}'. Visited: {${seed}}, Unvisited: {${Array.from(unvisited).sort().join(', ')}}.`,
    runningCost: 0,
    reason: `Prim begins by planting a single tree seed at starting town '${seed}'.`,
  });

  let stepCounter = 1;
  let edgesEvaluated = 0;

  while (visited.size < n) {
    // Collect all cut edges crossing between visited and unvisited sets
    const rawCandidates: {
      road: Road;
      inTown: string;
      outTown: string;
      cost: number;
    }[] = [];

    for (const road of graph.roads) {
      const uIn = visited.has(road.u);
      const vIn = visited.has(road.v);

      if ((uIn && !vIn) || (vIn && !uIn)) {
        rawCandidates.push({
          road,
          inTown: uIn ? road.u : road.v,
          outTown: uIn ? road.v : road.u,
          cost: road.cost,
        });
      }
    }

    // Disconnected graph detection
    if (rawCandidates.length === 0) {
      const errorMsg = `Graph is disconnected! After connecting ${visited.size} towns (${Array.from(visited).sort().join(', ')}), there are no remaining roads that lead to the unreachable towns: ${Array.from(unvisited).sort().join(', ')}. A complete Minimum Spanning Tree cannot be constructed.`;
      steps.push({
        stepNumber: stepCounter,
        visitedTowns: Array.from(visited).sort(),
        unvisitedTowns: Array.from(unvisited).sort(),
        mstRoads: [...mstRoads],
        candidateCutEdges: [],
        consideredEdge: null,
        actionType: 'DISCONNECTED_ERROR',
        description: errorMsg,
        runningCost,
        reason: 'Cut property failed: no road crosses the boundary between visited and unvisited towns.',
      });

      return {
        success: false,
        mstRoads,
        totalCost: runningCost,
        steps,
        startingTown: seed,
        errorMessage: errorMsg,
        edgesConsideredCount: edgesEvaluated,
      };
    }

    // Sort candidate cut edges by cost ascending
    rawCandidates.sort(
      (a, b) => a.cost - b.cost || a.road.u.localeCompare(b.road.u) || a.road.v.localeCompare(b.road.v)
    );

    const winner = rawCandidates[0];
    edgesEvaluated += rawCandidates.length;

    const candidateSummary: CandidateCutEdge[] = rawCandidates.map((c, i) => ({
      road: c.road,
      inTown: c.inTown,
      outTown: c.outTown,
      cost: c.cost,
      status: i === 0 ? 'selected' : 'deferred',
      reason:
        i === 0
          ? `Cheapest cut edge ($${c.cost}k). Adds new town '${c.outTown}' to MST.`
          : `Higher cost ($${c.cost}k). Deferred for future consideration.`,
    }));

    mstRoads.push(winner.road);
    runningCost += winner.cost;
    visited.add(winner.outTown);
    unvisited.delete(winner.outTown);

    const reason = `Prim examined ${rawCandidates.length} boundary cut road(s). The cheapest road is '${winner.road.u} <--> ${winner.road.v}' with cost $${winner.cost}k. Adding this road attaches unvisited town '${winner.outTown}' to the MST tree without creating a cycle.`;

    steps.push({
      stepNumber: stepCounter,
      visitedTowns: Array.from(visited).sort(),
      unvisitedTowns: Array.from(unvisited).sort(),
      mstRoads: [...mstRoads],
      candidateCutEdges: candidateSummary,
      consideredEdge: winner.road,
      actionType: 'EDGE_SELECTED',
      description: `Step ${stepCounter}: Selected road '${winner.road.u} <--> ${winner.road.v}' (cost $${winner.cost}k). Added '${winner.outTown}' to MST tree.`,
      runningCost,
      reason,
    });

    stepCounter++;
  }

  // Completion Step
  steps.push({
    stepNumber: stepCounter,
    visitedTowns: Array.from(visited).sort(),
    unvisitedTowns: [],
    mstRoads: [...mstRoads],
    candidateCutEdges: [],
    consideredEdge: null,
    actionType: 'FINISHED',
    description: `Prim's algorithm finished successfully! Connected all ${n} towns using ${mstRoads.length} roads with total minimum cost $${runningCost}k.`,
    runningCost,
    reason: `All ${n} towns have been included into the single expanding tree with exactly ${n - 1} roads.`,
  });

  return {
    success: true,
    mstRoads,
    totalCost: runningCost,
    steps,
    startingTown: seed,
    edgesConsideredCount: edgesEvaluated,
  };
}
