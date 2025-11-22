import { useEffect, useMemo, useState } from "react";
import ReactFlow, {
    useEdgesState,
    useNodesState,
    Handle,
    getStraightPath,
    BaseEdge,
    EdgeLabelRenderer,
    Background,
    MiniMap,
    Controls,
} from "reactflow";
import 'reactflow/dist/style.css';

import FaceIcon from '@mui/icons-material/Face';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

import SettingsButton from "./GraphSettings";
import StoreIcon from '@mui/icons-material/Store';
import { companyNodeTypes } from "./CompanyNodeTypes";



const initialNodes = [
];
const initialEdges = [
];




function starLayout(nodes, mainNodeId) {
    const centerX = 0;
    const centerY = 0;
    const rootRadius = 400;
    const childRadius = 350;

    if (!nodes || nodes.length === 0) return [];


    const hasCustomPosition = (node) =>
        node.position &&
        (
            node.position.x !== 0 ||
            node.position.y !== 0 ||
            node.type === "main_company_display"
        );



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


    return (
        <>
            <BaseEdge
                {...props}
                path={edgePath}
                style={{
                    ...props.style,
                    stroke: 'blue',
                    strokeWidth: 3,
                }}
            />


            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className={`
w-12 h-12 
rounded-full
bg-white
backdrop-blur-lg
border border-black/25

flex
justify-center
items-center
shadow-xl

                    `}
                >

                    {props.data?.label === "Person" ?
                        <FaceIcon />
                        :
                        <LocationOnIcon />

                    }


                </div>

            </EdgeLabelRenderer>

        </>

    );
}

const edgeTypes = {
    detailed_edge: DetailedEdge,
}








export default function Graph({ id_that_was_passed }) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [defaultCompanyDisplayType, setDefaultCompanyDisplayType] = useState("default_company_display")


    const [visibleNodeIds, setVisibleNodeIds] = useState(() => new Set());
    const [childrenByParent, setChildrenByParent] = useState({});
    const [rootId, setRootId] = useState(null);



    function changeSingleNodeType(nodeId, newType) {
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === nodeId
                    ? { ...node, type: newType }
                    : node
            )
        );
    }







    function change_company_display_default(set_to_this_type){
        console.log("Changed the display to: ", set_to_this_type)
        setDefaultCompanyDisplayType(set_to_this_type);
    }





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
        const response = await fetch(`https://apibizray.bnbdevelopment.hu/api/v1/network/${id}`);

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

                type: existing?.type ?? (isMain ? "main_company_display" : defaultCompanyDisplayType),

                position: existing?.position ?? { x: 0, y: 0 },

                data: {
                    ...(existing?.data ?? {}),
                    label: node.label,
                },
            };
        });

        const rawEdges = company.edges.map((edge) => {
            const createdEdge = {
                id: `${edge.source}-${edge.target}`,
                source: edge.source,
                target: edge.target,
                type: "straight",
                data: { label: edge.label },
                animated: true,
            };

            return createdEdge;
        });


        const positionedNodes = starLayout(rawNodes, parentId);

        updateGraphData(positionedNodes, rawEdges);


        const newChildIds = positionedNodes
            .map((n) => n.id)
            .filter((nid) => nid !== parentId && !visibleNodeIds.has(nid));


        setChildrenByParent((prev) => {
            const prevChildrenSet = prev[parentId] ?? new Set();
            const updatedChildrenSet = new Set(prevChildrenSet);

            newChildIds.forEach((nid) => {
                updatedChildrenSet.add(nid);
            });

            return {
                ...prev,
                [parentId]: updatedChildrenSet,
            };
        });


        setVisibleNodeIds((prev) => {
            const next = new Set(prev);
            positionedNodes.forEach((n) => next.add(n.id));
            return next;
        });
    }



    useEffect(() => {
        console.log("VISIBLE NODE IDS (effect):", visibleNodeIds);
        console.log("CHILDREN BY PARENT (effect):", childrenByParent);
    }, [visibleNodeIds, childrenByParent]);



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
}, [defaultCompanyDisplayType]);


    useEffect(() => {
        fetchCompany(id_that_was_passed);
        //304173p
        //563319k
    }, [id_that_was_passed]);

    const selectedNodeIds = useMemo(
        () => nodes.filter((n) => n.selected).map((n) => n.id),
        [nodes]
    );

    const displayEdges = useMemo(
        () =>
            edges.map((edge) => {
                const isConnected =
                    selectedNodeIds.includes(edge.source) ||
                    selectedNodeIds.includes(edge.target);

                return {
                    ...edge,
                    type: isConnected ? 'detailed_edge' : 'straight',
                };
            }),
        [edges, selectedNodeIds]
    );




    const collectSubtreeIds = (parentId, childrenMap) => {
        const result = new Set();
        const directChildren = childrenMap[parentId];
        if (!directChildren) return result;

        for (const childId of directChildren) {
            result.add(childId);
            const sub = collectSubtreeIds(childId, childrenMap);
            for (const id of sub) {
                result.add(id);
            }
        }

        return result;
    };


    const collapseCompany = (parentId) => {
        const toRemove = collectSubtreeIds(parentId, childrenByParent);

        if (toRemove.size === 0) {
            return;
        }


        setNodes((prev) => prev.filter((n) => !toRemove.has(n.id)));


        setEdges((prev) =>
            prev.filter(
                (e) =>
                    !toRemove.has(e.source) &&
                    !toRemove.has(e.target) &&
                    e.source !== parentId
            )
        );


        setVisibleNodeIds((prev) => {
            const next = new Set(prev);
            toRemove.forEach((id) => next.delete(id));
            return next;
        });

        setChildrenByParent((prev) => {
            const updated = { ...prev };


            toRemove.forEach((id) => {
                delete updated[id];
            });


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
            nodes.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    fetchCompany: (id) => {
                        fetchCompany(id);
                    },
                    collapseCompany: (id) => {
                        collapseCompany(id);
                    },
                    changeNodeType: (id, newType) => changeSingleNodeType(id, newType),
                },
            })),
        [nodes, childrenByParent]
    );

    return (
        <>
            <div className="w-full h-[100vh] bg-blue-300 py-15 relative">
                
                <SettingsButton open={false} changing_default_company_display_tape_f={change_company_display_default}/>
                <div className="bg-blue-200 px-10 h-full w-full">
                    <div className="h-full w-full ">
                        <ReactFlow
                            style={{ backgroundColor: '#f3f5feff'}}
                            nodes={renderNodes}
                            edges={displayEdges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            nodeTypes={companyNodeTypes}
                            edgeTypes={edgeTypes}
                            fitView
                            fitViewOptions={{ padding: 0.3 }} 
                            
                            minZoom={0.05}
                            maxZoom={4}
                            zoomOnScroll
                            zoomOnPinch
                            zoomOnDoubleClick
                        >

                            <Background
                                variant="dots"
                                gap={20}
                                size={1}
                                color="#07111eff"
                            />


                            <MiniMap
                                pannable
                                zoomable
                            />


                            <Controls />
                        </ReactFlow>

                    </div>

                </div>

            </div>
        </>
    )
}










