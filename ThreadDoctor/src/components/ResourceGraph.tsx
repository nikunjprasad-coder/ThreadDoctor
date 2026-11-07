import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { Thread, Resource, GraphEdge } from '@/types';
import { ThreadNode } from './ThreadNode';
import { ResourceNode } from './ResourceNode';

interface ResourceGraphProps {
  threads: Thread[];
  resources: Resource[];
  edges: GraphEdge[];
  deadlockCycle?: string[];
  height?: number;
}

const nodeTypes: NodeTypes = {
  thread: ThreadNode,
  resource: ResourceNode,
};

function WaitingEdge({ id, sourceX, sourceY, targetX, targetY, source, target }: any) {
  // Custom dashed edge for waiting
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  const mx = (sourceX + targetX) / 2;
  const my = (sourceY + targetY) / 2;

  const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  return (
    <g>
      <path
        id={id}
        d={path}
        stroke="#FBBF24"
        strokeWidth={2}
        strokeDasharray="6 4"
        fill="none"
        markerEnd="url(#arrowwait)"
        className="animate-dash"
      />
      <text x={mx} y={my - 6} textAnchor="middle" className="fill-warning text-[10px] font-mono pointer-events-none">
        {source}→{target}
      </text>
    </g>
  );
}

function OwnershipEdge({ id, sourceX, sourceY, targetX, targetY }: any) {
  const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  return (
    <path
      id={id}
      d={path}
      stroke="#8B5CF6"
      strokeWidth={2.5}
      fill="none"
      markerEnd="url(#arrowown)"
    />
  );
}

const edgeTypes: EdgeTypes = {
  ownership: OwnershipEdge,
  waiting: WaitingEdge,
};

export function ResourceGraph({
  threads,
  resources,
  edges,
  deadlockCycle,
  height = 420,
}: ResourceGraphProps) {
  const { nodes, flowEdges } = useMemo(() => {
    const isThread = (id: string) => threads.some((t) => t.id === id);
    const cycleSet = new Set(deadlockCycle ?? []);

    const nodes: Node[] = [];

    // Position threads in a column on the left, resources on the right
    const threadCount = threads.length;
    const resourceCount = resources.length;
    const colSpacing = 260;
    const rowSpacing = Math.max(110, height / Math.max(threadCount, resourceCount));

    threads.forEach((t, i) => {
      nodes.push({
        id: t.id,
        type: 'thread',
        position: { x: 40, y: 20 + i * rowSpacing },
        data: { thread: t, inCycle: cycleSet.has(t.id) },
      });
    });

    resources.forEach((r, i) => {
      const y = 20 + i * rowSpacing + (resourceCount < threadCount ? rowSpacing / 3 : 0);
      nodes.push({
        id: r.id,
        type: 'resource',
        position: { x: 40 + colSpacing, y },
        data: { resource: r, inCycle: cycleSet.has(r.id) },
      });
    });

    const flowEdges: Edge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type,
      animated: false,
    }));

    void isThread;
    return { nodes, flowEdges };
  }, [threads, resources, edges, deadlockCycle, height]);

  return (
    <div style={{ height }} className="bg-bg-base/60 rounded-xl border border-border-subtle overflow-hidden">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <marker id="arrowwait" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#FBBF24" />
          </marker>
          <marker id="arrowown" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#8B5CF6" />
          </marker>
        </defs>
      </svg>
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#252B38" gap={20} size={1} />
        <Controls showInteractive={false} className="!bg-bg-panel !border-border-subtle" />
      </ReactFlow>
    </div>
  );
}
