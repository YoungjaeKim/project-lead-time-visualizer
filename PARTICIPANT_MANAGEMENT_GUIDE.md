# Participant Management Guide

## Overview

The participant management system allows you to organize project team members into hierarchical groups with specific roles. This replaces the simple user-project relationship with a more structured approach.

## Key Features

### 1. **Hierarchical Participant Groups**
- Create groups (e.g., "Development Team", "Planning Group", "QA Team")
- Set parent-child relationships between groups
- Add descriptions to clarify each group's purpose

### 2. **Multi-Role Member Assignment**
- Each member can have multiple roles within a group
- Common roles include: Project Manager, Tech Lead, Frontend Developer, Backend Developer, QA Engineer, etc.
- Support for custom roles

### 3. **Project-Specific Organization**
- Each project has its own participant structure
- Independent of the organization hierarchy
- Focused on project-specific responsibilities

## How to Use

### Creating a Participant Group

1. Navigate to a project page
2. In the "Team Structure" card (right sidebar), click the **"+ Group"** button
3. Fill in the group details:
   - **Group Name** (required): e.g., "Backend Development Team"
   - **Description** (optional): Describe the group's purpose
   - **Parent Group** (optional): Select a parent group to create hierarchy
4. Click **"Add Group"**

### Adding Members to a Group

1. In the Team Structure section, find the group you want to add members to
2. Click the **"Add"** button (with Users icon) on the group card
3. Select a user from the dropdown
4. Add one or more roles:
   - Select from common roles dropdown, OR
   - Enter a custom role and click "Add"
5. Click **"Add Member"**

### Removing Members

1. Hover over a member in the group
2. Click the trash icon that appears on the right
3. Confirm the removal

### Deleting a Participant Group

1. Click the trash icon in the group header
2. Confirm deletion (this will also remove all members from the group)

## Technical Implementation

### Backend API Endpoints

#### Participant Groups
- `POST /api/projects/:projectId/participants` - Create a new participant group
- `GET /api/projects/:projectId/participants` - Get all participant groups for a project
- `GET /api/participants/:id` - Get a specific participant group
- `PUT /api/participants/:id` - Update a participant group
- `DELETE /api/participants/:id` - Delete a participant group

#### Member Management
- `POST /api/participants/:participantId/members` - Add a member to a group
  ```json
  {
    "userId": "user_id_here",
    "roles": ["Frontend Developer", "UI/UX Designer"]
  }
  ```
- `PUT /api/participants/:participantId/members/:userId` - Update member roles
  ```json
  {
    "roles": ["Tech Lead", "Backend Developer"]
  }
  ```
- `DELETE /api/participants/:participantId/members/:userId` - Remove a member from a group

### Data Model

#### Participant Schema
```typescript
{
  name: string;                    // Group name
  description?: string;            // Optional description
  projectId: string;               // Reference to project
  parentParticipant?: string;      // Optional parent group ID
  members: [{
    user: string;                  // Reference to User
    roles: string[];               // Array of role names
  }];
  createdAt: Date;
  updatedAt: Date;
}
```

### Frontend Components

#### New Dialogs
- **AddParticipantGroupDialog**: Create new participant groups
- **AddMemberDialog**: Add members to groups with role selection

#### Updated Components
- **Project.tsx**: 
  - Enhanced Team Structure card with add/remove controls
  - Participant group management functions
  - Member management functions
- **AddEventDialog**: Now shows only users who are project participants
- **EventCard**: Displays only project-specific participants

## Benefits

1. **Better Organization**: Group team members by function or responsibility
2. **Clear Roles**: Each member can have multiple, well-defined roles
3. **Hierarchical Structure**: Reflect real team structures with parent-child relationships
4. **Project Focus**: Each project maintains its own team structure
5. **Accurate Event Assignment**: Events can only be assigned to actual project participants
6. **Cost Tracking**: Automatically calculate project costs based on participant members

## Example Structure

```
Project: E-commerce Platform
├── Planning Group
│   ├── John Doe (Project Manager, Product Owner)
│   └── Jane Smith (Business Analyst)
├── Development Team
│   ├── Backend Team (parent: Development Team)
│   │   ├── Bob Johnson (Tech Lead, Backend Developer)
│   │   └── Alice Williams (Backend Developer)
│   └── Frontend Team (parent: Development Team)
│       ├── Carol Davis (Frontend Developer, UI/UX Designer)
│       └── Dave Miller (Frontend Developer)
└── QA Team
    └── Eve Wilson (QA Engineer, Test Lead)
```

## Migration Notes

- **Before**: Projects had a simple `participants: User[]` array
- **After**: Projects have `participants: Participant[]` where each Participant is a group containing members
- All users in participant groups are automatically extracted for event assignment
- Project cost calculations now aggregate costs from all participant group members

## Future Enhancements

Potential improvements for the participant management system:

1. **Role Templates**: Pre-defined role sets for common team structures
2. **Bulk Member Import**: Import multiple members at once
3. **Member Transfer**: Move members between groups
4. **Role History**: Track role changes over time
5. **Group Templates**: Save and reuse common group structures
6. **Permission System**: Role-based access control within projects
7. **Workload Visualization**: See member distribution across groups
8. **Time-based Participation**: Track when members join/leave groups

