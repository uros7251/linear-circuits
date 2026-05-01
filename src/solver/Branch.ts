/**
 * Wrapper class for a circuit branch, consisting of source and sink identifiers, as well as a list of components.
 * If there is more than one component, they are combined in series.
 * The source and sink are ordered such that source <= sink.
 */
import { multiply } from "mathjs";
import type { MathNumericType } from "mathjs";
import { TwoTerminalComponent, Series, Parallel } from "./TwoTerminalComponent";

export class Branch {
  public source: number;
  public sink: number;
  public component: TwoTerminalComponent;

  constructor(source: number, sink: number, components: TwoTerminalComponent[]) {
    this.source = source;
    this.sink = sink;
    if (components.length === 1) {
      this.component = components[0];
    } else {
      // Combine all components in series
      this.component = components.reduce(
        (acc, c) => acc.inSeriesWith(c),
        new Series()
      );
    }
    // Ensure source <= sink, flip orientation if needed
    if (this.source > this.sink) {
      const temp = this.source;
      this.source = this.sink;
      this.sink = temp;
      this.component.flip();
    }
  }

  applyVoltage(voltage: MathNumericType, omega: number = 0): void {
    this.component.applyVoltage(
      multiply(voltage, this.component.orientation) as MathNumericType,
      omega,
      true,
    );
  }

  applyCurrent(current: MathNumericType, omega: number = 0): void {
    this.component.applyCurrent(
      multiply(current, this.component.orientation) as MathNumericType,
      omega,
      true,
    );
  }

  private static reduceSeries(branches: Branch[]): Branch[] {
    const resultingBranches: Branch[] = [];
    // Create a mapping from nodes to branches
    const nodeToBranches: Map<number, Branch[]> = new Map();
    for (const branch of branches) {
      if (!nodeToBranches.has(branch.source)) {
        nodeToBranches.set(branch.source, []);
      }
      nodeToBranches.get(branch.source)!.push(branch);
      if (branch.sink === branch.source) {
        continue;
      }
      if (!nodeToBranches.has(branch.sink)) {
        nodeToBranches.set(branch.sink, []);
      }
      nodeToBranches.get(branch.sink)!.push(branch);
    }

    // Helper function to get the other terminal of a branch
    const otherTerminal = (branch: Branch, node: number): number => {
      return branch.sink === node ? branch.source : branch.sink;
    };

    for (const [node, nodeBranches] of nodeToBranches.entries()) {
      // Check if the node is redundant (i.e., connects exactly two branches)
      if (nodeBranches.length === 2) {
        // Order by the other terminal
        const sortedBranches = nodeBranches.sort((a, b) => 
          otherTerminal(a, node) - otherTerminal(b, node)
        );
        // Determine if components need to be inverted based on orientation
        const invert = sortedBranches.map((b, i) => 
          (node === b.source) !== (i === 1)
        );
        // Merge the two components in series, flipping orientation if needed
        let mergedComponent = new Series();
        for (let i = 0; i < sortedBranches.length; i++) {
          const component = invert[i] ? 
            sortedBranches[i].component.flip() : 
            sortedBranches[i].component;
          mergedComponent = mergedComponent.inSeriesWith(component);
        }
        // Create a new branch with the merged component
        const source = otherTerminal(sortedBranches[0], node);
        const sink = otherTerminal(sortedBranches[1], node);
        const newBranch = new Branch(source, sink, [mergedComponent]);
        // Replace the branches in the nodeToBranches dictionary
        const sourceBranches = nodeToBranches.get(source)!;
        const sinkBranches = nodeToBranches.get(sink)!;
        sourceBranches.splice(sourceBranches.indexOf(sortedBranches[0]), 1);
        sinkBranches.splice(sinkBranches.indexOf(sortedBranches[1]), 1);
        if (source === sink) {
          // self-loop cannot be combined further
          resultingBranches.push(newBranch)
        }
        else {
          sourceBranches.push(newBranch);
          sinkBranches.push(newBranch);
        }
        nodeToBranches.set(node, []);
      }
    }

    for (const [node, nodeBranches] of nodeToBranches.entries()) {
      for (const branch of nodeBranches) {
        if (node === branch.source) {
          resultingBranches.push(branch);
        }
      }
    }
    return resultingBranches;
  }

  private static reduceParallel(branches: Branch[]): Branch[] {
    const terminalsToBranches: Map<string, Branch[]> = new Map();
    for (const branch of branches) {
      if (branch.source > branch.sink) {
        throw new Error(`Branch source (${branch.source}) must be <= sink (${branch.sink}) for parallel reduction.`);
      }
      const terminals = `${branch.source},${branch.sink}`;
      if (!terminalsToBranches.has(terminals)) {
        terminalsToBranches.set(terminals, []);
      }
      terminalsToBranches.get(terminals)!.push(branch);
    }

    const result: Branch[] = [];
    for (const [terminals, branchList] of terminalsToBranches.entries()) {
      if (branchList.length > 1) {
        // Merge all branches with the same terminals in parallel
        let mergedComponent = new Parallel();
        for (const branch of branchList) {
          mergedComponent = mergedComponent.inParallelWith(branch.component);
        }
        const [source, sink] = terminals.split(',').map(Number);
        result.push(new Branch(source, sink, [mergedComponent]));
      } else {
        result.push(branchList[0]);
      }
    }
    return result;
  }

  /**
   * Reduces a branch list by merging all series and parallel sub-topologies.
   *
   * Circuits that can be expressed as a tree of series/parallel connections are
   * fully collapsed into a single composite TwoTerminalComponent. Irreducible
   * topologies (e.g. a bridge/Wheatstone circuit) are left as-is — only the
   * reducible sub-graphs are folded. The resulting branch list is the smallest
   * graph that still captures the full topology.
   *
   * Each merged branch holds a Series/Parallel composite whose leaf components
   * are the originals. After the solver calls applyCurrent/applyVoltage on the
   * reduced branch, those calls recurse into the leaves, so stateAt(label) can
   * still reach every original component.
   *
   * TwoTerminalComponent.inSeriesWith / inParallelWith is the algebra this
   * reduction engine is built on; it is not a separate user-facing API.
   */
  static reduce(branches: Branch[]): Branch[] {
    // Remove loop branches from reduction
    const noLoopBranches = branches.filter(b => b.source != b.sink)
    // Reduce series branches
    let reducedBranches = Branch.reduceSeries(noLoopBranches);
    // Repeat until no more reductions can be made
    let seriesNext = false; // Alternate between series and parallel reductions
    let branchCount = reducedBranches.length;
    while (true) {
      if (seriesNext) {
        reducedBranches = Branch.reduceSeries(reducedBranches);
      } else {
        reducedBranches = Branch.reduceParallel(reducedBranches);
      }
      seriesNext = !seriesNext;
      if (reducedBranches.length === branchCount) {
        break;
      }
      branchCount = reducedBranches.length;
    }
    // Add back loop branches and return
    reducedBranches.push(...branches.filter(b => b.source == b.sink));
    return reducedBranches
  }
} 