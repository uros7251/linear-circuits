import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ConnectionMode,
  ConnectionLineType,
  ReactFlowProvider,
} from 'reactflow';
import type { Node } from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';
import { nodeTypes } from './nodeTypesMap';
import AnimatedWireEdge from './components/edges/AnimatedWireEdge';
import { useCircuit } from './hooks/useCircuit';
import { CircuitContext } from './context/CircuitContext';
import Toolbar from './components/Toolbar';
import LeftPanel from './components/LeftPanel';
import PropertyPanel from './components/panels/PropertyPanel';
import FrequencyControl from './components/FrequencyControl';
import type { NodeData } from './circuit/nodeDataTypes';

const edgeTypes = { animatedWire: AnimatedWireEdge };

function CircuitEditor() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addComponent, updateNode, rotateNode, removeNode,
    undo, redo,
    omega, setOmega,
    solverResults,
    saveCircuit,
    loadCircuit,
    loadCircuitData,
    clearCircuit,
  } = useCircuit();

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo]);

  const [freqPos, setFreqPos] = useState<{ left: number; bottom: number } | null>(null);
  const freqElemRef = useRef<HTMLDivElement>(null);
  const freqDragRef = useRef<{ startX: number; startY: number; startLeft: number; startBottom: number } | null>(null);

  const onFreqMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input')) return;
    e.preventDefault();
    const rect = freqElemRef.current?.getBoundingClientRect();
    const containerRect = freqElemRef.current?.parentElement?.getBoundingClientRect();
    if (!rect || !containerRect) return;
    const startLeft = rect.left - containerRect.left;
    const startBottom = containerRect.bottom - rect.bottom;
    setFreqPos({ left: startLeft, bottom: startBottom });
    freqDragRef.current = { startX: e.clientX, startY: e.clientY, startLeft, startBottom };
    const onMove = (me: MouseEvent) => {
      if (!freqDragRef.current) return;
      const { startX, startY, startLeft, startBottom } = freqDragRef.current;
      setFreqPos({ left: startLeft + (me.clientX - startX), bottom: startBottom - (me.clientY - startY) });
    };
    const onUp = () => { freqDragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => setSelectedNodeId(null), []);

  const onUpdate = useCallback(
    (updates: Partial<NodeData>) => {
      if (selectedNodeId) updateNode(selectedNodeId, updates);
    },
    [selectedNodeId, updateNode],
  );

  const circuitContextValue = useMemo(
    () => ({ solverResults, omega, setOmega, onRotate: rotateNode }),
    [solverResults, omega, setOmega, rotateNode],
  );

  return (
    <CircuitContext.Provider value={circuitContextValue}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw', overflow: 'hidden' }}>
        <Toolbar
          onSave={saveCircuit}
          onLoadClick={() => fileInputRef.current?.click()}
          onClear={clearCircuit}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) { loadCircuit(f); e.target.value = ''; } }}
        />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <LeftPanel onAdd={addComponent} onLoadExample={loadCircuitData} />
          <div style={{ flex: 1, position: 'relative', containerType: 'inline-size' }}>
            <div
              ref={freqElemRef}
              onMouseDown={onFreqMouseDown}
              className={freqPos ? undefined : 'freqWrapper'}
              style={freqPos
                ? { position: 'absolute', bottom: freqPos.bottom, left: freqPos.left, zIndex: 10, cursor: freqDragRef.current ? 'grabbing' : 'grab' }
                : undefined}
            >
              <FrequencyControl />
            </div>
            {solverResults.error && (
              <div style={{ position: 'absolute', zIndex: 10, top: 12, left: '50%', transform: 'translateX(-50%)', color: 'red', background: '#fff8f8', padding: '4px 12px', borderRadius: 4, border: '1px solid red', maxWidth: 'calc(100vw - 24px)', textAlign: 'center' }}>
                {solverResults.error}
              </div>
            )}
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              connectionMode={ConnectionMode.Loose}
              connectionLineType={ConnectionLineType.SmoothStep}
              defaultEdgeOptions={{ type: 'animatedWire' }}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              style={{ width: '100%', height: '100%' }}
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </div>
          {selectedNode && (
            <PropertyPanel
              node={selectedNode}
              onUpdate={onUpdate}
              onClose={() => setSelectedNodeId(null)}
              onDelete={() => { removeNode(selectedNode.id); setSelectedNodeId(null); }}
              solverState={solverResults.states.get(String(selectedNode.data?.label))}
            />
          )}
        </div>
      </div>
    </CircuitContext.Provider>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <CircuitEditor />
    </ReactFlowProvider>
  );
}
