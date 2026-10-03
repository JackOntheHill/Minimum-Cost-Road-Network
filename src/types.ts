export interface Road {
  u: string;
  v: string;
  cost: number;
}

export interface TownNode {
  name: string;
  x: number;
  y: number;
}

export interface CandidateCutEdge {
  road: Road;
  inTown: string;
  outTown: string;
  cost: number;
  status: 'selected' | 'deferred' | 'skipped_internal';
  reason: string;
}

export interface PrimStep {
  stepNumber: number;
  visitedTowns: string[];
  unvisitedTowns: string[];
  mstRoads: Road[];
  candidateCutEdges: CandidateCutEdge[];
  consideredEdge: Road | null;
  actionType: 'INIT' | 'EDGE_SELECTED' | 'DISCONNECTED_ERROR' | 'FINISHED';
  description: string;
  runningCost: number;
  reason: string;
}

export interface PrimResult {
  success: boolean;
  mstRoads: Road[];
  totalCost: number;
  steps: PrimStep[];
  startingTown: string;
  errorMessage?: string;
  edgesConsideredCount: number;
}

export interface DSUSnapshot {
  parent: Record<string, string>;
  rank: Record<string, number>;
  components: Record<string, string[]>;
  displayStr: string;
  numComponents: number;
}

export interface KruskalStep {
  stepNumber: number;
  consideredEdge: Road | null;
  status: 'INIT' | 'SELECTED' | 'REJECTED_CYCLE' | 'DISCONNECTED_ERROR' | 'FINISHED';
  reason: string;
  mstRoads: Road[];
  runningCost: number;
  dsuSnapshot: DSUSnapshot;
  edgeIndex: number;
  totalCandidateEdges: number;
}

export interface KruskalResult {
  success: boolean;
  mstRoads: Road[];
  totalCost: number;
  steps: KruskalStep[];
  edgesConsideredCount: number;
  edgesRejectedCount: number;
  errorMessage?: string;
}

export type AlgorithmType = 'prim' | 'kruskal' | 'compare';
