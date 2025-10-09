# Frontend Participant Model Migration Guide

## Overview
The frontend has been updated to work with the new hierarchical Participant model. Project participants are now organized into groups with role assignments, replacing the simple user array.

## Type Changes

### Before
```typescript
interface Project {
  participants: User[];  // Simple array of users
}
```

### After
```typescript
interface ParticipantMember {
  user: User;
  roles: string[]; // Multiple project-specific roles
}

interface Participant {
  _id: string;
  name: string;
  description?: string;
  projectId: string;
  parentParticipant?: string | Participant;
  childParticipants: string[] | Participant[];
  members: ParticipantMember[];
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  participants: Participant[];  // Array of participant groups
}
```

## Updated Files

### 1. **types/index.ts**
- Added `ParticipantMember` interface
- Added `Participant` interface
- Updated `Project.participants` from `User[]` to `Participant[]`

### 2. **services/api.ts**
- Added `participantApi` with endpoints for:
  - Creating participant groups
  - Managing participant groups
  - Adding/updating/removing members from groups
- Removed deprecated `projectApi.addParticipant` and `projectApi.removeParticipant`

### 3. **utils/costUtils.ts**
- Added `getAllUsersFromParticipants()` helper function
- Updated `calculateProjectCost()` to extract users from participant groups

### 4. **pages/Project.tsx**
- Updated Team Members section to display hierarchical participant groups
- Shows group name, description, and members with their roles
- Members display: name, roles (comma-separated), level, and daily fee

### 5. **components/ProjectRow.tsx**
- Updated participant count to sum all members across groups
- Changed label from "Participants" to "Team Members"

### 6. **components/dialogs/CreateProjectDialog.tsx**
- Removed participant selection during project creation
- Added informational note about managing participants after creation
- Participants now managed separately via participant groups

### 7. **pages/Organization.tsx**
- Updated user project filtering to check membership in participant groups
- Now searches through participant groups → members → user

## API Usage Examples

### Creating a Participant Group

```typescript
import { participantApi } from '@/services/api';

// Create a participant group for a project
const group = await participantApi.create(projectId, {
  name: 'Development Team',
  description: 'Core development team members',
  parentParticipant: null  // or parent group ID
});
```

### Adding Members to a Group

```typescript
// Add a member with multiple roles
await participantApi.addMember(
  participantGroupId,
  userId,
  ['Frontend Dev', 'UI/UX Designer']
);
```

### Updating Member Roles

```typescript
// Update a member's roles
await participantApi.updateMemberRoles(
  participantGroupId,
  userId,
  ['Lead Developer', 'Architect']
);
```

### Removing a Member

```typescript
// Remove a member from a group
await participantApi.removeMember(participantGroupId, userId);
```

## Component Usage Patterns

### Displaying Participant Groups

```tsx
{project.participants?.map(group => (
  <div key={group._id}>
    <h3>{group.name}</h3>
    <p>{group.description}</p>
    
    {group.members.map(member => (
      <div key={member.user._id}>
        <span>{member.user.name}</span>
        <span>{member.roles.join(', ')}</span>
        <span>${member.user.dailyFee}/day</span>
      </div>
    ))}
  </div>
))}
```

### Getting All Users from Participant Groups

```typescript
const getAllUsers = (project: Project): User[] => {
  const userMap = new Map<string, User>();
  
  project.participants.forEach(group => {
    group.members.forEach(member => {
      if (!userMap.has(member.user._id)) {
        userMap.set(member.user._id, member.user);
      }
    });
  });
  
  return Array.from(userMap.values());
};
```

### Counting Total Team Members

```typescript
const totalMembers = project.participants?.reduce(
  (count, group) => count + group.members.length,
  0
) || 0;
```

### Checking if User is in Project

```typescript
const isUserInProject = (project: Project, userId: string): boolean => {
  return project.participants.some(group =>
    group.members.some(member => member.user._id === userId)
  );
};
```

### Getting User's Roles in Project

```typescript
const getUserRoles = (project: Project, userId: string): string[] => {
  const roles = new Set<string>();
  
  project.participants.forEach(group => {
    group.members.forEach(member => {
      if (member.user._id === userId) {
        member.roles.forEach(role => roles.add(role));
      }
    });
  });
  
  return Array.from(roles);
};
```

## Migration Checklist

- [x] Update TypeScript interfaces
- [x] Update API service with participant endpoints
- [x] Update cost calculation utilities
- [x] Update Project detail page display
- [x] Update project list display
- [x] Remove participant selection from project creation
- [x] Update user project filtering logic
- [ ] **TODO**: Create UI for managing participant groups
- [ ] **TODO**: Create UI for adding/editing members within groups
- [ ] **TODO**: Add visualization for hierarchical group structure
- [ ] **TODO**: Add bulk operations for member management

## Breaking Changes

1. **Project Creation**: No longer accepts `participants` array
   - Participants must be added after project creation via participant groups

2. **Project Type**: `project.participants` is now `Participant[]` instead of `User[]`
   - Must access users via `participant.members[].user`

3. **API Endpoints**: Old participant endpoints removed
   - Use `participantApi` instead of `projectApi.addParticipant/removeParticipant`

## Benefits

✅ **Organized Structure**: Team members grouped logically  
✅ **Multi-Role Support**: Users can have multiple project-specific roles  
✅ **Hierarchical**: Supports parent-child relationships between groups  
✅ **Flexible**: Better represents real-world team organization  
✅ **Type-Safe**: Full TypeScript support for new structure  

## Future Enhancements

1. **Participant Group Management UI**: Build comprehensive UI for creating and managing groups
2. **Drag-and-Drop**: Allow reordering groups and moving members between groups
3. **Role Templates**: Predefined role sets (PM, Dev Team, QA Team, etc.)
4. **Visual Hierarchy**: Tree view or org-chart style visualization
5. **Permissions**: Role-based permissions within projects
6. **History**: Track member role changes over time
7. **Reports**: Team composition and allocation reports

## Notes

- The old participant management through project creation dialog has been deprecated
- Participant groups should be managed through dedicated UI components (to be built)
- All existing code accessing `project.participants` as `User[]` has been updated
- Cost calculations now aggregate across all participant groups

