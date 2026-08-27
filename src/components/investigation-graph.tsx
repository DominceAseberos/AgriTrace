"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import type { ConnectionReasonType, GraphEdge, GraphNode } from "@/lib/cognodb/types";

const categoryOrder: ConnectionReasonType[] = ["symptom", "worker-trace", "near", "treatment"];

const categoryConfig: Record<ConnectionReasonType, { label: string; short: string; color: string; bg: string; border: string; angle: number; weight: number }> = {
  symptom: { label: "Same symptoms", short: "Symptoms", color: "#8a5a16", bg: "#fff7e8", border: "#f0d39b", angle: -90, weight: 3 },
  "worker-trace": { label: "Same worker", short: "Worker", color: "#65558f", bg: "#f5f1fb", border: "#d8ceed", angle: 0, weight: 4 },
  near: { label: "Nearby / same area", short: "Nearby", color: "#2f6f78", bg: "#edf7f8", border: "#c7e0e4", angle: 90, weight: 3 },
  treatment: { label: "Same treatment", short: "Treatment", color: "#3f6f58", bg: "#eef7f1", border: "#cce2d4", angle: 180, weight: 2 },
};

const evidencePalette = {
  symptom: { background: "#fffaf0", color: "#6f5221", border: "1px solid #ecd6a4" },
  "worker-trace": { background: "#f8f5fc", color: "#5f507f", border: "1px solid #ddd3ef" },
  near: { background: "#f1f8f9", color: "#2f6f78", border: "1px solid #c9e1e5" },
  treatment: { background: "#f1f8f3", color: "#43664f", border: "1px solid #cee2d5" },
};

function toPoint(centerX: number, centerY: number, radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return { x: centerX + Math.cos(radians) * radius, y: centerY + Math.sin(radians) * radius };
}

function getPlantReasons(edges: GraphEdge[], sourceId: string, plantId: string): ConnectionReasonType[] {
  const reasons = new Set<ConnectionReasonType>();
  for (const edge of edges) {
    if (edge.target === plantId && edge.source !== sourceId) reasons.add(edge.kind as ConnectionReasonType);
    if (edge.source === sourceId && edge.target === plantId) reasons.add(edge.kind as ConnectionReasonType);
  }
  return categoryOrder.filter((type) => reasons.has(type));
}

function buildGraph(graph: { nodes: GraphNode[]; edges: GraphEdge[] }, filter: "all" | ConnectionReasonType): { nodes: Node[]; edges: Edge[] } {
  const source = graph.nodes.find((node) => node.emphasis);
  if (!source) return { nodes: [], edges: [] };

  const activeTypes = categoryOrder.filter((type) => filter === "all" || filter === type);
  const nodeLookup = new Map(graph.nodes.map((node) => [node.id, node]));
  const activeEdges = graph.edges.filter((edge) => activeTypes.includes(edge.kind as ConnectionReasonType));
  const relatedPlantIds = new Set<string>();

  for (const edge of activeEdges) {
    const target = nodeLookup.get(edge.target);
    if (target?.kind === "plant" && target.id !== source.id) relatedPlantIds.add(target.id);
  }

  const sourceNode: Node = {
    id: source.id,
    position: { x: 410, y: 300 },
    data: {
      label: (
        <div className="text-left">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Selected tree</div>
          <div className="mt-1 text-[16px] font-semibold text-slate-900">{source.label}</div>
          <div className="mt-1 text-[12px] font-medium text-slate-500">{source.meta ?? "Current tree"}</div>
        </div>
      ),
    },
    style: {
      width: 178,
      borderRadius: 16,
      padding: 14,
      background: "#ffffff",
      border: "2px solid #7fb2bb",
      boxShadow: "0 10px 26px rgba(47,111,120,.12)",
    },
  };

  const nodes: Node[] = [sourceNode];
  const edges: Edge[] = [];
  const centerX = 410;
  const centerY = 300;

  const plantReasonMap = new Map<string, ConnectionReasonType[]>();
  for (const plantId of relatedPlantIds) plantReasonMap.set(plantId, getPlantReasons(activeEdges, source.id, plantId));

  const primaryTypeByPlant = new Map<string, ConnectionReasonType>();
  for (const [plantId, reasons] of plantReasonMap) {
    const primary = [...reasons].sort((a, b) => categoryConfig[b].weight - categoryConfig[a].weight)[0] ?? activeTypes[0];
    primaryTypeByPlant.set(plantId, primary);
  }

  for (const type of activeTypes) {
    const config = categoryConfig[type];
    const categoryId = `category:${type}`;
    const categoryPoint = toPoint(centerX, centerY, 205, config.angle);
    const categoryPlantIds = [...relatedPlantIds].filter((plantId) => plantReasonMap.get(plantId)?.includes(type));

    nodes.push({
      id: categoryId,
      position: { x: categoryPoint.x - 82, y: categoryPoint.y - 38 },
      data: {
        label: (
          <div className="text-center">
            <div className="text-[14px] font-semibold">{config.label}</div>
            <div className="mt-1 text-[11px] font-medium opacity-70">{categoryPlantIds.length} tree{categoryPlantIds.length === 1 ? "" : "s"}</div>
          </div>
        ),
      },
      style: {
        width: 164,
        borderRadius: 999,
        padding: "11px 14px",
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        boxShadow: "0 6px 16px rgba(15,23,42,.05)",
      },
    });

    edges.push({
      id: `${source.id}:${categoryId}`,
      source: source.id,
      target: categoryId,
      markerEnd: { type: MarkerType.ArrowClosed, width: 13, height: 13, color: config.color },
      style: { stroke: config.color, strokeWidth: 2 },
    });

    const evidenceIds = new Set<string>();
    for (const edge of activeEdges) {
      if (edge.kind !== type) continue;
      const sourceNodeOriginal = nodeLookup.get(edge.source);
      const targetNodeOriginal = nodeLookup.get(edge.target);
      if (sourceNodeOriginal && sourceNodeOriginal.id !== source.id && sourceNodeOriginal.kind !== "plant") evidenceIds.add(sourceNodeOriginal.id);
      if (targetNodeOriginal && targetNodeOriginal.id !== source.id && targetNodeOriginal.kind !== "plant") evidenceIds.add(targetNodeOriginal.id);
    }

    const evidenceList = [...evidenceIds].map((id) => nodeLookup.get(id)).filter(Boolean) as GraphNode[];
    const evidenceRadius = 325;
    const perpendicularAngle = config.angle + 90;
    const perpendicular = toPoint(0, 0, 1, perpendicularAngle);

    evidenceList.forEach((evidence, index) => {
      const base = toPoint(centerX, centerY, evidenceRadius, config.angle);
      const offset = (index - (evidenceList.length - 1) / 2) * 92;
      const position = { x: base.x + perpendicular.x * offset - 82, y: base.y + perpendicular.y * offset - 35 };
      const palette = evidencePalette[type];

      nodes.push({
        id: evidence.id,
        position,
        data: {
          label: (
            <div className="text-center">
              <div className="text-[13px] font-semibold">{evidence.label}</div>
              {evidence.meta && <div className="mt-1 text-[11px] font-medium opacity-65">{evidence.meta}</div>}
            </div>
          ),
        },
        style: { ...palette, width: 164, borderRadius: 12, padding: 11, boxShadow: "0 5px 14px rgba(15,23,42,.04)" },
      });

      edges.push({
        id: `${categoryId}:${evidence.id}`,
        source: categoryId,
        target: evidence.id,
        markerEnd: { type: MarkerType.ArrowClosed, width: 11, height: 11, color: config.color },
        style: { stroke: config.color, strokeWidth: 1.5, opacity: 0.72 },
      });
    });
  }

  for (const plantId of relatedPlantIds) {
    const plant = nodeLookup.get(plantId);
    if (!plant) continue;
    const reasons = plantReasonMap.get(plantId) ?? [];
    const primary = primaryTypeByPlant.get(plantId) ?? reasons[0] ?? activeTypes[0];
    const config = categoryConfig[primary];
    const siblings = [...relatedPlantIds].filter((id) => primaryTypeByPlant.get(id) === primary);
    const index = siblings.indexOf(plantId);
    const base = toPoint(centerX, centerY, 465, config.angle);
    const perpendicular = toPoint(0, 0, 1, config.angle + 90);
    const offset = (index - (siblings.length - 1) / 2) * 112;
    const position = { x: base.x + perpendicular.x * offset - 92, y: base.y + perpendicular.y * offset - 44 };

    nodes.push({
      id: plant.id,
      position,
      data: {
        label: (
          <div className="text-left">
            <div className="text-[14px] font-semibold text-slate-900">{plant.label}</div>
            <div className="mt-1 text-[11px] font-medium text-slate-500">{plant.meta ?? "Related tree"}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {reasons.map((reason) => {
                const reasonConfig = categoryConfig[reason];
                return (
                  <span key={reason} style={{ background: reasonConfig.bg, color: reasonConfig.color, borderColor: reasonConfig.border }} className="rounded-full border px-2 py-0.5 text-[10px] font-semibold">
                    {reasonConfig.short}
                  </span>
                );
              })}
            </div>
          </div>
        ),
      },
      style: { width: 184, borderRadius: 14, padding: 12, background: "#ffffff", border: "1px solid #d8e1e7", boxShadow: "0 6px 16px rgba(15,23,42,.05)" },
    });
  }

  for (const type of activeTypes) {
    const config = categoryConfig[type];
    const categoryId = `category:${type}`;
    const evidenceIds = new Set<string>();

    for (const edge of activeEdges) {
      if (edge.kind !== type) continue;
      const originalSource = nodeLookup.get(edge.source);
      const originalTarget = nodeLookup.get(edge.target);
      if (originalSource && originalSource.id !== source.id && originalSource.kind !== "plant") evidenceIds.add(originalSource.id);
      if (originalTarget && originalTarget.id !== source.id && originalTarget.kind !== "plant") evidenceIds.add(originalTarget.id);
    }

    for (const edge of activeEdges) {
      if (edge.kind !== type) continue;
      const target = nodeLookup.get(edge.target);
      if (target?.kind !== "plant" || target.id === source.id) continue;

      let edgeSource = categoryId;
      if (edge.source !== source.id && evidenceIds.has(edge.source)) edgeSource = edge.source;

      edges.push({
        id: `visual:${type}:${edgeSource}:${target.id}`,
        source: edgeSource,
        target: target.id,
        label: type === "near" ? "nearby" : undefined,
        animated: type === "worker-trace",
        markerEnd: { type: MarkerType.ArrowClosed, width: 11, height: 11, color: config.color },
        style: { stroke: config.color, strokeWidth: reasonsForSecondary(target.id, type, primaryTypeByPlant) ? 1.25 : 1.7, opacity: reasonsForSecondary(target.id, type, primaryTypeByPlant) ? 0.48 : 0.82 },
        labelStyle: { fill: config.color, fontSize: 10, fontWeight: 700 },
        labelBgStyle: { fill: "#ffffff", fillOpacity: 0.92 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
      });
    }
  }

  return { nodes, edges };
}

function reasonsForSecondary(plantId: string, type: ConnectionReasonType, primaryTypeByPlant: Map<string, ConnectionReasonType>) {
  return primaryTypeByPlant.get(plantId) !== type;
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
        if (element.clientWidth > 180 && element.clientHeight > 180) void fitView({ padding: 0.18, duration: 240, maxZoom: 1.02 });
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
    <div ref={wrapperRef} className="relative h-[500px] overflow-hidden rounded-xl border border-slate-200 bg-[#fbfcfd] sm:h-[590px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 1.02 }}
        minZoom={0.35}
        maxZoom={1.5}
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
  const [filter, setFilter] = useState<"all" | ConnectionReasonType>("all");
  const visible = useMemo(() => buildGraph(graph, filter), [graph, filter]);

  const counts = useMemo(() => {
    const nodeLookup = new Map(graph.nodes.map((node) => [node.id, node]));
    return Object.fromEntries(categoryOrder.map((type) => {
      const plants = new Set<string>();
      for (const edge of graph.edges) {
        if (edge.kind !== type) continue;
        const target = nodeLookup.get(edge.target);
        if (target?.kind === "plant" && !target.emphasis) plants.add(target.id);
      }
      return [type, plants.size];
    })) as Record<ConnectionReasonType, number>;
  }, [graph]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2" aria-label="Filter connection map">
        <button type="button" onClick={() => setFilter("all")} className={`rounded-full border px-3 py-2 text-[13px] font-semibold transition ${filter === "all" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>All connections</button>
        {categoryOrder.map((type) => {
          const config = categoryConfig[type];
          const active = filter === type;
          return (
            <button key={type} type="button" onClick={() => setFilter(type)} style={active ? { background: config.bg, color: config.color, borderColor: config.border } : undefined} className={`rounded-full border px-3 py-2 text-[13px] font-semibold transition ${active ? "" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              {config.label} · {counts[type]}
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-slate-500">
        <span>One graph, organized around relationship categories.</span>
        <span>Click a category above to focus the map.</span>
      </div>

      <ReactFlowProvider>
        <GraphCanvas nodes={visible.nodes} edges={visible.edges} />
      </ReactFlowProvider>
    </div>
  );
}
