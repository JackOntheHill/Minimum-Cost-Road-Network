import { DSUSnapshot } from '../types.ts';

export class DisjointSet {
  parent: Record<string, string>;
  rank: Record<string, number>;
  operationHistory: string[];

  constructor(elements: string[] = []) {
    this.parent = {};
    this.rank = {};
    this.operationHistory = [];

    for (const elem of elements) {
      this.makeSet(elem);
    }
  }

  makeSet(x: string): void {
    this.parent[x] = x;
    this.rank[x] = 0;
  }

  find(x: string): string {
    if (!(x in this.parent)) {
      throw new Error(`Element '${x}' is not present in Disjoint Set.`);
    }

    if (this.parent[x] !== x) {
      // Path Compression
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x: string, y: string): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) {
      this.operationHistory.push(
        `union(${x}, ${y}) -> Cycle detected: already in same component (root '${rootX}').`
      );
      return false;
    }

    // Union by Rank
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
      this.operationHistory.push(
        `union(${x}, ${y}) -> Linked '${rootX}' under '${rootY}' (rank ${this.rank[rootY]}).`
      );
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
      this.operationHistory.push(
        `union(${x}, ${y}) -> Linked '${rootY}' under '${rootX}' (rank ${this.rank[rootX]}).`
      );
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX] += 1;
      this.operationHistory.push(
        `union(${x}, ${y}) -> Equal ranks: linked '${rootY}' under '${rootX}', incremented rank to ${this.rank[rootX]}.`
      );
    }

    return true;
  }

  getComponents(): Record<string, string[]> {
    const components: Record<string, string[]> = {};
    const elements = Object.keys(this.parent).sort();

    for (const elem of elements) {
      const root = this.find(elem);
      if (!components[root]) {
        components[root] = [];
      }
      components[root].push(elem);
    }

    for (const root of Object.keys(components)) {
      components[root].sort();
    }
    return components;
  }

  formatComponentsDisplay(): string {
    const groups = this.getComponents();
    const sortedGroups = Object.values(groups).sort((a, b) => a[0].localeCompare(b[0]));
    return sortedGroups.map((g) => g.join('-')).join('   ');
  }

  getSnapshot(): DSUSnapshot {
    // Compress paths for all elements
    const elements = Object.keys(this.parent);
    for (const elem of elements) {
      this.find(elem);
    }

    const components = this.getComponents();
    return {
      parent: { ...this.parent },
      rank: { ...this.rank },
      components,
      displayStr: this.formatComponentsDisplay(),
      numComponents: Object.keys(components).length,
    };
  }
}
