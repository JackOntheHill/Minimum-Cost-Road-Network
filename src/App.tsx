import React, { useState, useEffect, useRef } from 'react';
import { RoadNetworkGraph, getSmallVillagePreset, getCityNetworkPreset, getEqualCostPreset, getDisconnectedPreset, getRandomPreset } from './algorithms/graph.ts';
import { runPrim } from './algorithms/prim.ts';
import { runKruskal } from './algorithms/kruskal.ts';
import { GraphCanvas } from './components/GraphCanvas.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { PythonCodeModal } from './components/PythonCodeModal.tsx';
import { AlgorithmType, Road } from './types.ts';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Network,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
  Clock,
  HelpCircle,
  ShieldCheck,
  Check,
  X,
  FileCode,
} from 'lucide-react';

export default function App() {
  // Graph State
  const [graph, setGraph] = useState<RoadNetworkGraph>(() => getSmallVillagePreset());
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType>('prim');
  const [primStartTown, setPrimStartTown] = useState<string>(() => graph.towns[0] || 'Meadowbrook');

  // Step Execution State
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // 1000ms = 1x

  // Modal State
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);

  // Compute Algorithms
  const primResult = runPrim(graph, primStartTown);
  const kruskalResult = runKruskal(graph);

  // Active steps based on selected algorithm
  const activeResult = selectedAlgo === 'prim' ? primResult : kruskalResult;
  const activeSteps = activeResult.steps;
  const maxStep = Math.max(0, activeSteps.length - 1);
  const currentStep = activeSteps[Math.min(stepIndex, maxStep)];

  // Auto-play timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= maxStep) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, maxStep, playbackSpeed]);

  // Reset steps when graph or starting town changes
  const resetSteps = () => {
    setStepIndex(0);
    setIsPlaying(false);
  };

  // Handlers for Preset Loading
  const handleLoadPreset = (name: string) => {
    let newG: RoadNetworkGraph;
    if (name === 'small_village') newG = getSmallVillagePreset();
    else if (name === 'city_network') newG = getCityNetworkPreset();
    else if (name === 'equal_cost') newG = getEqualCostPreset();
    else if (name === 'disconnected') newG = getDisconnectedPreset();
    else newG = getSmallVillagePreset();

    setGraph(newG);
    if (newG.towns.length > 0) {
      setPrimStartTown(newG.towns[0]);
    }
    resetSteps();
  };

  const handleGenerateRandom = (townsCount: number, extraRoads: number, seed: number) => {
    const newG = getRandomPreset(townsCount, extraRoads, seed);
    setGraph(newG);
    if (newG.towns.length > 0) {
      setPrimStartTown(newG.towns[0]);
    }
    resetSteps();
  };

  const handleAddTown = (name: string) => {
    const newG = graph.clone();
    newG.addTown(name);
    setGraph(newG);
    resetSteps();
  };

  const handleRemoveTown = (name: string) => {
    const newG = graph.clone();
    newG.removeTown(name);
    setGraph(newG);
    if (primStartTown === name && newG.towns.length > 0) {
      setPrimStartTown(newG.towns[0]);
    }
    resetSteps();
  };

  const handleAddRoad = (u: string, v: string, cost: number) => {
    const newG = graph.clone();
    newG.addRoad(u, v, cost);
    setGraph(newG);
    resetSteps();
  };

  const handleUpdateRoadCost = (u: string, v: string, cost: number) => {
    const newG = graph.clone();
    newG.updateRoadCost(u, v, cost);
    setGraph(newG);
    resetSteps();
  };

  const handleRemoveRoad = (u: string, v: string) => {
    const newG = graph.clone();
    newG.removeRoad(u, v);
    setGraph(newG);
    resetSteps();
  };

  const handleUpdatePosition = (town: string, x: number, y: number) => {
    const newG = graph.clone();
    newG.positions[town] = { x, y };
    setGraph(newG);
  };

  // Helper values for current step display
  const isPrimMode = selectedAlgo === 'prim';
  const selectedRoadsSoFar: Road[] = currentStep ? currentStep.mstRoads : [];
  const consideredRoad: Road | null = currentStep ? currentStep.consideredEdge : null;

  // Track rejected cycle roads for Kruskal up to current step
  const rejectedRoadsSoFar: Road[] = [];
  if (!isPrimMode) {
    for (let i = 0; i <= Math.min(stepIndex, maxStep); i++) {
      const s: any = kruskalResult.steps[i];
      if (s && s.status === 'REJECTED_CYCLE' && s.consideredEdge) {
        rejectedRoadsSoFar.push(s.consideredEdge);
      }
    }
  }

  // Budget calculations
  const totalCandidateCost = graph.totalCost();
  const primSavings = totalCandidateCost > 0 ? Math.round(((totalCandidateCost - primResult.totalCost) / totalCandidateCost) * 100) : 0;
  const kruskalSavings = totalCandidateCost > 0 ? Math.round(((totalCandidateCost - kruskalResult.totalCost) / totalCandidateCost) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* SIDEBAR */}
      <Sidebar
        graph={graph}
        selectedAlgo={selectedAlgo}
        setSelectedAlgo={setSelectedAlgo}
        primStartTown={primStartTown}
        setPrimStartTown={setPrimStartTown}
        onLoadPreset={handleLoadPreset}
        onGenerateRandom={handleGenerateRandom}
        onAddTown={handleAddTown}
        onRemoveTown={handleRemoveTown}
        onAddRoad={handleAddRoad}
        onUpdateRoadCost={handleUpdateRoadCost}
        onRemoveRoad={handleRemoveRoad}
        onResetSteps={resetSteps}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* APP HEADER */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-medium text-sky-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span>DESIGN & ANALYSIS OF ALGORITHMS (DAA)</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-50 tracking-tight">
              Minimum Cost Road Network
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Connecting towns with minimum construction cost. Interactive comparison of{' '}
              <strong className="text-sky-300">Prim's</strong>,{' '}
              <strong className="text-indigo-300">Kruskal's</strong>, and{' '}
              <strong className="text-emerald-300">Disjoint Set Union (DSU)</strong>.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPythonModalOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition shadow-sm"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Python Source Code</span>
            </button>
          </div>
        </header>

        {/* ============================================================== */}
        {/* SECTION 1: INPUT ROAD NETWORK */}
        {/* ============================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono">
                1
              </span>
              <span>Input Road Network</span>
            </h2>
            <div className="text-xs font-mono text-slate-400">
              Undirected Weighted Graph: G = (V, E)
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Towns (V)</span>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{graph.towns.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Vertices in network</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Candidate Roads (E)</span>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{graph.roads.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Possible connections</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target MST Roads</span>
              <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                {Math.max(0, graph.towns.length - 1)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Formula: V - 1 edges</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Candidate Cost</span>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">${totalCandidateCost}k</div>
              <div className="text-[11px] text-slate-400 mt-0.5">If all roads were built</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Connectivity Status</span>
              <div className="flex items-center space-x-1.5 mt-2">
                {graph.isConnected() ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span className="text-sm font-bold text-rose-400">Disconnected</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {graph.getConnectedComponents().length} component(s)
              </div>
            </div>
          </div>

          {/* Collapsible Roads Table */}
          <details className="group bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden transition">
            <summary className="px-4 py-2.5 cursor-pointer font-medium text-xs text-slate-300 flex items-center justify-between hover:bg-slate-800/40 select-none">
              <div className="flex items-center space-x-2">
                <Network className="w-4 h-4 text-sky-400" />
                <span>View Candidate Roads List ({graph.roads.length} edges sorted by cost)</span>
              </div>
              <span className="text-[11px] font-mono text-sky-400 group-open:rotate-180 transition-transform">
                ▼
              </span>
            </summary>
            <div className="p-4 border-t border-slate-800 max-h-56 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-mono">
                {graph.roads.map((r, i) => (
                  <div
                    key={`${r.u}-${r.v}-${i}`}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <span className="text-slate-200">
                      {r.u} ↔ {r.v}
                    </span>
                    <span className="font-bold text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/60">
                      ${r.cost}k
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </section>

        {/* ============================================================== */}
        {/* SECTION 2 & 3: GRAPH VISUALIZATION & EXECUTION CONTROLS */}
        {/* ============================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Section 2: Canvas Visualizer (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono">
                  2
                </span>
                <span>Graph Visualization</span>
              </h2>
              <div className="text-xs font-mono text-slate-400">
                Current View:{' '}
                <span className="text-sky-300 font-semibold">
                  {selectedAlgo === 'prim' ? "Prim's Algorithm" : selectedAlgo === 'kruskal' ? "Kruskal's Algorithm" : 'Comparison'}
                </span>
              </div>
            </div>

            <GraphCanvas
              graph={graph}
              selectedRoads={selectedRoadsSoFar}
              consideredRoad={consideredRoad}
              rejectedRoads={rejectedRoadsSoFar}
              visitedTowns={currentStep ? (currentStep as any).visitedTowns : undefined}
              dsuSnapshot={currentStep ? (currentStep as any).dsuSnapshot : undefined}
              isPrim={isPrimMode}
              onUpdatePosition={handleUpdatePosition}
              width={720}
              height={440}
            />
          </div>

          {/* Section 3: Execution Controls (4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono">
                  3
                </span>
                <span>Algorithm Execution</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">
                Step {stepIndex} / {maxStep}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
              {/* Status Badge */}
              {(() => {
                let badgeBg = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
                let badgeText = 'INITIALIZATION';

                if (currentStep) {
                  if (isPrimMode) {
                    const action = (currentStep as any).actionType;
                    if (action === 'EDGE_SELECTED') {
                      badgeBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
                      badgeText = 'ROAD SELECTED INTO MST';
                    } else if (action === 'DISCONNECTED_ERROR') {
                      badgeBg = 'bg-rose-500/15 text-rose-400 border-rose-500/40';
                      badgeText = 'DISCONNECTED GRAPH ERROR';
                    } else if (action === 'FINISHED') {
                      badgeBg = 'bg-purple-500/15 text-purple-400 border-purple-500/40';
                      badgeText = 'ALGORITHM COMPLETED';
                    }
                  } else {
                    const status = (currentStep as any).status;
                    if (status === 'SELECTED') {
                      badgeBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
                      badgeText = 'ROAD SELECTED INTO MST';
                    } else if (status === 'REJECTED_CYCLE') {
                      badgeBg = 'bg-rose-500/15 text-rose-400 border-rose-500/40';
                      badgeText = 'CYCLE DETECTED - ROAD REJECTED';
                    } else if (status === 'DISCONNECTED_ERROR') {
                      badgeBg = 'bg-rose-500/15 text-rose-400 border-rose-500/40';
                      badgeText = 'DISCONNECTED GRAPH ERROR';
                    } else if (status === 'FINISHED') {
                      badgeBg = 'bg-purple-500/15 text-purple-400 border-purple-500/40';
                      badgeText = 'ALGORITHM COMPLETED';
                    }
                  }
                }

                return (
                  <div className={`p-3 rounded-xl border text-center font-bold text-xs tracking-wider uppercase ${badgeBg}`}>
                    {badgeText}
                  </div>
                );
              })()}

              {/* Running Cost Metric */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Current MST Cost:</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  ${currentStep ? currentStep.runningCost : 0}k
                </span>
              </div>

              {/* Scrubber Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>Step Scrubber</span>
                  <span className="font-mono text-sky-400">
                    {stepIndex} / {maxStep}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxStep}
                  value={stepIndex}
                  onChange={(e) => {
                    setStepIndex(parseInt(e.target.value));
                    setIsPlaying(false);
                  }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>

              {/* Playback Button Controls */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                <button
                  onClick={() => {
                    setStepIndex(0);
                    setIsPlaying(false);
                  }}
                  title="Jump to Start"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center justify-center border border-slate-700"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (stepIndex > 0) setStepIndex((prev) => prev - 1);
                    setIsPlaying(false);
                  }}
                  disabled={stepIndex <= 0}
                  title="Previous Step"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition flex items-center justify-center border border-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (stepIndex >= maxStep) setStepIndex(0);
                    setIsPlaying(!isPlaying);
                  }}
                  title={isPlaying ? 'Pause' : 'Play Step-by-Step'}
                  className={`p-2.5 rounded-xl font-bold transition flex items-center justify-center border ${
                    isPlaying
                      ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500'
                      : 'bg-sky-600 hover:bg-sky-500 text-white border-sky-500'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <button
                  onClick={() => {
                    if (stepIndex < maxStep) setStepIndex((prev) => prev + 1);
                    setIsPlaying(false);
                  }}
                  disabled={stepIndex >= maxStep}
                  title="Next Step"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition flex items-center justify-center border border-slate-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setStepIndex(maxStep);
                    setIsPlaying(false);
                  }}
                  title="Jump to Final MST"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center justify-center border border-slate-700"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Speed Selector */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span>Playback Speed:</span>
                <div className="flex space-x-1">
                  {[
                    { label: '0.5x', ms: 1600 },
                    { label: '1x', ms: 1000 },
                    { label: '2x', ms: 500 },
                  ].map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setPlaybackSpeed(s.ms)}
                      className={`px-2 py-1 rounded text-[11px] font-mono transition ${
                        playbackSpeed === s.ms
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 4: STEP-BY-STEP EXPLANATION */}
        {/* ============================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono">
                4
              </span>
              <span>Step-by-Step Educational Explanation</span>
            </h2>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Visible Algorithmic Decisions</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Primary Step Description */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                <span>Explain This Step (Plain English)</span>
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">
                {currentStep ? currentStep.reason : 'Select a step above to inspect algorithmic reasoning.'}
              </p>
            </div>

            {/* PRIM SPECIFIC TRACE */}
            {isPrimMode && currentStep && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="font-semibold text-emerald-400 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Towns Inside Growing Tree ({(currentStep as any).visitedTowns.length})</span>
                    </span>
                    <div className="font-mono text-slate-200 bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                      {(currentStep as any).visitedTowns.join(', ') || 'None'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="font-semibold text-slate-400 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      <span>Unvisited Towns Remaining ({(currentStep as any).unvisitedTowns.length})</span>
                    </span>
                    <div className="font-mono text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                      {(currentStep as any).unvisitedTowns.length > 0
                        ? (currentStep as any).unvisitedTowns.join(', ')
                        : 'All towns connected! 🎉'}
                    </div>
                  </div>
                </div>

                {/* Candidate Cut Edges Table */}
                {(currentStep as any).candidateCutEdges && (currentStep as any).candidateCutEdges.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-300">
                      Boundary Cut Roads Evaluated in Step {stepIndex}:
                    </span>
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-2.5">Road</th>
                            <th className="p-2.5">Cost</th>
                            <th className="p-2.5">Cut Direction</th>
                            <th className="p-2.5">Algorithmic Decision</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                          {(currentStep as any).candidateCutEdges.map((c: any, idx: number) => (
                            <tr
                              key={idx}
                              className={c.status === 'selected' ? 'bg-emerald-950/20 font-bold' : ''}
                            >
                              <td className="p-2.5 text-slate-200">
                                {c.road.u} ↔ {c.road.v}
                              </td>
                              <td className="p-2.5 text-amber-300">${c.cost}k</td>
                              <td className="p-2.5 text-slate-400">
                                {c.inTown} (in MST) → {c.outTown} (unvisited)
                              </td>
                              <td className="p-2.5">
                                {c.status === 'selected' ? (
                                  <span className="text-emerald-400 flex items-center space-x-1">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Selected (Cheapest Cut Road)</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Deferred (Higher cost)</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* KRUSKAL SPECIFIC TRACE & DSU VISUALIZER */}
            {!isPrimMode && currentStep && (currentStep as any).dsuSnapshot && (
              <div className="space-y-4">
                {/* DSU Visual Evolution String */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>DSU Connected Components Representation:</span>
                    </span>
                    <span className="font-mono text-indigo-400">
                      {(currentStep as any).dsuSnapshot.numComponents} disjoint set(s)
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-sm font-mono text-emerald-300 tracking-wider overflow-x-auto">
                    {(currentStep as any).dsuSnapshot.displayStr}
                  </div>
                </div>

                {/* DSU Internal State Table */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                    <span>Disjoint Set Internal Pointers & Ranks (Cycle Detection Mechanism):</span>
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Town Element</th>
                          <th className="p-2.5">Parent Pointer in DSU</th>
                          <th className="p-2.5">Rank (Depth Bound)</th>
                          <th className="p-2.5">Set Root Representative</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                        {graph.towns.map((town) => {
                          const parent = (currentStep as any).dsuSnapshot.parent[town] || town;
                          const rank = (currentStep as any).dsuSnapshot.rank[town] || 0;
                          const isRoot = parent === town;

                          return (
                            <tr key={town} className={isRoot ? 'bg-slate-800/20' : ''}>
                              <td className="p-2.5 font-bold text-slate-100">{town}</td>
                              <td className="p-2.5 text-sky-300">
                                parent[{town}] = {parent}
                              </td>
                              <td className="p-2.5 text-slate-300">{rank}</td>
                              <td className="p-2.5">
                                {isRoot ? (
                                  <span className="text-emerald-400 font-semibold">Root of component</span>
                                ) : (
                                  <span className="text-slate-400">Child (points to {parent})</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 5: FINAL MINIMUM SPANNING TREE (MST) */}
        {/* ============================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono">
                5
              </span>
              <span>Final Minimum Spanning Tree (MST)</span>
            </h2>
            <div className="text-xs font-mono text-emerald-400">
              Optimal Cost Solved
            </div>
          </div>

          {!activeResult.success ? (
            <div className="p-5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Disconnected Graph: No Minimum Spanning Tree Exists</span>
              </div>
              <p className="text-xs text-rose-300 leading-relaxed">
                {activeResult.errorMessage}
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Optimal Cost</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    ${activeResult.totalCost}k
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Roads Selected</span>
                  <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                    {activeResult.mstRoads.length} / {Math.max(0, graph.towns.length - 1)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Budget Savings</span>
                  <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                    {selectedAlgo === 'prim' ? primSavings : kruskalSavings}%
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Acyclic Guarantee</span>
                  <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                    0 Cycles
                  </div>
                </div>
              </div>

              {/* Final Road Table */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">
                  Selected Minimum-Cost Road Network:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs font-mono">
                  {activeResult.mstRoads.map((r, i) => (
                    <div
                      key={`final-${r.u}-${r.v}-${i}`}
                      className="p-2.5 rounded-xl bg-slate-950 border border-emerald-900/60 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-[10px] border border-emerald-800">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-slate-200">
                          {r.u} ↔ {r.v}
                        </span>
                      </div>
                      <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        ${r.cost}k
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Correctness Verification Checklist</span>
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Exact V - 1 edges: {activeResult.mstRoads.length} roads</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Every town reachable (connected)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Optimal minimal total cost: ${activeResult.totalCost}k</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ============================================================== */}
        {/* SECTION 6: PRIM VS KRUSKAL COMPARISON */}
        {/* ============================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono">
                6
              </span>
              <span>Prim vs Kruskal Comparison</span>
            </h2>
            <div className="text-xs font-mono text-slate-400">
              Comparative Algorithmic Benchmark
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-6">
            {/* Side-by-side Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Comparison Metric</th>
                    <th className="p-3 text-sky-400">Prim's Algorithm</th>
                    <th className="p-3 text-indigo-400">Kruskal's Algorithm</th>
                    <th className="p-3 text-slate-300">Conclusion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                  <tr>
                    <td className="p-3 font-semibold text-slate-200">Optimal MST Total Cost</td>
                    <td className="p-3 text-emerald-400 font-bold">${primResult.totalCost}k</td>
                    <td className="p-3 text-emerald-400 font-bold">${kruskalResult.totalCost}k</td>
                    <td className="p-3 text-slate-300">
                      {Math.abs(primResult.totalCost - kruskalResult.totalCost) < 1e-6 ? (
                        <span className="text-emerald-400">✓ Identical Optimal Cost</span>
                      ) : (
                        <span className="text-rose-400">Differing Cost</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-200">Roads in Final Tree</td>
                    <td className="p-3 text-slate-200">{primResult.mstRoads.length}</td>
                    <td className="p-3 text-slate-200">{kruskalResult.mstRoads.length}</td>
                    <td className="p-3 text-slate-300">Both produce exactly V - 1 roads</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-200">Candidate Edges Evaluated</td>
                    <td className="p-3 text-slate-200">{primResult.edgesConsideredCount}</td>
                    <td className="p-3 text-slate-200">{kruskalResult.edgesConsideredCount}</td>
                    <td className="p-3 text-slate-300">Prim tests cut boundary; Kruskal sorts all</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-200">Edges Rejected as Cycles</td>
                    <td className="p-3 text-slate-400">N/A (Implicit via cut)</td>
                    <td className="p-3 text-rose-400 font-bold">{kruskalResult.edgesRejectedCount} cycles</td>
                    <td className="p-3 text-slate-300">Kruskal explicitly rejects cycles via DSU</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-200">Total Steps Recorded</td>
                    <td className="p-3 text-slate-200">{primResult.steps.length}</td>
                    <td className="p-3 text-slate-200">{kruskalResult.steps.length}</td>
                    <td className="p-3 text-slate-300">
                      Kruskal steps = {kruskalResult.edgesConsideredCount} evaluated edges
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-200">Budget Savings %</td>
                    <td className="p-3 text-sky-400 font-bold">{primSavings}%</td>
                    <td className="p-3 text-indigo-400 font-bold">{kruskalSavings}%</td>
                    <td className="p-3 text-slate-300">Cost savings vs paving all candidate roads</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Conceptual Differences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="font-bold text-sky-400 text-sm flex items-center space-x-2">
                  <span>🌲 Prim's Strategy: Tree Growing</span>
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Prim's algorithm maintains a <strong>single connected component</strong> from the start. It grows outward from a seed town like a tree expanding its root network, always selecting the cheapest road crossing into unvisited territory. Cycles can never form because edges always connect a visited town to an unvisited town.
                </p>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-sky-300 font-mono">
                  Best when graph is dense (E ≈ V²).
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="font-bold text-indigo-400 text-sm flex items-center space-x-2">
                  <span>🔗 Kruskal's Strategy: Forest Joining</span>
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Kruskal's algorithm considers roads globally from cheapest to most expensive, ignoring town location. It maintains a <strong>forest of independent trees</strong> and joins them using Disjoint Set Union (DSU). An edge is rejected if both towns already share the same root in the DSU, which prevents cycles.
                </p>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-indigo-300 font-mono">
                  Best when graph is sparse (E ≪ V²).
                </div>
              </div>
            </div>

            {/* Theoretical Complexity Breakdown */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Theoretical Complexity Analysis (DAA Syllabus)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-200">Prim's Algorithm</div>
                  <div className="text-sm font-mono text-sky-400 font-bold">O(E log V)</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Using a binary min-heap / priority queue to extract the cheapest boundary cut edge.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-200">Kruskal's Algorithm</div>
                  <div className="text-sm font-mono text-indigo-400 font-bold">O(E log E) ≡ O(E log V)</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Dominated by sorting the E candidate edges upfront. DSU operations take near-linear time.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-200">Disjoint Set Union (DSU)</div>
                  <div className="text-sm font-mono text-emerald-400 font-bold">O(α(V)) amortized</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    With path compression & union by rank, α(V) is the Inverse Ackermann function (≤ 4 for all practical inputs).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="pt-6 pb-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            Minimum Cost Road Network • College DAA Educational Prototype
          </div>
          <div className="flex items-center space-x-3">
            <span>Python Files: <code className="text-slate-400 font-mono">/road_network_mst/</code></span>
            <span>•</span>
            <button
              onClick={() => setIsPythonModalOpen(true)}
              className="text-sky-400 hover:text-sky-300 underline font-mono"
            >
              View Code & Test Output
            </button>
          </div>
        </footer>
      </main>

      {/* PYTHON SOURCE CODE MODAL */}
      <PythonCodeModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />
    </div>
  );
}
