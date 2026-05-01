# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow

- Do not run broad codebase analysis at session start — wait for the user to specify the task.
- When making architecture or performance claims, state the specific mechanism and when it does NOT apply. If you can't do both, say "I'm not sure" instead.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Type-check and build for production
npm run lint       # Run ESLint
npm run test       # Run tests once
npm run test:watch # Run tests in watch mode
```

Run a single test file:
```bash
npx vitest run src/solver/CircuitSolver.test.ts
```

## Architecture

This is a React + TypeScript + Vite app for drawing and solving linear electrical circuits. It has two main layers:

### UI Layer (`src/components/`, `src/App.tsx`)

Uses **ReactFlow** as the canvas. Each circuit component (resistor, capacitor, etc.) is a ReactFlow node. Nodes have exactly two handles: `left` and `right`. Wires are ReactFlow edges connecting handles between nodes.

- `src/nodeTypesMap.ts` — registers the 6 node types with ReactFlow (`resistor`, `inductor`, `capacitor`, `impedance`, `currentsource`, `voltagesource`)
- `src/components/nodes/BaseNode.tsx` — presentational base for all node renderers; receives `solverState` and `onRotate` as explicit props from each node component. Handles rotation (0/90/180/270°) by remapping handle positions and rotating content. `NODE_WIDTH=120`, `NODE_HEIGHT=60`.
- `src/components/panels/` — property editors shown in the sidebar when a node is selected; real-valued components use `RealValuePanel`, complex-valued (impedance, sources) use `ComplexValuePanel` via `BasePanel`
- `src/hooks/useCircuit.ts` — central hook owning all circuit state (nodes, edges, omega), undo/redo history, auto-solve, and save/load. Consumed directly by `App.tsx`.
- `src/context/CircuitContext.tsx` — provides `solverResults`, `omega`, `setOmega`, and `onRotate` to the node and edge component trees (which ReactFlow renders, so props can't be passed directly). Node components read from context and pass `solverState`/`onRotate` down to `BaseNode` as props.
- Rotation: `onRotate` is a stable callback from `useCircuit` provided via context; rotating steps 270° CCW and adjusts the node position to keep it visually centered.

### Solver Layer (`src/solver/`, `src/circuit/`)

Pure TypeScript circuit solver, independent of React.

**Data flow:** `React Flow nodes+edges` → `circuitFromUI()` → `Branch[]` → `Branch.reduce()` → `CircuitSolver` → node voltages and branch currents.

**Two-tier simplification:** `Branch.reduce()` collapses all series/parallel sub-topologies into composite `TwoTerminalComponent` trees, leaving only the irreducible skeleton for MNA. Circuits expressible as a pure series/parallel tree reduce to a single branch. Bridge-like topologies leave multiple branches. After MNA solves the skeleton, `applyCurrent`/`applyVoltage` recurse into the composite trees so every original leaf component gets its state — which is how `stateAt(label)` can reach any component regardless of how much reduction happened. `TwoTerminalComponent.inSeriesWith`/`inParallelWith` is the algebra the reduction engine is built on, not a separate user-facing API.

Key files:
- `src/circuit/uiToSolver.ts` — converts ReactFlow nodes/edges to `Branch[]`. Each component node becomes a branch between `nodeId:left` and `nodeId:right` terminals; each edge becomes a wire branch (empty component list).
- `src/solver/Branch.ts` — represents a branch between two numbered nodes with a single `TwoTerminalComponent`. `Branch.reduce()` simplifies the graph by merging series and parallel branches until no further reduction is possible.
- `src/solver/TwoTerminalComponent.ts` — class hierarchy: `TwoTerminalComponent` (abstract) → `RealValuedTwoTerminalComponent` (Resistor, Capacitor, Inductor) / `ComplexValuedTwoTerminalComponent` (Impedance, IdealVoltageSource, IdealCurrentSource) / `CompositeTwoTerminalComponent` (Series, Parallel). Each component exposes a `CurrentVoltageCharacteristic`.
- `src/solver/CurrentVoltageCharacteristic.ts` — encodes the linear I-V relation `aI = yV + c`. `a=0` means fixed voltage; `a=1, y=0` means fixed current. Supports `.inSeries()` and `.inParallel()` combination.
- `src/solver/CircuitSolver.ts` — builds and solves the nodal admittance matrix system (MNA-style) using `mathjs` `pinv`. Handles disconnected sub-circuits separately. After solving, `stateAt(label)` returns `[current, voltage]` for a component by label.
- `src/solver/SIUnits.ts` — SI prefix enum and multiplier lookup used when constructing components from UI data.

### Solver math

`CurrentVoltageCharacteristic` uses the form `aI = yV + c`:
- Resistor: `a=1, y=1/R, c=0`
- Capacitor: `a=1, y=jωC, c=0` (open circuit at DC)
- Inductor: `a=1, y=-j/(ωL), c=0` (short circuit at DC)
- Impedance: `a=1, y=1/Z, c=0`
- Voltage source: `a=0, y=1, c=-V` (fixed voltage)
- Current source: `a=1, y=0, c=I` (fixed current)

The solver builds an `(N+1) × N` matrix where N = node count + voltage-source count, then solves via pseudoinverse.
