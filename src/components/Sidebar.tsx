import React, { useState } from 'react';
import { RoadNetworkGraph } from '../algorithms/graph.ts';
import { AlgorithmType } from '../types.ts';
import {
  Layers,
  PlusCircle,
  Trash2,
  Edit3,
  Shuffle,
  RotateCcw,
  Sparkles,
  AlertCircle,
  FileCode,
  MapPin,
  Route,
  Compass,
} from 'lucide-react';

interface SidebarProps {
  graph: RoadNetworkGraph;
  selectedAlgo: AlgorithmType;
  setSelectedAlgo: (algo: AlgorithmType) => void;
  primStartTown: string;
  setPrimStartTown: (town: string) => void;
  onLoadPreset: (name: string) => void;
  onGenerateRandom: (townsCount: number, extraRoads: number, seed: number) => void;
  onAddTown: (name: string) => void;
  onRemoveTown: (name: string) => void;
  onAddRoad: (u: string, v: string, cost: number) => void;
  onUpdateRoadCost: (u: string, v: string, cost: number) => void;
  onRemoveRoad: (u: string, v: string) => void;
  onResetSteps: () => void;
  onOpenPythonModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  graph,
  selectedAlgo,
  setSelectedAlgo,
  primStartTown,
  setPrimStartTown,
  onLoadPreset,
  onGenerateRandom,
  onAddTown,
  onRemoveTown,
  onAddRoad,
  onUpdateRoadCost,
  onRemoveRoad,
  onResetSteps,
  onOpenPythonModal,
}) => {
  // Local form states
  const [newTownName, setNewTownName] = useState('');
  const [selectedRemoveTown, setSelectedRemoveTown] = useState('');
  const [roadFrom, setRoadFrom] = useState('');
  const [roadTo, setRoadTo] = useState('');
  const [roadCost, setRoadCost] = useState('5.0');
  const [activeTab, setActiveTab] = useState<'presets' | 'manage'>('presets');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Random generator inputs
  const [randomTownsCount, setRandomTownsCount] = useState(6);
  const [randomExtraRoads, setRandomExtraRoads] = useState(3);

  const showNotification = (msg: string, isError: boolean) => {
    if (isError) {
      setErrorMessage(msg);
      setSuccessMessage(null);
    } else {
      setSuccessMessage(msg);
      setErrorMessage(null);
    }
    setTimeout(() => {
      setErrorMessage(null);
      setSuccessMessage(null);
    }, 4000);
  };

  const handleAddTownSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onAddTown(newTownName);
      showNotification(`Added town '${newTownName}'.`, false);
      setNewTownName('');
    } catch (err: any) {
      showNotification(err.message || 'Error adding town', true);
    }
  };

  const handleRemoveTownSubmit = () => {
    if (!selectedRemoveTown) return;
    try {
      onRemoveTown(selectedRemoveTown);
      showNotification(`Removed town '${selectedRemoveTown}'.`, false);
      setSelectedRemoveTown('');
    } catch (err: any) {
      showNotification(err.message || 'Error removing town', true);
    }
  };

  const handleAddRoadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costNum = parseFloat(roadCost);
    if (!roadFrom || !roadTo) {
      showNotification('Please select both towns.', true);
      return;
    }
    try {
      onAddRoad(roadFrom, roadTo, costNum);
      showNotification(`Added road between ${roadFrom} & ${roadTo} ($${costNum}k).`, false);
    } catch (err: any) {
      showNotification(err.message || 'Error adding road', true);
    }
  };

  const handleUpdateRoadCostSubmit = () => {
    const costNum = parseFloat(roadCost);
    if (!roadFrom || !roadTo) {
      showNotification('Please select both towns.', true);
      return;
    }
    try {
      onUpdateRoadCost(roadFrom, roadTo, costNum);
      showNotification(`Updated road cost to $${costNum}k.`, false);
    } catch (err: any) {
      showNotification(err.message || 'Error updating road', true);
    }
  };

  const handleRemoveRoadSubmit = () => {
    if (!roadFrom || !roadTo) {
      showNotification('Please select both towns.', true);
      return;
    }
    try {
      onRemoveRoad(roadFrom, roadTo);
      showNotification(`Removed road between ${roadFrom} and ${roadTo}.`, false);
    } catch (err: any) {
      showNotification(err.message || 'Error removing road', true);
    }
  };

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-slate-900/95 border-r border-slate-800 p-4 space-y-5 text-slate-200 overflow-y-auto max-h-screen">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-slate-100 uppercase">Road Network</h1>
            <span className="text-[11px] font-mono text-sky-400">MST Laboratory</span>
          </div>
        </div>
        <button
          onClick={onOpenPythonModal}
          className="flex items-center space-x-1 px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition shadow-sm"
          title="Inspect Python & Streamlit Code"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Python</span>
        </button>
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-start space-x-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 1. Algorithm Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>1. Algorithm</span>
        </label>
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => {
              setSelectedAlgo('prim');
              onResetSteps();
            }}
            className={`py-1.5 px-2 rounded-lg transition text-center ${
              selectedAlgo === 'prim'
                ? 'bg-sky-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Prim's
          </button>
          <button
            onClick={() => {
              setSelectedAlgo('kruskal');
              onResetSteps();
            }}
            className={`py-1.5 px-2 rounded-lg transition text-center ${
              selectedAlgo === 'kruskal'
                ? 'bg-sky-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kruskal's
          </button>
          <button
            onClick={() => {
              setSelectedAlgo('compare');
              onResetSteps();
            }}
            className={`py-1.5 px-2 rounded-lg transition text-center ${
              selectedAlgo === 'compare'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Compare
          </button>
        </div>
      </div>

      {/* Prim Starting Town Selector */}
      {selectedAlgo !== 'kruskal' && graph.towns.length > 0 && (
        <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Prim's Starting Seed Town:</span>
            <span className="font-mono text-emerald-400 font-bold">{primStartTown}</span>
          </label>
          <select
            value={primStartTown}
            onChange={(e) => {
              setPrimStartTown(e.target.value);
              onResetSteps();
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            {graph.towns.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs: Presets vs Graph Editor */}
      <div className="flex border-b border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 pb-2 border-b-2 transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'presets'
              ? 'border-sky-500 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Presets</span>
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex-1 pb-2 border-b-2 transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'manage'
              ? 'border-sky-500 text-sky-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Graph</span>
        </button>
      </div>

      {/* PRESETS TAB */}
      {activeTab === 'presets' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 text-xs">
            <button
              onClick={() => onLoadPreset('small_village')}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between group"
            >
              <div>
                <div className="font-semibold text-slate-200 group-hover:text-sky-300">Small Village</div>
                <div className="text-[11px] text-slate-400">5 towns, 7 roads (clear cycles)</div>
              </div>
              <span className="text-[10px] font-mono bg-sky-950 text-sky-400 px-2 py-0.5 rounded border border-sky-800">
                5 towns
              </span>
            </button>

            <button
              onClick={() => onLoadPreset('city_network')}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between group"
            >
              <div>
                <div className="font-semibold text-slate-200 group-hover:text-sky-300">City Network</div>
                <div className="text-[11px] text-slate-400">8 regional towns, 13 roads</div>
              </div>
              <span className="text-[10px] font-mono bg-purple-950 text-purple-400 px-2 py-0.5 rounded border border-purple-800">
                8 towns
              </span>
            </button>

            <button
              onClick={() => onLoadPreset('equal_cost')}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between group"
            >
              <div>
                <div className="font-semibold text-slate-200 group-hover:text-sky-300">Equal-Cost Network</div>
                <div className="text-[11px] text-slate-400">Ties demonstration (alternative MSTs)</div>
              </div>
              <span className="text-[10px] font-mono bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800">
                Ties
              </span>
            </button>

            <button
              onClick={() => onLoadPreset('disconnected')}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between group"
            >
              <div>
                <div className="font-semibold text-rose-300 group-hover:text-rose-200">Disconnected Network</div>
                <div className="text-[11px] text-slate-400">6 towns, 2 isolated clusters</div>
              </div>
              <span className="text-[10px] font-mono bg-rose-950 text-rose-400 px-2 py-0.5 rounded border border-rose-800">
                Error demo
              </span>
            </button>
          </div>

          {/* Random Network Generator */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
            <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <Shuffle className="w-3.5 h-3.5 text-sky-400" />
              <span>Random Graph Generator</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Towns count:</span>
                <span className="font-mono text-sky-400">{randomTownsCount}</span>
              </div>
              <input
                type="range"
                min="4"
                max="8"
                value={randomTownsCount}
                onChange={(e) => setRandomTownsCount(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Extra cross roads:</span>
                <span className="font-mono text-sky-400">{randomExtraRoads}</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                value={randomExtraRoads}
                onChange={(e) => setRandomExtraRoads(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
            <button
              onClick={() => onGenerateRandom(randomTownsCount, randomExtraRoads, Date.now())}
              className="w-full py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition shadow-sm flex items-center justify-center space-x-1.5"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Generate Random</span>
            </button>
          </div>
        </div>
      )}

      {/* GRAPH EDITOR TAB */}
      {activeTab === 'manage' && (
        <div className="space-y-4 text-xs">
          {/* Add Town */}
          <form onSubmit={handleAddTownSubmit} className="space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add New Town</span>
            </label>
            <div className="flex space-x-1.5">
              <input
                type="text"
                placeholder="Town Name (e.g. Hilltop)"
                value={newTownName}
                onChange={(e) => setNewTownName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition"
              >
                Add
              </button>
            </div>
          </form>

          {/* Remove Town */}
          {graph.towns.length > 0 && (
            <div className="space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Remove Town</span>
              </label>
              <div className="flex space-x-1.5">
                <select
                  value={selectedRemoveTown}
                  onChange={(e) => setSelectedRemoveTown(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Select town to delete...</option>
                  {graph.towns.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleRemoveTownSubmit}
                  disabled={!selectedRemoveTown}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-lg font-medium transition"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Add / Update / Remove Road */}
          {graph.towns.length >= 2 ? (
            <form onSubmit={handleAddRoadSubmit} className="space-y-2.5 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <label className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Route className="w-3.5 h-3.5 text-sky-400" />
                <span>Manage Roads</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">Town 1</span>
                  <select
                    value={roadFrom || graph.towns[0]}
                    onChange={(e) => setRoadFrom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    {graph.towns.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Town 2</span>
                  <select
                    value={roadTo || graph.towns[1] || ''}
                    onChange={(e) => setRoadTo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    {graph.towns.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400">Construction Cost ($k)</span>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={roadCost}
                  onChange={(e) => setRoadCost(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-1 pt-1">
                <button
                  type="submit"
                  className="py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition text-center"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={handleUpdateRoadCostSubmit}
                  className="py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition text-center"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={handleRemoveRoadSubmit}
                  className="py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium transition text-center"
                >
                  Remove
                </button>
              </div>
            </form>
          ) : (
            <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
              Add at least 2 towns to configure road connections.
            </div>
          )}
        </div>
      )}

      {/* Reset button at bottom */}
      <div className="pt-2 border-t border-slate-800">
        <button
          onClick={onResetSteps}
          className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition flex items-center justify-center space-x-1.5 border border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Step Playback</span>
        </button>
      </div>
    </aside>
  );
};
