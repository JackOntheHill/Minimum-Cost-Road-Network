import { Road, TownNode } from '../types.ts';

export class RoadNetworkGraph {
  towns: string[];
  roads: Road[];
  positions: Record<string, { x: number; y: number }>;

  constructor() {
    this.towns = [];
    this.roads = [];
    this.positions = {};
  }

  static canonicalEdge(u: string, v: string): [string, string] {
    return u < v ? [u, v] : [v, u];
  }

  addTown(name: string, x?: number, y?: number): void {
    const clean = name.trim();
    if (!clean) {
      throw new Error('Town name cannot be empty.');
    }
    if (this.towns.includes(clean)) {
      throw new Error(`Town '${clean}' already exists in network.`);
    }
    this.towns.push(clean);
    this.towns.sort();

    // Default position if not provided
    if (x !== undefined && y !== undefined) {
      this.positions[clean] = { x, y };
    } else {
      this.recalculatePositions();
    }
  }

  removeTown(name: string): void {
    const clean = name.trim();
    if (!this.towns.includes(clean)) {
      throw new Error(`Town '${clean}' does not exist.`);
    }
    this.towns = this.towns.filter((t) => t !== clean);
    this.roads = this.roads.filter((r) => r.u !== clean && r.v !== clean);
    delete this.positions[clean];
    this.recalculatePositions();
  }

  addRoad(u: string, v: string, cost: number): Road {
    const uClean = u.trim();
    const vClean = v.trim();

    if (uClean === vClean) {
      throw new Error(`Town '${uClean}' cannot have a road connecting directly to itself (self-loop).`);
    }
    if (cost <= 0 || isNaN(cost)) {
      throw new Error(`Road construction cost must be strictly positive (> 0). Received: ${cost}`);
    }
    if (!this.towns.includes(uClean)) {
      throw new Error(`Source town '${uClean}' does not exist.`);
    }
    if (!this.towns.includes(vClean)) {
      throw new Error(`Destination town '${vClean}' does not exist.`);
    }

    const [canonU, canonV] = RoadNetworkGraph.canonicalEdge(uClean, vClean);
    const existing = this.roads.find((r) => r.u === canonU && r.v === canonV);
    if (existing) {
      throw new Error(
        `Road between '${canonU}' and '${canonV}' already exists with cost $${existing.cost}k. Use update cost instead.`
      );
    }

    const road: Road = { u: canonU, v: canonV, cost };
    this.roads.push(road);
    this.roads.sort((a, b) => a.cost - b.cost || a.u.localeCompare(b.u) || a.v.localeCompare(b.v));
    return road;
  }

  updateRoadCost(u: string, v: string, newCost: number): void {
    const [canonU, canonV] = RoadNetworkGraph.canonicalEdge(u.trim(), v.trim());
    if (newCost <= 0 || isNaN(newCost)) {
      throw new Error(`Road cost must be strictly positive (> 0). Received: ${newCost}`);
    }
    const idx = this.roads.findIndex((r) => r.u === canonU && r.v === canonV);
    if (idx === -1) {
      throw new Error(`No road exists between '${canonU}' and '${canonV}'.`);
    }
    this.roads[idx].cost = newCost;
    this.roads.sort((a, b) => a.cost - b.cost || a.u.localeCompare(b.u) || a.v.localeCompare(b.v));
  }

  removeRoad(u: string, v: string): void {
    const [canonU, canonV] = RoadNetworkGraph.canonicalEdge(u.trim(), v.trim());
    const initialLen = this.roads.length;
    this.roads = this.roads.filter((r) => !(r.u === canonU && r.v === canonV));
    if (this.roads.length === initialLen) {
      throw new Error(`No road exists between '${canonU}' and '${canonV}'.`);
    }
  }

  getNeighbors(town: string): { neighbor: string; cost: number }[] {
    const res: { neighbor: string; cost: number }[] = [];
    for (const r of this.roads) {
      if (r.u === town) res.push({ neighbor: r.v, cost: r.cost });
      else if (r.v === town) res.push({ neighbor: r.u, cost: r.cost });
    }
    return res;
  }

  getConnectedComponents(): string[][] {
    const visited = new Set<string>();
    const components: string[][] = [];

    for (const t of this.towns) {
      if (!visited.has(t)) {
        const comp: string[] = [];
        const queue: string[] = [t];
        visited.add(t);
        comp.push(t);

        while (queue.length > 0) {
          const curr = queue.shift()!;
          for (const { neighbor } of this.getNeighbors(curr)) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              comp.push(neighbor);
              queue.push(neighbor);
            }
          }
        }
        comp.sort();
        components.push(comp);
      }
    }
    return components;
  }

  isConnected(): boolean {
    if (this.towns.length <= 1) return true;
    return this.getConnectedComponents().length === 1;
  }

  totalCost(): number {
    return this.roads.reduce((sum, r) => sum + r.cost, 0);
  }

  recalculatePositions(): void {
    const n = this.towns.length;
    if (n === 0) return;

    // Use circle layout centered on a 600x420 canvas
    const centerX = 300;
    const centerY = 210;
    const radiusX = n <= 5 ? 180 : 220;
    const radiusY = n <= 5 ? 130 : 150;

    this.towns.forEach((town, i) => {
      // If position already exists, preserve it for stability; otherwise assign circular coordinate
      if (!this.positions[town]) {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        this.positions[town] = {
          x: Math.round(centerX + radiusX * Math.cos(angle)),
          y: Math.round(centerY + radiusY * Math.sin(angle)),
        };
      }
    });
  }

  clone(): RoadNetworkGraph {
    const copy = new RoadNetworkGraph();
    copy.towns = [...this.towns];
    copy.roads = this.roads.map((r) => ({ ...r }));
    copy.positions = JSON.parse(JSON.stringify(this.positions));
    return copy;
  }
}

// Built-in presets with natural coordinate layouts
export function getSmallVillagePreset(): RoadNetworkGraph {
  const g = new RoadNetworkGraph();
  const towns = [
    { name: 'Meadowbrook', x: 200, y: 90 },
    { name: 'Oakdale', x: 420, y: 90 },
    { name: 'Pinecrest', x: 480, y: 280 },
    { name: 'Riverdale', x: 300, y: 340 },
    { name: 'Stonebridge', x: 130, y: 260 },
  ];
  for (const t of towns) {
    g.addTown(t.name, t.x, t.y);
  }
  g.addRoad('Meadowbrook', 'Oakdale', 4);
  g.addRoad('Meadowbrook', 'Stonebridge', 8);
  g.addRoad('Oakdale', 'Stonebridge', 11);
  g.addRoad('Oakdale', 'Pinecrest', 8);
  g.addRoad('Pinecrest', 'Riverdale', 2);
  g.addRoad('Stonebridge', 'Riverdale', 7);
  g.addRoad('Stonebridge', 'Pinecrest', 4);
  return g;
}

export function getCityNetworkPreset(): RoadNetworkGraph {
  const g = new RoadNetworkGraph();
  const towns = [
    { name: 'Avalon', x: 120, y: 80 },
    { name: 'Bayview', x: 300, y: 70 },
    { name: 'Crestwood', x: 480, y: 90 },
    { name: 'Dunmore', x: 530, y: 250 },
    { name: 'Eastwick', x: 130, y: 230 },
    { name: 'Fairhaven', x: 280, y: 220 },
    { name: 'Greenfield', x: 240, y: 350 },
    { name: 'Hillcrest', x: 460, y: 350 },
  ];
  for (const t of towns) {
    g.addTown(t.name, t.x, t.y);
  }
  g.addRoad('Avalon', 'Bayview', 4);
  g.addRoad('Avalon', 'Eastwick', 8);
  g.addRoad('Bayview', 'Eastwick', 11);
  g.addRoad('Bayview', 'Crestwood', 8);
  g.addRoad('Crestwood', 'Dunmore', 7);
  g.addRoad('Crestwood', 'Hillcrest', 2);
  g.addRoad('Crestwood', 'Fairhaven', 4);
  g.addRoad('Dunmore', 'Hillcrest', 6);
  g.addRoad('Dunmore', 'Greenfield', 9);
  g.addRoad('Eastwick', 'Fairhaven', 1);
  g.addRoad('Eastwick', 'Greenfield', 7);
  g.addRoad('Fairhaven', 'Greenfield', 2);
  g.addRoad('Greenfield', 'Hillcrest', 10);
  return g;
}

export function getEqualCostPreset(): RoadNetworkGraph {
  const g = new RoadNetworkGraph();
  const towns = [
    { name: 'Northport', x: 300, y: 70 },
    { name: 'Eastlake', x: 480, y: 210 },
    { name: 'Southgate', x: 300, y: 340 },
    { name: 'Westfield', x: 120, y: 210 },
  ];
  for (const t of towns) {
    g.addTown(t.name, t.x, t.y);
  }
  g.addRoad('Northport', 'Eastlake', 5);
  g.addRoad('Eastlake', 'Southgate', 5);
  g.addRoad('Southgate', 'Westfield', 5);
  g.addRoad('Westfield', 'Northport', 5);
  g.addRoad('Northport', 'Southgate', 5);
  g.addRoad('Eastlake', 'Westfield', 7);
  return g;
}

export function getDisconnectedPreset(): RoadNetworkGraph {
  const g = new RoadNetworkGraph();
  const towns = [
    { name: 'Alpha', x: 120, y: 120 },
    { name: 'Beta', x: 240, y: 80 },
    { name: 'Gamma', x: 180, y: 270 },
    { name: 'Delta', x: 420, y: 110 },
    { name: 'Epsilon', x: 530, y: 220 },
    { name: 'Zeta', x: 400, y: 320 },
  ];
  for (const t of towns) {
    g.addTown(t.name, t.x, t.y);
  }
  // Cluster 1
  g.addRoad('Alpha', 'Beta', 3);
  g.addRoad('Beta', 'Gamma', 4);
  g.addRoad('Alpha', 'Gamma', 6);
  // Cluster 2 (unreachable)
  g.addRoad('Delta', 'Epsilon', 5);
  g.addRoad('Epsilon', 'Zeta', 2);
  g.addRoad('Delta', 'Zeta', 7);
  return g;
}

export function getRandomPreset(numTowns: number = 6, extraRoads: number = 3, seed: number = 42): RoadNetworkGraph {
  const g = new RoadNetworkGraph();
  const names = ['Haven', 'Blythe', 'Corvus', 'Darrow', 'Ember', 'Frost', 'Glimmer', 'Hollow'];
  const count = Math.min(numTowns, names.length);
  const selectedTowns = names.slice(0, count);

  const centerX = 300;
  const centerY = 210;
  const radius = 150;

  selectedTowns.forEach((name, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    g.addTown(name, Math.round(centerX + radius * Math.cos(angle)), Math.round(centerY + radius * Math.sin(angle)));
  });

  // Simple pseudo random generator
  let state = seed;
  const pseudoRandom = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };

  // Connect spanning backbone
  const available = [selectedTowns[0]];
  const remaining = selectedTowns.slice(1);

  while (remaining.length > 0) {
    const targetIdx = Math.floor(pseudoRandom() * remaining.length);
    const target = remaining.splice(targetIdx, 1)[0];
    const source = available[Math.floor(pseudoRandom() * available.length)];
    const cost = Math.round(pseudoRandom() * 12 + 2);
    g.addRoad(source, target, cost);
    available.push(target);
  }

  // Extra random edges
  const allPairs: [string, string][] = [];
  for (let i = 0; i < selectedTowns.length; i++) {
    for (let j = i + 1; j < selectedTowns.length; j++) {
      const u = selectedTowns[i];
      const v = selectedTowns[j];
      const [canonU, canonV] = RoadNetworkGraph.canonicalEdge(u, v);
      if (!g.roads.some((r) => r.u === canonU && r.v === canonV)) {
        allPairs.push([canonU, canonV]);
      }
    }
  }

  // Shuffle pairs
  for (let i = allPairs.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom() * (i + 1));
    [allPairs[i], allPairs[j]] = [allPairs[j], allPairs[i]];
  }

  for (let i = 0; i < Math.min(extraRoads, allPairs.length); i++) {
    const [u, v] = allPairs[i];
    const cost = Math.round(pseudoRandom() * 15 + 3);
    g.addRoad(u, v, cost);
  }

  return g;
}
