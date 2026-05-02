import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { addEdge, applyNodeChanges, applyEdgeChanges, useReactFlow } from 'reactflow';
import type { Connection, Edge, Node, NodeChange, EdgeChange } from 'reactflow';
import type { MathNumericType } from 'mathjs';
import { CircuitSolver } from '../solver/CircuitSolver';
import { circuitFromUI } from '../circuit/uiToSolver';
import { COMPONENT_REGISTRY } from '../circuit/componentRegistry';
import type { NodeData, NodeType } from '../circuit/nodeDataTypes';
import type { SolverResults } from '../context/CircuitContext';
import { NODE_WIDTH, NODE_HEIGHT } from '../components/nodes/BaseNode';
import type { ExampleCircuit } from '../circuit/exampleCircuits';
import { EXAMPLE_CIRCUITS } from '../circuit/exampleCircuits';

function circuitBounds(nodes: Node<NodeData>[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const rot = n.data?.rotation ?? 0;
    const horiz = rot % 180 === 0;
    const w = horiz ? NODE_WIDTH : NODE_HEIGHT;
    const h = horiz ? NODE_HEIGHT : NODE_WIDTH;
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

const SOLVE_DEBOUNCE_MS = 200;
const MAX_HISTORY = 50;

type Snapshot = { nodes: Node<NodeData>[]; edges: Edge[] };

const emptySolverResults: SolverResults = { states: new Map(), edgeCurrents: new Map<string, MathNumericType>(), error: null };

function initialTypeCounters(nodes: Node<NodeData>[]): Partial<Record<NodeType, number>> {
  const counters: Partial<Record<NodeType, number>> = {};
  for (const n of nodes) {
    const type = n.type as NodeType;
    const match = String(n.data?.label ?? '').match(/\d+$/);
    const num = match ? parseInt(match[0], 10) : 1;
    counters[type] = Math.max(counters[type] ?? 0, num);
  }
  return counters;
}

const startCircuit = EXAMPLE_CIRCUITS[0];

export function useCircuit() {
  const [nodes, setNodes] = useState<Node<NodeData>[]>(startCircuit.nodes);
  const [edges, setEdges] = useState<Edge[]>(startCircuit.edges);
  const [omega, setOmega] = useState(startCircuit.omega);
  const [solverResults, setSolverResults] = useState<SolverResults>(emptySolverResults);
  const nodeIdRef = useRef(1);
  const typeCountersRef = useRef<Partial<Record<NodeType, number>>>(initialTypeCounters(startCircuit.nodes));
  const reactFlowInstance = useReactFlow();

  // Keep refs in sync so undo/redo callbacks always see current state
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const historyRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  const isDraggingRef = useRef(false);

  const pushSnapshot = useCallback(() => {
    historyRef.current = [
      ...historyRef.current.slice(-(MAX_HISTORY - 1)),
      { nodes: nodesRef.current, edges: edgesRef.current },
    ];
    futureRef.current = [];
  }, []);

  // Auto-solve
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const { branches } = circuitFromUI(nodes, edges);
        const solver = new CircuitSolver(branches);
        solver.solve(omega);
        const states = new Map<string, { current: MathNumericType; voltage: MathNumericType }>();
        for (const node of nodes) {
          const label = String(node.data?.label ?? node.id);
          const state = solver.stateAt(label);
          if (state) states.set(label, { current: state[0], voltage: state[1] });
        }
        const edgeCurrents = new Map<string, MathNumericType>();
        for (const edge of edges) {
          const stateRaw = solver.stateAt(edge.id);
          if (stateRaw) edgeCurrents.set(edge.id, stateRaw[0]);
        }
        setSolverResults({ states, edgeCurrents, error: null });
      } catch (err) {
        setSolverResults(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    }, SOLVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [nodes, edges, omega]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const hasRemove = changes.some(c => c.type === 'remove');
    const hasDragStart = changes.some(c => c.type === 'position' && (c as { dragging?: boolean }).dragging === true);
    const hasDragEnd = changes.some(c => c.type === 'position' && (c as { dragging?: boolean }).dragging === false);

    if (hasRemove) pushSnapshot();
    if (hasDragStart && !isDraggingRef.current) {
      pushSnapshot();
      isDraggingRef.current = true;
    }
    if (hasDragEnd) isDraggingRef.current = false;

    setNodes(nds => applyNodeChanges(changes, nds) as Node<NodeData>[]);
  }, [pushSnapshot]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (changes.some(c => c.type === 'remove')) pushSnapshot();
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, [pushSnapshot]);

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      pushSnapshot();
      setEdges(eds => addEdge(params, eds));
    },
    [pushSnapshot],
  );

  const addComponent = useCallback(
    (type: NodeType) => {
      pushSnapshot();
      const id = String(nodeIdRef.current++);
      const typeCount = (typeCountersRef.current[type] ?? 0) + 1;
      typeCountersRef.current[type] = typeCount;
      const { x, y, zoom } = reactFlowInstance.getViewport();
      const position = {
        x: (window.innerWidth / 2 - x) / zoom - NODE_WIDTH / 2,
        y: (window.innerHeight / 2 - y) / zoom - NODE_HEIGHT / 2,
      };
      setNodes(nds =>
        nds.concat({ id, type, position, data: COMPONENT_REGISTRY[type].defaultData(String(typeCount)) }),
      );
    },
    [reactFlowInstance, pushSnapshot],
  );

  const updateNode = useCallback(
    (id: string, updates: Partial<NodeData>) => {
      pushSnapshot();
      setNodes(nds =>
        nds.map(n => (n.id === id ? { ...n, data: { ...n.data, ...updates } } : n)),
      );
    },
    [pushSnapshot],
  );

  const rotateNode = useCallback(
    (id: string) => {
      pushSnapshot();
      setNodes(nds =>
        nds.map(n => {
          if (n.id !== id) return n;
          const prevRotation = n.data.rotation ?? 0;
          const newRotation = (prevRotation + 270) % 360;
          const isPrevHorizontal = prevRotation % 180 === 0;
          const isNewHorizontal = newRotation % 180 === 0;
          let { x, y } = n.position;
          if (isPrevHorizontal !== isNewHorizontal) {
            if (isPrevHorizontal) {
              x += (NODE_WIDTH - NODE_HEIGHT) / 2;
              y -= (NODE_WIDTH - NODE_HEIGHT) / 2;
            } else {
              x -= (NODE_WIDTH - NODE_HEIGHT) / 2;
              y += (NODE_WIDTH - NODE_HEIGHT) / 2;
            }
          }
          return { ...n, position: { x, y }, data: { ...n.data, rotation: newRotation } };
        }),
      );
    },
    [pushSnapshot],
  );

  const saveCircuit = useCallback(() => {
    const payload = JSON.stringify({ version: 1, omega, nodes: nodesRef.current, edges: edgesRef.current }, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    a.download = 'circuit.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [omega]);

  const applyCircuit = useCallback((nodes: Node<NodeData>[], edges: Edge[], omegaVal: number) => {
    pushSnapshot();
    flushSync(() => {
      setSolverResults(emptySolverResults);
      setNodes(nodes);
      setEdges(edges);
      setOmega(omegaVal);
    });
    const maxId = nodes.reduce((m, n) => Math.max(m, Number(n.id) || 0), 0);
    nodeIdRef.current = maxId + 1;
    const counters: Partial<Record<NodeType, number>> = {};
    for (const n of nodes) {
      const type = n.type as NodeType;
      const match = String(n.data?.label ?? '').match(/\d+$/);
      const num = match ? parseInt(match[0], 10) : 1;
      counters[type] = Math.max(counters[type] ?? 0, num);
    }
    typeCountersRef.current = counters;
    reactFlowInstance.fitBounds(circuitBounds(nodes), { padding: 0.5 });
  }, [pushSnapshot, reactFlowInstance]);

  const loadCircuit = useCallback((file: File) => {
    file.text().then(text => {
      try {
        const parsed = JSON.parse(text);
        if (!parsed.nodes || !parsed.edges) throw new Error('Invalid circuit file');
        applyCircuit(parsed.nodes, parsed.edges, typeof parsed.omega === 'number' ? parsed.omega : 0);
      } catch {
        alert('Failed to load circuit: invalid file.');
      }
    });
  }, [applyCircuit]);

  const loadCircuitData = useCallback((circuit: ExampleCircuit) => {
    applyCircuit(circuit.nodes, circuit.edges, circuit.omega);
  }, [applyCircuit]);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    futureRef.current = [{ nodes: nodesRef.current, edges: edgesRef.current }, ...futureRef.current];
    historyRef.current = historyRef.current.slice(0, -1);
    setNodes(prev.nodes);
    setEdges(prev.edges);
  }, []);

  const removeNode = useCallback(
    (id: string) => {
      pushSnapshot();
      setNodes(nds => nds.filter(n => n.id !== id));
      setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    },
    [pushSnapshot],
  );

  const clearCircuit = useCallback(() => {
    pushSnapshot();
    setSolverResults(emptySolverResults);
    setNodes([]);
    setEdges([]);
  }, [pushSnapshot]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    historyRef.current = [...historyRef.current, { nodes: nodesRef.current, edges: edgesRef.current }];
    futureRef.current = futureRef.current.slice(1);
    setNodes(next.nodes);
    setEdges(next.edges);
  }, []);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addComponent,
    updateNode,
    rotateNode,
    removeNode,
    undo,
    redo,
    omega,
    setOmega,
    solverResults,
    saveCircuit,
    loadCircuit,
    loadCircuitData,
    clearCircuit,
  };
}
