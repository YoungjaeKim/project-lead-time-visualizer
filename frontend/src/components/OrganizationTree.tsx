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
  // Calculate positions using a simple tree layout algorithm
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (organizations.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Helper function to extract parent ID (handles string and populated object)
    const getParentId = (org: Organization): string | undefined => {
      if (!org.parentOrganization) return undefined;

      // If parentOrganization is populated as an object, extract _id
      if (typeof org.parentOrganization === 'object' && '_id' in org.parentOrganization) {
        return (org.parentOrganization as any)._id;
      }

      // Otherwise it's already a string (MongoDB ObjectIds are serialized as strings in JSON)
      return org.parentOrganization as string;
    };

    // Build a map to track organization levels and positions
    const orgMap = new Map<string, { org: Organization; level: number; children: string[]; parentId?: string }>();
    const rootOrgs: string[] = [];

    // First pass: identify all organizations and their relationships
    organizations.forEach(org => {
      const parentId = getParentId(org);
      orgMap.set(org._id, { org, level: 0, children: [], parentId });
      if (!parentId) {
        rootOrgs.push(org._id);
      }
    });

    // Second pass: build children relationships and calculate levels
    organizations.forEach(org => {
      const node = orgMap.get(org._id)!;
      if (node.parentId && orgMap.has(node.parentId)) {
        const parent = orgMap.get(node.parentId)!;
        parent.children.push(org._id);
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

    orgMap.forEach((node, orgId) => {
      const levelNodes = levelGroups.get(node.level)!;
      const indexInLevel = levelNodes.indexOf(orgId);
      const levelWidth = levelNodes.length * horizontalSpacing;
      const startX = -levelWidth / 2 + horizontalSpacing / 2;

      const userCount = users.filter(u => u.mainOrganization === orgId).length;

      nodes.push({
        id: orgId,
        type: 'default',
        data: {
          organization: node.org,
          label: node.org.name,
          userCount,
        },
        position: {
          x: startX + indexInLevel * horizontalSpacing,
          y: node.level * verticalSpacing
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });

      // Create edges
      if (node.parentId) {
        edges.push({
          id: `${node.parentId}-${orgId}`,
          source: node.parentId,
          target: orgId,
          type: 'smoothstep',
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      }
    });

    return { nodes, edges };
  }, [organizations, users]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as OrganizationNodeData;
      if (onOrganizationClick && data.organization) {
        onOrganizationClick(data.organization);
      }
    },
    [onOrganizationClick]
  );

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

