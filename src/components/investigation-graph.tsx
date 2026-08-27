"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import type { GraphEdge, GraphNode } from "@/lib/cognodb/types";

const palette = {
  plant: { background: "#f7fbfc", color: "#243746", border: "1px solid #aacbd1" },
  symptom: { background: "#fff8e8", color: "#6f5221", border: "1px solid #ead6a6" },
  treatment: { background: "#f2f0fb", color: "#514b76", border: "1px solid #d4cfee" },
  worker: { background: "#f8f4f0", color: "#5f5148", border: "1px solid #ded5ce" },
  grid: { background: "#f5f7f9", color: "#475569", border: "1px solid #dbe2e8" },
};

function positionNodes(nodes: GraphNode[]): Node[] {
  const source = nodes.find((node) => node.emphasis);
  const middle = nodes.filter((node) => !node.emphasis && node.kind !== "plant");
  const plants = nodes.filter((node) => !node.emphasis && node.kind === "plant");

  const positioned: Node[] = [];
  const middleGap = middle.length > 4 ? 88 : 104;
  const plantGap = plants.length > 4 ? 82 : 98;

  if (source) {
    positioned.push({
      id: source.id,
      position: { x: 0, y: 190 },
      data: { label: `${source.label}\n${source.meta ?? "Selected tree"}` },
      style: {
        ...palette.plant,
        width: 160,
        borderRadius: 12,
        padding: 14,
        fontWeight: 700,
        whiteSpace: "pre-line",
        fontSize: 13,
        boxShadow: "0 7px 18px rgba(47,111,120,.08)",
      },
    });
  }

  middle.forEach((node, index) => {
    positioned.push({
      id: node.id,
      position: { x: 310, y: 30 + index * middleGap },
      data: { label: `${node.label}${node.meta ? `\n${node.meta}` : ""}` },
      style: { ...palette[node.kind], width: 176, borderRadius: 12, padding: 12, fontWeight: 650, whiteSpace: "pre-line", fontSize: 13 },
    });
  });

  plants.forEach((node, index) => {
    positioned.push({
      id: node.id,
      position: { x: 650, y: 18 + index * plantGap },
      data: { label: `${node.label}\n${node.meta ?? "Related tree"}` },
      style: { ...palette.plant, width: 160, borderRadius: 12, padding: 12, fontWeight: 650, whiteSpace: "pre-line", fontSize: 13 },
    });
  });

  return positioned;
}

function mapEdges(edges: GraphEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label === "NEAR" ? "nearby" : edge.label === "SHOWS" ? "same symptom" : edge.label === "RECEIVED" ? "same treatment" : edge.label === "RECORDED BY" || edge.label === "RECORDED" ? "same worker" : edge.label,
    animated: edge.kind === "worker-trace",
    markerEnd: { type: MarkerType.ArrowClosed, width: 13, height: 13 },
    style: {
      stroke: edge.kind === "worker-trace" ? "#8b91b3" : edge.kind === "near" ? "#78a4ad" : "#9aa8b4",
      strokeWidth: edge.kind === "worker-trace" ? 1.8 : 1.4,
    },
    labelStyle: { fill: "#64748b", fontSize: 11, fontWeight: 650 },
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.94 },
    labelBgPadding: [5, 3],
    labelBgBorderRadius: 5,
  }));
}

function GraphCanvas({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    let frame = 0;
    const recenter = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (element.clientWidth > 180 && element.clientHeight > 180) {
          void fitView({ padding: 0.22, duration: 220, maxZoom: 1.05 });
        }
      });
    };

    const observer = new ResizeObserver(recenter);
    observer.observe(element);
    recenter();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [fitView, nodes, edges]);

  return (
    <div ref={wrapperRef} className="relative h-[430px] overflow-hidden rounded-xl border border-slate-200 bg-[#fbfcfd] sm:h-[500px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.22, maxZoom: 1.05 }}
        minZoom={0.45}
        maxZoom={1.55}
        nodesConnectable={false}
        nodesDraggable
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#dbe3e8" gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export function InvestigationGraph({ graph }: { graph: { nodes: GraphNode[]; edges: GraphEdge[] } }) {
  const nodes = useMemo(() => positionNodes(graph.nodes), [graph.nodes]);
  const edges = useMemo(() => mapEdges(graph.edges), [graph.edges]);

  return (
    <ReactFlowProvider>
      <GraphCanvas nodes={nodes} edges={edges} />
    </ReactFlowProvider>
  );
}
