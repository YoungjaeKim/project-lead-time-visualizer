import React, { useMemo, useCallback } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Organization, User } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users } from 'lucide-react';

interface OrganizationTreeProps {
  organizations: Organization[];
  users: User[];
  onOrganizationClick?: (org: Organization) => void;
}

interface OrganizationNodeData extends Record<string, unknown> {
  organization: Organization;
  userCount: number;
}

// Custom node component
const OrganizationNode: React.FC<{ data: OrganizationNodeData }> = ({ data }) => {
  const { organization, userCount } = data;
  
  return (
    <div className="px-4 py-3 shadow-md rounded-lg bg-white border-2 border-blue-400 min-w-[200px]">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="w-5 h-5 text-blue-500" />
        <div className="font-semibold text-sm text-neutral-800">
          {organization.name}
        </div>
      </div>
      {organization.description && (
        <div className="text-xs text-neutral-500 mb-2 line-clamp-2">
          {organization.description}
        </div>
      )}
      {userCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-neutral-600 mt-2 pt-2 border-t border-neutral-200">
          <Users className="w-3 h-3" />
          <span>{userCount} {userCount === 1 ? 'member' : 'members'}</span>
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  organizationNode: OrganizationNode,
};

const OrganizationTree: React.FC<OrganizationTreeProps> = ({ 
  organizations, 
  users,
  onOrganizationClick 
}) => {
  // Check if data is ready
  const isDataReady = organizations.length > 0 && users.length >= 0;
  
  // Calculate positions using a simple tree layout algorithm
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    console.log('🔍 OrganizationTree: Starting edge calculation with organizations:', organizations.length, 'users:', users.length);
    
    if (organizations.length === 0) {
      console.log('⚠️ OrganizationTree: No organizations found, returning empty nodes and edges');
      return { nodes: [], edges: [] };
    }

    // Helper function to extract parent ID (handles string and populated object)
    const getParentId = (org: Organization): string | undefined => {
      if (!org.parentOrganization) {
        console.log(`📋 Org "${org.name}" has no parent organization`);
        return undefined;
      }
      
      let parentId: string | undefined;
      
      // If parentOrganization is populated as an object, extract _id
      if (typeof org.parentOrganization === 'object' && '_id' in org.parentOrganization) {
        parentId = (org.parentOrganization as any)._id;
        console.log(`📋 Org "${org.name}" parent extracted from object: ${parentId}`);
      } else {
        // Otherwise it's already a string (MongoDB ObjectIds are serialized as strings in JSON)
        parentId = org.parentOrganization as string;
        console.log(`📋 Org "${org.name}" parent as string: ${parentId}`);
      }
      
      // Validate that parentId is not null, undefined, or empty string
      if (!parentId || parentId === 'null' || parentId === 'undefined') {
        console.warn(`⚠️ Invalid parent ID for org "${org.name}": ${parentId}`);
        return undefined;
      }
      
      return parentId;
    };

    // Build a map to track organization levels and positions
    const orgMap = new Map<string, { org: Organization; level: number; children: string[]; parentId?: string }>();
    const rootOrgs: string[] = [];
    
    // First pass: identify all organizations and their relationships
    organizations.forEach(org => {
      // Validate organization ID
      if (!org._id || org._id === 'null' || org._id === 'undefined') {
        console.error(`❌ Invalid organization ID found:`, org);
        return; // Skip this organization
      }
      
      const parentId = getParentId(org);
      console.log(`📋 Org "${org.name}" (${org._id}): parentId = ${parentId || 'ROOT'}`);
      orgMap.set(org._id, { org, level: 0, children: [], parentId });
      if (!parentId) {
        rootOrgs.push(org._id);
      }
    });
    
    console.log('🌳 Root organizations:', rootOrgs.length, rootOrgs);

    // Second pass: build children relationships and calculate levels
    organizations.forEach(org => {
      const node = orgMap.get(org._id)!;
      if (node.parentId && orgMap.has(node.parentId)) {
        const parent = orgMap.get(node.parentId)!;
        parent.children.push(org._id);
        console.log(`🔗 Added child "${org.name}" to parent "${parent.org.name}"`);
      }
    });
    
    // Log parent-child relationships
    console.log('👨‍👩‍👧‍👦 Parent-child relationships:');
    orgMap.forEach((node, orgId) => {
      if (node.children.length > 0) {
        console.log(`  "${node.org.name}" has ${node.children.length} children:`, node.children.map(childId => orgMap.get(childId)?.org.name));
      }
    });

    // Calculate levels (depth in tree)
    const calculateLevels = (orgId: string, level: number = 0) => {
      const node = orgMap.get(orgId);
      if (!node) return;
      
      node.level = level;
      node.children.forEach(childId => calculateLevels(childId, level + 1));
    };

    rootOrgs.forEach(rootId => calculateLevels(rootId));

    // Group nodes by level for positioning
    const levelGroups = new Map<number, string[]>();
    orgMap.forEach((node, orgId) => {
      const level = node.level;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(orgId);
    });

    // Calculate positions
    const horizontalSpacing = 300;
    const verticalSpacing = 150;
    const nodes: Node<OrganizationNodeData>[] = [];
    const edges: Edge[] = [];

    console.log('🏗️ Phase 1: Creating all nodes first...');
    
    // PHASE 1: Create all nodes first
    orgMap.forEach((node, orgId) => {
      const levelNodes = levelGroups.get(node.level)!;
      const indexInLevel = levelNodes.indexOf(orgId);
      const levelWidth = levelNodes.length * horizontalSpacing;
      const startX = -levelWidth / 2 + horizontalSpacing / 2;

      const userCount = users.filter(u => u.mainOrganization === orgId).length;

      const reactFlowNode = {
        id: orgId,
        type: 'default',
        data: { 
          organization: node.org,
          userCount 
        },
        position: { 
          x: startX + indexInLevel * horizontalSpacing, 
          y: node.level * verticalSpacing 
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
      
      nodes.push(reactFlowNode);
      console.log(`📦 Created node: "${node.org.name}" (${orgId}) at level ${node.level}`);
    });

    console.log(`✅ Phase 1 complete: Created ${nodes.length} nodes`);
    console.log('🔗 Phase 2: Creating edges between existing nodes...');

    // PHASE 2: Create edges after all nodes exist
    orgMap.forEach((node, orgId) => {
      if (node.parentId) {
        // Validate that both source and target exist in orgMap
        const parentExists = orgMap.has(node.parentId);
        const currentExists = orgMap.has(orgId);
        
        if (!parentExists) {
          console.error(`❌ Parent organization not found for edge: ${node.parentId} → ${orgId}. Parent "${node.parentId}" does not exist in orgMap`);
          return;
        }
        
        if (!currentExists) {
          console.error(`❌ Current organization not found for edge: ${node.parentId} → ${orgId}. Current "${orgId}" does not exist in orgMap`);
          return;
        }
        
        // Additional validation for null/undefined values
        if (node.parentId === 'null' || node.parentId === 'undefined' || !node.parentId.trim()) {
          console.error(`❌ Invalid parent ID for edge creation: "${node.parentId}" → ${orgId}`);
          return;
        }
        
        if (orgId === 'null' || orgId === 'undefined' || !orgId.trim()) {
          console.error(`❌ Invalid org ID for edge creation: ${node.parentId} → "${orgId}"`);
          return;
        }
        
        // Verify that both nodes exist in the nodes array (double-check)
        const sourceNodeExists = nodes.some(n => n.id === node.parentId);
        const targetNodeExists = nodes.some(n => n.id === orgId);
        
        if (!sourceNodeExists) {
          console.error(`❌ Source node not found in nodes array: ${node.parentId}`);
          return;
        }
        
        if (!targetNodeExists) {
          console.error(`❌ Target node not found in nodes array: ${orgId}`);
          return;
        }
        
        const edge = {
          id: `${node.parentId}-${orgId}`,
          source: node.parentId,
          target: orgId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3b82f6',
          },
        };
        edges.push(edge);
        console.log(`➡️ Created edge: ${orgMap.get(node.parentId)?.org.name} → ${node.org.name}`, edge);
      }
    });

    console.log(`✅ Phase 2 complete: Created ${edges.length} edges`);
    
    console.log('🔗 Final edges array:', edges.length, edges);
    console.log('📦 Final nodes array:', nodes.length, nodes);

    return { nodes, edges };
  }, [organizations, users]);

  // Only initialize ReactFlow state when data is ready
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<OrganizationNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  // Update nodes and edges when initial data changes and is ready
  React.useEffect(() => {
    if (isDataReady && (initialNodes.length > 0 || initialEdges.length > 0)) {
      console.log('🔄 Updating ReactFlow with new data - nodes:', initialNodes.length, 'edges:', initialEdges.length);
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges, isDataReady, setNodes, setEdges]);
  
  // Log nodes state changes
  React.useEffect(() => {
    console.log('🔄 Nodes state updated:', nodes.length, nodes);
  }, [nodes]);
  
  // Log edges state changes
  React.useEffect(() => {
    console.log('🔄 Edges state updated:', edges.length, edges);
  }, [edges]);
  
  // Log initial values
  React.useEffect(() => {
    console.log('🚀 Initial nodes calculated:', initialNodes.length, initialNodes);
    console.log('🚀 Initial edges calculated:', initialEdges.length, initialEdges);
    console.log('📊 Data ready status:', isDataReady);
  }, [initialNodes, initialEdges, isDataReady]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      console.log('🖱️ Node clicked:', node.id, node);
      const data = node.data as OrganizationNodeData;
      if (onOrganizationClick && data.organization) {
        onOrganizationClick(data.organization);
      }
    },
    [onOrganizationClick]
  );

  // Show loading state while data is being prepared
  if (!isDataReady) {
    return (
      <Card className="border border-neutral-200 bg-white shadow-sm">
        <CardContent className="p-8 text-center">
          <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-3 animate-pulse" />
          <p className="text-neutral-500">Loading organization tree...</p>
          <p className="text-sm text-neutral-400 mt-1">Preparing data for visualization</p>
        </CardContent>
      </Card>
    );
  }

  if (organizations.length === 0) {
    return (
      <Card className="border border-neutral-200 bg-white shadow-sm">
        <CardContent className="p-8 text-center">
          <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No organizations found</p>
          <p className="text-sm text-neutral-400 mt-1">Create your first organization to get started</p>
        </CardContent>
      </Card>
    );
  }

  // Don't render ReactFlow until we have nodes or edges to display
  if (nodes.length === 0 && edges.length === 0) {
    return (
      <Card className="border border-neutral-200 bg-white shadow-sm">
        <CardContent className="p-8 text-center">
          <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-3 animate-pulse" />
          <p className="text-neutral-500">Preparing organization tree...</p>
          <p className="text-sm text-neutral-400 mt-1">Building visualization data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-neutral-200 bg-white shadow-sm">
      <CardContent className="p-0">
        <div className="w-full h-[500px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.5}
            maxZoom={1.5}
            defaultEdgeOptions={{
              animated: true,
            }}
            onInit={() => console.log('🎯 ReactFlow initialized with nodes:', nodes.length, 'edges:', edges.length)}
          >
            <Background color="#e5e7eb" gap={16} />
            <Controls />
            <MiniMap 
              nodeColor={(node) => '#60a5fa'}
              maskColor="rgba(0, 0, 0, 0.1)"
              className="bg-neutral-100"
            />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationTree;

