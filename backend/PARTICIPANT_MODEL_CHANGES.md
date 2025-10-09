# Participant Model Refactoring

## Overview
The `participants` field in the Project model has been refactored from a simple array of User references to a hierarchical structure that supports grouping and multi-role assignments.

## Key Changes

### 1. New Model: `Participant`
- **Purpose**: Represents a hierarchical group of team members within a project
- **Features**:
  - Hierarchical structure (parent/child relationships)
  - Multiple roles per member
  - Project-specific organization

### 2. Updated Project Model
- **Before**: `participants: [User]` - flat array of user references
- **After**: `participants: [Participant]` - array of participant group references

### 3. Data Structure

```typescript
// Old Structure
project: {
  participants: [userId1, userId2, userId3]
}

// New Structure
project: {
  participants: [
    {
      id: "xxxx",
      name: "Planning Group",
      members: [
        { user: User1, roles: ["Lead", "Planning Manager"] },
        { user: User2, roles: ["PM"] }
      ],
      parentParticipant: null,
      childParticipants: ["yyyy"]
    },
    {
      id: "yyyy",
      name: "Dev Group",
      members: [
        { user: User3, roles: ["Front Dev", "QA"] },
        { user: User4, roles: ["Backend Dev"] }
      ],
      parentParticipant: "xxxx",
      childParticipants: []
    }
  ]
}
```

## API Endpoints

### Participant Group Management
- `POST /api/projects/:projectId/participants` - Create participant group
- `GET /api/projects/:projectId/participants` - Get all participant groups
- `GET /api/participants/:id` - Get specific participant group
- `PUT /api/participants/:id` - Update participant group
- `DELETE /api/participants/:id` - Delete participant group

### Member Management
- `POST /api/participants/:participantId/members` - Add member to group
  ```json
  { "userId": "...", "roles": ["PM", "Lead"] }
  ```
- `PUT /api/participants/:participantId/members/:userId` - Update member roles
  ```json
  { "roles": ["Dev", "QA"] }
  ```
- `DELETE /api/participants/:participantId/members/:userId` - Remove member

### Project Routes (Updated)
- Removed: `POST /projects/:projectId/participants/:userId`
- Removed: `DELETE /projects/:projectId/participants/:userId`
- Updated: `GET /projects/:id/cost-analysis` - Now aggregates across participant groups

## Migration Notes

### Breaking Changes
1. **Direct participant management removed**: Use participant group endpoints instead
2. **Population changed**: Project participants now populate as groups with nested members
3. **Cost analysis updated**: Now includes role information per user

### Benefits
1. **Better organization**: Team members organized hierarchically
2. **Multi-role support**: One person can have multiple roles in a project
3. **Flexible structure**: Mirrors real-world team organization
4. **No redundancy**: Single source of truth for project members

## Example Usage

### Creating a Project Team Structure

```javascript
// 1. Create project
const project = await axios.post('/projects', { name: 'New Project', ... });

// 2. Create top-level participant group
const planningGroup = await axios.post(
  `/api/projects/${project.id}/participants`,
  {
    name: 'Planning Group',
    description: 'Project planning and management team'
  }
);

// 3. Add members to planning group
await axios.post(
  `/api/participants/${planningGroup.id}/members`,
  { userId: 'user1', roles: ['Project Manager', 'Lead'] }
);

// 4. Create child participant group
const devGroup = await axios.post(
  `/api/projects/${project.id}/participants`,
  {
    name: 'Development Team',
    parentParticipant: planningGroup.id
  }
);

// 5. Add developers with multiple roles
await axios.post(
  `/api/participants/${devGroup.id}/members`,
  { userId: 'user2', roles: ['Frontend Dev', 'UI/UX'] }
);
```

### Querying Project with Participants

```javascript
const project = await axios.get(`/projects/${projectId}`);

// Access structure
project.participants.forEach(group => {
  console.log(`Group: ${group.name}`);
  group.members.forEach(member => {
    console.log(`  - ${member.user.name}: ${member.roles.join(', ')}`);
  });
});
```

## TypeScript Interfaces

```typescript
interface IParticipantMember {
  user: string; // User ID (populated to IUser)
  roles: string[]; // e.g., ["PM", "Lead", "Dev"]
}

interface IParticipant {
  name: string;
  description?: string;
  projectId: string;
  parentParticipant?: string;
  childParticipants: string[];
  members: IParticipantMember[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface IProject {
  // ... other fields
  participants: string[]; // References to Participant model
  // ... other fields
}
```

