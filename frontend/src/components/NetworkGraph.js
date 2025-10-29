
import React, { useMemo, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";


function node(id, label, x, y, type = "default") {
  return {
    id: String(id),
    position: { x, y },
    data: { label },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: {
      borderRadius: 12,
      padding: "8px 12px",
      border: "1px solid #e2e8f0",
      background:
        type === "main"
          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          : "#ffffff",
      color: type === "main" ? "#ffffff" : "#2d3748",
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
      fontWeight: 600,
    },
  };
}

export default function NetworkGraph({ company }) {
  const { nodesInit, edgesInit } = useMemo(() => {
    const main = node("main", company.name, 0, 0, "main");
    const a = node("A", "Partner Alpha GmbH", 260, -80);
    const b = node("B", "Beta Services OG", 260, 0);
    const c = node("C", "Gamma Holding AG", 260, 80);

    const edges = [
      {
        id: "e-main-a",
        source: main.id,
        target: a.id,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "#94a3b8" },
      },
      {
        id: "e-main-b",
        source: main.id,
        target: b.id,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "#94a3b8" },
      },
      {
        id: "e-main-c",
        source: main.id,
        target: c.id,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "#94a3b8" },
      },
    ];

    return { nodesInit: [main, a, b, c], edgesInit: edges };
  }, [company]);

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesInit);
  const [edges, setEdges, onEdgesChange] = useEdgesState(edgesInit);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)
      ),
    [setEdges]
  );

 
  const fitViewOptions = useMemo(
    () => ({
      padding: 0.2,
      includeHiddenNodes: true,
    }),
    []
  );

  return (
    <div className="network-graph" role="region" aria-label="Company network">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={fitViewOptions}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
}
