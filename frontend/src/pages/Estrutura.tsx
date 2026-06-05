import { useEffect, useMemo, useState } from "react";
import SearchBar from "../components/SearchBar";
import { fetchSchemaExplorer, type SchemaTable } from "../lib/api";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Node,
  NodeProps,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  Edge,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

type TableNodeData = { table: SchemaTable };

const NODE_WIDTH = 280;
const NODE_HEIGHT = 140;

function getVisibleTables(allTables: SchemaTable[], query: string) {
  if (!query.trim()) return allTables;

  const q = query.toLowerCase();
  const byName = new Map(allTables.map((t) => [t.table, t]));
  const seed = allTables.filter((table) => {
    const tableMatch = table.table.toLowerCase().includes(q);
    const columnMatch = table.columns.some((col) => col.name.toLowerCase().includes(q));
    const relationMatch = table.relations.some(
      (rel) =>
        rel.from_column.toLowerCase().includes(q) ||
        rel.to_table.toLowerCase().includes(q) ||
        rel.to_column.toLowerCase().includes(q)
    );
    return tableMatch || columnMatch || relationMatch;
  });

  const visible = new Map<string, SchemaTable>();
  const queue = [...seed];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visible.has(current.table)) continue;
    visible.set(current.table, current);

    current.relations.forEach((rel) => {
      const target = byName.get(rel.to_table);
      if (target && !visible.has(target.table)) queue.push(target);
    });

    allTables.forEach((candidate) => {
      const pointsToCurrent = candidate.relations.some((rel) => rel.to_table === current.table);
      if (pointsToCurrent && !visible.has(candidate.table)) queue.push(candidate);
    });
  }

  return Array.from(visible.values());
}

function buildGraph(tables: SchemaTable[]) {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 120, marginx: 20, marginy: 20 });

  const nodes: Node<TableNodeData>[] = tables.map((table) => {
    graph.setNode(table.table, { width: NODE_WIDTH, height: NODE_HEIGHT });
    return {
      id: table.table,
      type: "schemaTable",
      data: { table },
      position: { x: 0, y: 0 },
      style: { background: "transparent", border: "none", boxShadow: "none" },
    } as Node<TableNodeData>;
  });

  const edges: Edge[] = [];
  tables.forEach((table) => {
    table.relations.forEach((rel, idx) => {
      const targetExists = tables.some((candidate) => candidate.table === rel.to_table);
      if (!targetExists) return;

      graph.setEdge(table.table, rel.to_table);
      edges.push({
        id: `e-${table.table}-${rel.from_column}-${rel.to_table}-${rel.to_column}-${idx}`,
        source: table.table,
        target: rel.to_table,
        label: `${rel.from_column} → ${rel.to_table}.${rel.to_column}`,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        labelStyle: { fill: "#374151", fontWeight: 600, fontSize: 11 },
        labelBgStyle: { fill: "rgba(255,255,255,0.95)" },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 6,
      });
    });
  });

  dagre.layout(graph);

  const positionedNodes = nodes.map((node) => {
    const pos = graph.node(node.id) as { x: number; y: number } | undefined;
    if (pos) {
      node.position = { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 };
    }
    return node;
  });

  return { nodes: positionedNodes, edges };
}

function SchemaTableNode({ data }: NodeProps<TableNodeData>) {
  const { table } = data;
  return (
    <div className="relative w-[280px] rounded-2xl border border-[#d1d5db] bg-white shadow-sm dark:border-[#3a3a3a] dark:bg-[#111111]">
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-none !bg-[#2d6a4f]" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-none !bg-[#2d6a4f]" />

      <div className="border-b border-[#e5e7eb] px-4 py-3 dark:border-[#3a3a3a]">
        <div className="text-[14px] font-semibold text-[#1f2937] dark:text-white">{table.table}</div>
        <div className="text-[11px] text-[#6b7280] dark:text-[#9ca3af]">{table.columns.length} colunas</div>
      </div>

      <div className="max-h-40 overflow-auto px-4 py-3">
        {table.columns.map((column) => (
          <div key={column.name} className="flex items-center justify-between gap-3 py-1 text-[12px]">
            <span className="truncate text-[#1f2937] dark:text-[#f3f4f6]">{column.name}</span>
            <span className="shrink-0 text-[#9ca3af] dark:text-[#6b7280]">{column.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Estrutura() {
  const [search, setSearch] = useState("");
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TableNodeData>[]>([] as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);

  useEffect(() => {
    let mounted = true;

    const loadSchema = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSchemaExplorer();
        if (mounted) setTables(data);
      } catch {
        if (mounted) {
          setTables([]);
          setError("Nao foi possivel carregar o esquema da base de dados.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadSchema();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleTables = useMemo(() => getVisibleTables(tables, search), [tables, search]);

  useEffect(() => {
    const { nodes: graphNodes, edges: graphEdges } = buildGraph(visibleTables);
    setNodes(graphNodes as any);
    setEdges(graphEdges as any);
  }, [visibleTables, setNodes, setEdges]);

  const nodeTypes = useMemo(
    () => ({
      schemaTable: SchemaTableNode,
    }),
    []
  );

  return (
    <div className="flex-1 overflow-hidden bg-[#fafafa] px-6 py-6 dark:bg-[#0b0b0b]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#1f2937] dark:text-white">Estrutura do Sistema</h1>
          <p className="text-[13px] text-[#6b7280] dark:text-[#9ca3af]">Grafo interativo das tabelas e das relações entre elas</p>
        </div>
        <div className="w-[340px] max-w-full">
          <SearchBar placeholder="Procurar tabelas ou colunas..." value={search} onChange={setSearch} />
        </div>
      </div>

      <div className="h-[calc(100vh-160px)] overflow-hidden rounded-[20px] border border-[#e5e7eb] bg-white shadow-sm dark:border-[#222] dark:bg-[#0b0b0b]">
        {error ? (
          <div className="p-6 text-[13px] text-[#b91c1c]">{error}</div>
        ) : loading ? (
          <div className="p-6 text-[13px] text-[#6b7280] dark:text-[#9ca3af]">A carregar estrutura...</div>
        ) : visibleTables.length === 0 ? (
          <div className="p-6 text-[13px] text-[#6b7280] dark:text-[#9ca3af]">Nenhuma tabela encontrada.</div>
        ) : (
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes as any}
              edges={edges as any}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              nodesDraggable
              nodesConnectable={false}
              elementsSelectable
              panOnScroll
              zoomOnScroll
              zoomOnPinch
              className="bg-[#fafafa] dark:bg-[#0b0b0b]"
            >
              <Background gap={18} size={1} color="#e5e7eb" />
              <Controls />
              <MiniMap
                nodeStrokeColor="#2d6a4f"
                nodeColor="#dcfce7"
                maskColor="rgba(11, 11, 11, 0.15)"
              />
            </ReactFlow>
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}