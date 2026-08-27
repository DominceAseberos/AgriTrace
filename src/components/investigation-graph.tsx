"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import type { GraphEdge, GraphNode } from "@/lib/cognodb/types";

const palette = {
  plant: { background: "#173f2a", color: "#f6f3e9", border: "1px solid #173f2a" },
  symptom: { background: "#f4dfb1", color: "#513c17", border: "1px solid rgba(81,60,23,.08)" },
  treatment: { background: "#dce9c5", color: "#27402c", border: "1px solid rgba(39,64,44,.08)" },
  worker: { background: "#e7ddd2", color: "#51382f", border: "1px solid rgba(81,56,47,.08)" },
  grid: { background: "#e7e8df", color: "#30372f", border: "1px solid rgba(48,55,47,.08)" },
};

function positionNodes(nodes: GraphNode[]): Node[] {
  const source = nodes.find((node) => node.emphasis);
  const middle = nodes.filter((node) => !node.emphasis && node.kind !== "plant");
  const plants = nodes.filter((node) => !node.emphasis && node.kind === "plant");

  const positioned: Node[] = [];
  if (source) {
    positioned.push({
      id: source.id,
      position: { x: 40, y: 250 },
      data: { label: `${source.label}\n${source.meta ?? "Selected plant"}` },
      style: { ...palette.plant, width: 150, borderRadius: 22, padding: 14, fontWeight: 700, whiteSpace: "pre-line", boxShadow: "0 14px 34px rgba(23,63,42,.16)" },
    });
  }

  middle.forEach((node, index) => {
    positioned.push({
      id: node.id,
      position: { x: 330, y: 35 + index * 112 },
      data: { label: `${node.label}${node.meta ? `\n${node.meta}` : ""}` },
      style: { ...palette[node.kind], width: 170, borderRadius: 18, padding: 12, fontWeight: 650, whiteSpace: "pre-line", fontSize: 12 },
    });
  });

  plants.forEach((node, index) => {
    positioned.push({
      id: node.id,
      position: { x: 680, y: 30 + index * 92 },
      data: { label: `${node.label}\n${node.meta ?? "Related plant"}` },
      style: { ...palette.plant, width: 150, borderRadius: 18, padding: 11, fontWeight: 650, whiteSpace: "pre-line", fontSize: 12 },
    });
  });

  return positioned;
}

function mapEdges(edges: GraphEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: edge.kind === "worker-trace",
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
    style: {
      stroke: edge.kind === "worker-trace" ? "#b86d4e" : edge.kind === "near" ? "#557557" : "#72806f",
      strokeWidth: edge.kind === "worker-trace" ? 2 : 1.5,
    },
    labelStyle: { fill: "#596157", fontSize: 9, fontWeight: 700 },
    labelBgStyle: { fill: "#f2f0e8", fillOpacity: 0.92 },
    labelBgPadding: [5, 3],
    labelBgBorderRadius: 6,
  }));
}

export function InvestigationGraph({ graph }: { graph: { nodes: GraphNode[]; edges: GraphEdge[] } }) {
  const nodes = useMemo(() => positionNodes(graph.nodes), [graph.nodes]);
  const edges = useMemo(() => mapEdges(graph.edges), [graph.edges]);

  return (
    <div className="relative h-[620px] overflow-hidden rounded-[30px] bg-[#e9e8df] sm:h-[680px]">
      <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-full bg-white/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/50 backdrop-blur">
        Drag · zoom · inspect paths
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.35}
        maxZoom={1.8}
        nodesConnectable={false}
        nodesDraggable
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#b6b9ad" gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
