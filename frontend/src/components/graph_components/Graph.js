// Graph.jsx
import { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  useEdgesState,
  useNodesState,
  getStraightPath,
  BaseEdge,
  EdgeLabelRenderer,
  Background,
  MiniMap,
  Controls,
} from "reactflow";
import "reactflow/dist/style.css";

import FaceIcon from "@mui/icons-material/Face";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LockIcon from "@mui/icons-material/Lock";

import { authFetch } from "../../api/auth";
import SettingsButton from "./GraphSettings";
import { companyNodeTypes } from "./CompanyNodeTypes";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const initialNodes = [];
const initialEdges = [];






function starLayout(nodes, mainNodeId) {
  const centerX = 0;
  const centerY = 0;
  const rootRadius = 400;
  const childRadius = 350;

  if (!nodes || nodes.length === 0) return [];

  const hasCustomPosition = (node) =>
    node.position &&
    (node.position.x !== 0 ||
      node.position.y !== 0 ||
      node.type === "main_company_display");

  let mainNode = nodes.find((n) => n.id === mainNodeId);
  if (!mainNode) {
    mainNode = nodes[0];
  }

  const mainPos = mainNode.position || { x: 0, y: 0 };
  const isRootLike = mainPos.x === 0 && mainPos.y === 0;

  if (isRootLike) {
    const others = nodes.filter((n) => n.id !== mainNode.id);
    const angleStep = others.length > 0 ? (2 * Math.PI) / others.length : 0;

    return nodes.map((node) => {
      if (node.id === mainNode.id) {
        return {
          ...node,
          position: { x: centerX, y: centerY },
          data: {
            ...(node.data ?? {}),
            branchAngle: 0,
          },
        };
      }

      if (hasCustomPosition(node)) {
        return node;
      }

      const index = others.findIndex((n) => n.id === node.id);
      const angle = index * angleStep;

      const x = centerX + rootRadius * Math.cos(angle);
      const y = centerY + rootRadius * Math.sin(angle);

      return {
        ...node,
        position: { x, y },
        data: {
          ...(node.data ?? {}),
          branchAngle: angle,
        },
      };
    });
  }

  const others = nodes.filter((n) => n.id !== mainNode.id);
  const newChildren = others.filter((n) => !hasCustomPosition(n));

  const baseAngle =
    mainNode.data?.branchAngle ??
    Math.atan2(mainPos.y - centerY, mainPos.x - centerX);

  const spread = (140 * Math.PI) / 180;

  const angleStep =
    newChildren.length > 1 ? spread / (newChildren.length - 1) : 0;
  const startAngle = baseAngle - spread / 2;

  return nodes.map((node) => {
    if (node.id === mainNode.id) {
      return {
        ...node,
        position: mainPos,
      };
    }

    if (hasCustomPosition(node)) {
      return node;
    }

    const index = newChildren.findIndex((n) => n.id === node.id);
    if (index === -1) {
      return node;
    }

    const angle = startAngle + index * angleStep;
    const x = mainPos.x + childRadius * Math.cos(angle);
    const y = mainPos.y + childRadius * Math.sin(angle);

    return {
      ...node,
      position: { x, y },
      data: {
        ...(node.data ?? {}),
        branchAngle: angle,
      },
    };
  });
}



function DetailedEdge(props) {
  const [edgePath, labelX, labelY] = getStraightPath(props);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <BaseEdge
        {...props}
        path={edgePath}
        style={{
          ...props.style,
          stroke: "#667eea",
          strokeWidth: 2.5,
          opacity: 0.85,
        }}
      />

      <EdgeLabelRenderer>
        <div
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="w-9 h-9 rounded-full bg-white border border-indigo-200 flex justify-center items-center shadow-md cursor-pointer"
        >
          {props.data?.label === "Person" ? (
            <FaceIcon style={{ fontSize: 18, color: "#667eea" }} />
          ) : (
            <LocationOnIcon style={{ fontSize: 18, color: "#764ba2" }} />
          )}

          {showInfo && (
            <div
              style={{
                zIndex: 1020,
                background:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
              className="inline-flex !px-3 py-1.5 min-w-max rounded-lg shadow-xl gap-2 justify-center items-center text-white text-xs font-medium backdrop-blur-sm absolute top-[120%] whitespace-nowrap"
            >
              {props.data.value}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}


const edgeTypes = {
  detailed_edge: DetailedEdge,
};




export default function Graph({ id_that_was_passed }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [defaultCompanyDisplayType, setDefaultCompanyDisplayType] =
    useState("default_company_display");

  const [visibleNodeIds, setVisibleNodeIds] = useState(() => new Set());
  const [childrenByParent, setChildrenByParent] = useState({});
  const [rootId, setRootId] = useState(null);
  const [edgeFilter, setEdgeFilter] = useState("all");
  

  const [highlightPath, setHighlightPath] = useState(true); 

  const { isAuthenticated, loadingUser, user } = useAuth();

  const hasPremiumAccess =
    user?.role === "subscriber" || user?.role === "admin";
  const shouldShowPremiumBanner = !hasPremiumAccess;


    const [isLoading, setIsLoading] = useState(true);
    const [showSpinner, setShowSpinner] = useState(false);

useEffect(() => {
  let timeout;

  if (isLoading) {
    timeout = setTimeout(() => {
      setShowSpinner(true);
    }, 500); 
  } else {
    setShowSpinner(false);
  }

  return () => {
    clearTimeout(timeout);
  };
}, [isLoading]);





  useEffect(() => {
    if (loadingUser) {
      console.log("Still loading user, waiting...");
      return;
    }

    if (!isAuthenticated) {
      console.log("Not authenticated, stopping fetch.");
      setIsLoading(false);
      return;
    }

    console.log("User loaded and authenticated, fetching company");
    fetchCompany(id_that_was_passed);
  }, [loadingUser, isAuthenticated, id_that_was_passed]);


  function edgeMatchesFilter(edge) {
    const label = edge.data?.label;

    if (edgeFilter === "all") return true;

    if (rootId) {
      const connectsRoot = edge.source === rootId || edge.target === rootId;
      if (!connectsRoot) return false;
    }

    if (edgeFilter === "person") return label === "Person";
    if (edgeFilter === "location") return label === "Location";

    return true;
  }


  function changeSingleNodeType(nodeId, newType) {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId ? { ...node, type: newType } : node
      )
    );
  }

  function change_company_display_default(set_to_this_type) {
    setDefaultCompanyDisplayType(set_to_this_type);
  }

  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.type === "main_company_display" || node.selected) return node;

        if (
          node.type === "default_company_display" ||
          node.type === "minimal_company_display"
        ) {
          return {
            ...node,
            type: defaultCompanyDisplayType,
          };
        }

        return node;
      })
    );
  }, [defaultCompanyDisplayType, setNodes]);


  const updateGraphData = (newNodes = [], newEdges = []) => {
    setNodes((prevNodes) => {
      const byId = new Map(prevNodes.map((n) => [n.id, n]));
      newNodes.forEach((n) => {
        const existing = byId.get(n.id) || {};
        byId.set(n.id, { ...existing, ...n });
      });
      return Array.from(byId.values());
    });

    setEdges((prevEdges) => {
      const byId = new Map(prevEdges.map((e) => [e.id, e]));
      newEdges.forEach((e) => {
        const existing = byId.get(e.id) || {};
        byId.set(e.id, { ...existing, ...e });
      });
      return Array.from(byId.values());
    });
  };


  async function fetchCompany(id) {
    setIsLoading(true);
    try {
      const response = await authFetch(
        `https://apibizray.bnbdevelopment.hu/api/v1/network/${id}`,
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch company data");
      }

      const data = await response.json();
      const company = data.company;
      const mainId = company.firmenbuchnummer;

      if (!rootId) {
        setRootId(mainId);
      }

      const parentId = id;
      const existingById = new Map(nodes.map((n) => [n.id, n]));

      const rawNodes = company.nodes.map((node) => {
        const existing = existingById.get(node.id);
        const isMain = node.id === (rootId ?? mainId);

        return {
          id: node.id,
          type:
            existing?.type ??
            (isMain ? "main_company_display" : defaultCompanyDisplayType),
          position: existing?.position ?? { x: 0, y: 0 },
          data: {
            ...(existing?.data ?? {}),
            label: node.label,
          },
        };
      });


      const uniquePairMap = new Map();
      company.edges.forEach((edge) => {
        const pairKey =
          edge.source < edge.target
            ? `${edge.source}|${edge.target}`
            : `${edge.target}|${edge.source}`;

        if (!uniquePairMap.has(pairKey)) {
          uniquePairMap.set(pairKey, {
            id: `${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
            type: "straight",
            data: { label: edge.label, value: edge.value },
            animated: true,
          });
        }
      });

      const rawEdges = Array.from(uniquePairMap.values());

      const positionedNodes = starLayout(rawNodes, parentId);
      updateGraphData(positionedNodes, rawEdges);

      const newChildIds = positionedNodes
        .map((n) => n.id)
        .filter((nid) => nid !== parentId && !visibleNodeIds.has(nid));

      setChildrenByParent((prev) => {
        const prevChildrenSet = prev[parentId] ?? new Set();
        const updatedChildrenSet = new Set(prevChildrenSet);
        newChildIds.forEach((nid) => updatedChildrenSet.add(nid));
        return { ...prev, [parentId]: updatedChildrenSet };
      });

      setVisibleNodeIds((prev) => {
        const next = new Set(prev);
        positionedNodes.forEach((n) => next.add(n.id));
        return next;
      });
    } catch (error) {
      console.error("Error fetching company:", error);
    } finally {
      setIsLoading(false);
    }
  }


  function findParentOf(childId, childrenByParentMap) {
    for (const [parentId, childrenSet] of Object.entries(childrenByParentMap)) {
      if (childrenSet.has(childId)) {
        return parentId;
      }
    }
    return null;
  }

  function getPathToRoot(nodeId) {
    if (!rootId) return [];
    const path = [nodeId];
    let current = nodeId;
    const seen = new Set([nodeId]);

    while (current !== rootId) {
      const parent = findParentOf(current, childrenByParent);
      if (!parent || seen.has(parent)) break;
      path.push(parent);
      seen.add(parent);
      current = parent;
    }

    return path.reverse();
  }


  const pathEdgeSet = useMemo(() => {
    const set = new Set();
    if (!rootId || !highlightPath) return set;

    const selectedNode = nodes.find((n) => n.selected);
    if (!selectedNode) return set;

    const path = getPathToRoot(selectedNode.id);
    if (path.length < 2) return set;

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      set.add(`${from}->${to}`);
    }

    return set;
  }, [nodes, rootId, childrenByParent, highlightPath]);

  const pathNodeIds = useMemo(() => {
    const set = new Set();
    if (!rootId || !highlightPath) return set;

    const selectedNode = nodes.find((n) => n.selected);
    if (!selectedNode) return set;

    const path = getPathToRoot(selectedNode.id);
    path.forEach((id) => set.add(id));
    return set;
  }, [nodes, rootId, childrenByParent, highlightPath]);


  const selectedNodeIds = useMemo(
    () => nodes.filter((n) => n.selected).map((n) => n.id),
    [nodes]
  );

  const filteredEdges = useMemo(
    () => edges.filter((edge) => edgeMatchesFilter(edge)),
    [edges, edgeFilter, rootId]
  );

  const displayEdges = useMemo(
    () =>
      filteredEdges.map((edge) => {
        const isConnected =
          selectedNodeIds.includes(edge.source) ||
          selectedNodeIds.includes(edge.target);
        const isOnPath = pathEdgeSet.has(`${edge.source}->${edge.target}`);

        return {
          ...edge,
          type: isConnected || isOnPath ? "detailed_edge" : "straight",
        };
      }),
    [filteredEdges, selectedNodeIds, pathEdgeSet]
  );

  const visibleByFilterNodeIds = useMemo(() => {
    const set = new Set();
    filteredEdges.forEach((edge) => {
      set.add(edge.source);
      set.add(edge.target);
    });
    if (rootId) set.add(rootId);
    return set;
  }, [filteredEdges, rootId]);

  const collectSubtreeIds = (parentId, childrenMap, depth = 0) => {
    const result = new Set();
    const directChildren = childrenMap[parentId];
    if (!directChildren) return result;

    for (const childId of directChildren) {
      result.add(childId);
      const sub = collectSubtreeIds(childId, childrenMap, depth + 1);
      for (const id of sub) result.add(id);
    }
    return result;
  };

  const collapseCompany = (parentId) => {
    const toRemove = collectSubtreeIds(parentId, childrenByParent);
    setNodes((prev) => prev.filter((n) => !toRemove.has(n.id)));
    setEdges((prev) =>
      prev.filter(
        (e) =>
          !toRemove.has(e.source) &&
          !toRemove.has(e.target) &&
          e.source !== parentId
      )
    );

    if (toRemove.size === 0) return;

    setVisibleNodeIds((prev) => {
      const next = new Set(prev);
      toRemove.forEach((id) => next.delete(id));
      return next;
    });

    setChildrenByParent((prev) => {
      const updated = { ...prev };
      toRemove.forEach((id) => delete updated[id]);
      Object.keys(updated).forEach((parent) => {
        const set = updated[parent];
        if (!set) return;
        const newSet = new Set(
          [...set].filter((childId) => !toRemove.has(childId))
        );
        updated[parent] = newSet;
      });
      return updated;
    });
  };



  const renderNodes = useMemo(
    () =>
      nodes.map((node) => {
        // Path-to-root nodes should always be "medium" (default display),
        // except the main node which keeps its special type.
        let effectiveType = node.type;
        if (
          pathNodeIds.has(node.id) &&
          node.type === "minimal_company_display"
        ) {
          effectiveType = "default_company_display";
        }

        return {
          ...node,
          type: effectiveType,
          data: {
            ...node.data,
            fetchCompany: (id) => fetchCompany(id),
            collapseCompany: (id) => collapseCompany(id),
            changeNodeType: (id, newType) => changeSingleNodeType(id, newType),
          },
        };
      }),
    [nodes, pathNodeIds]
  );

  const displayNodes = useMemo(
    () => renderNodes.filter((node) => visibleByFilterNodeIds.has(node.id)),
    [renderNodes, visibleByFilterNodeIds]
  );

  /* ---------- RENDER ---------- */

  return (
    <div
  className="w-full h-screen relative"
  style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}
>
      {/* Bottom Settings Panel */}
      <SettingsButton
      
        open={false}
        changing_default_company_display_tape_f={change_company_display_default}
        onEdgeFilterChange={setEdgeFilter}
        highlightPath={highlightPath}
        setHighlightPath={setHighlightPath}
      />

      {/* Main Graph Wrapper – centered container feeling */}
      <div className="h-full w-full px-4 md:px-6 py-4 md:py-6 relative flex flex-col">
        {/* Loading Overlay */}
        {showSpinner && (
  <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/60 backdrop-blur-sm">
    <div className="text-center">
      <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-lg font-medium text-indigo-600">
        Loading network...
      </p>
    </div>
  </div>
)}


        {/* Graph Card */}
        <div
          className={`flex-1 w-full rounded-2xl overflow-hidden shadow-xl border border-slate-200 transition-all duration-300 ${
            shouldShowPremiumBanner ? "blur-sm" : ""
          }`}
          style={{
            boxShadow: "0 20px 40px rgba(15, 23, 42, 0.15)",
          }}
        >
          <ReactFlow
            style={{
    background: "transparent",
  }}
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={companyNodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.05}
            maxZoom={4}
            zoomOnScroll
            zoomOnPinch
            zoomOnDoubleClick
            nodesDraggable={!shouldShowPremiumBanner}
            nodesConnectable={!shouldShowPremiumBanner}
            elementsSelectable={!shouldShowPremiumBanner}
          >
            <Background
              variant="dots"
              gap={18}
              size={1.2}
              color="rgba(0, 0, 0, 0.6)"

            />
            <MiniMap
              pannable
              zoomable
              style={{
                background: "#ffffff",
                border: "1px solid rgba(148, 163, 184, 0.7)",
                borderRadius: "10px",
                overflow: "hidden",
              }}
              nodeColor={(node) => {
                if (node.type === "main_company_display") return "#667eea";
                return "#a855f7";
              }}
            />
            <Controls
              style={{
                border: "1px solid rgba(148, 163, 184, 0.7)",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.25)",
              }}
            />
          </ReactFlow>
        </div>

        {/* Premium Overlay */}
        {shouldShowPremiumBanner && (
          <div className="absolute  inset-0 flex items-center justify-center z-50 pointer-events-none px-4">
            <div
              className="bg-white rounded-2xl p-8 max-w-lg w-full pointer-events-auto transform transition-all duration-300 hover:scale-[1.02]"
              style={{
                boxShadow: "0 24px 60px rgba(15, 23, 42, 0.35)",
                border: "1px solid rgba(148, 163, 184, 0.3)",
              }}
            >
              <div className="flex !p-5  flex-col items-center text-center !gap-6">
                <div className="w-18 h-18 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-indigo-500 to-purple-500">
                  <LockIcon className="text-white" style={{ fontSize: 34 }} />
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-slate-800">
                  Premium Feature
                </h3>

                <p className="text-base md:text-lg leading-relaxed text-slate-600">
                  Unlock the full company network visualization to explore
                  connections, relationships, and business structures in detail.
                </p>

                <div className="w-full space-y-3 mt-2 ">
                  <Link
                    to={isAuthenticated ? "/account#billing" : "/register"}
                    className="btn btn-primary w-full text-center !mb-2"
                  >
                    {isAuthenticated ? "Become a Subscriber" : "Sign Up to Subscribe"}
                  </Link>

                  <Link
                    to="/pricing"
                    className="btn btn-secondary w-full text-center"
                  >
                    Learn More
                  </Link>
                </div>

                <div className="mt-4 pt-4 border-t w-full border-slate-200">
                  <p className="text-sm text-slate-500">
                    <strong className="text-indigo-500">
                      Premium includes:
                    </strong>{" "}
                    Network visualization • Advanced filters • Export options •
                    Priority support
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
