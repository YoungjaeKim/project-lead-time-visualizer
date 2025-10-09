# Participant Workflow Guide

## Overview
This guide explains how to properly create and manage projects with the new hierarchical Participant model.

---

## Correct Workflow for Creating Projects with Participants

### Step 1: Create the Project (Without Participants)
Projects are now created **without** participants initially. The Create Project dialog no longer includes participant selection.

```typescript
// Example: Creating a project
const projectData = {
  name: "New Website Development",
  description: "Company website redesign",
  status: "planning",
  startDate: new Date("2024-01-01"),
  budget: 50000,
  estimatedCost: 45000
  // Note: No participants field!
};
```

### Step 2: Create Participant Groups
After creating the project, you add participant groups through the Participant API.

```typescript
// Create a planning team group
const planningTeam = await participantApi.create(projectId, {
  name: "Planning & Management",
  description: "Project planning and oversight team"
});

// Create a development team as a child of planning team
const devTeam = await participantApi.create(projectId, {
  name: "Development Team",
  description: "Core development team",
  parentParticipant: planningTeam._id
});
```

### Step 3: Add Members to Participant Groups
Add users to groups with specific project roles.

```typescript
// Add Project Manager to planning team
await participantApi.addMember(
  planningTeam._id,
  pmUserId,
  ["Project Manager", "Lead"]
);

// Add developers to dev team
await participantApi.addMember(
  devTeam._id,
  dev1UserId,
  ["Frontend Developer", "UI/UX Designer"]
);

await participantApi.addMember(
  devTeam._id,
  dev2UserId,
  ["Backend Developer", "Database Admin"]
);
```

### Step 4: Create Events with Participants
When creating events, you can only select from users who are in the project's participant groups.

The AddEventDialog automatically shows only users from the project's participant groups, not all system users.

---

## Key Changes from Previous Implementation

### ❌ OLD WAY (No longer works)
```typescript
// Creating project with participants array
const project = await projectApi.create({
  name: "Project",
  participants: [user1Id, user2Id, user3Id] // ❌ Not supported
});
```

### ✅ NEW WAY (Correct)
```typescript
// 1. Create project (no participants)
const project = await projectApi.create({
  name: "Project"
});

// 2. Create participant groups
const team = await participantApi.create(project._id, {
  name: "Core Team"
});

// 3. Add members with roles
await participantApi.addMember(team._id, user1Id, ["PM"]);
await participantApi.addMember(team._id, user2Id, ["Dev", "QA"]);
```

---

## Frontend Changes

### 1. Home Page (`Home.tsx`)
**Removed**: Workspace Participants section
- Participants are now managed per-project, not per-workspace
- Each project has its own participant groups

### 2. Project Page (`Project.tsx`)
**Updated**: Event participant selection
- `AddEventDialog` now only shows users from the project's participant groups
- Users are extracted automatically from all participant groups in the project

**Helper Function Added**:
```typescript
const extractUsersFromParticipants = (project: Project): User[] => {
  const userMap = new Map<string, User>();
  
  project.participants.forEach(participantGroup => {
    participantGroup.members.forEach(member => {
      if (!userMap.has(member.user._id)) {
        userMap.set(member.user._id, member.user);
      }
    });
  });
  
  return Array.from(userMap.values());
};
```

### 3. Create Project Dialog (`CreateProjectDialog.tsx`)
**Removed**: Participant selection
- Shows informational note about adding participants after project creation
- Simplified project creation flow

### 4. Add Event Dialog (`AddEventDialog.tsx`)
**Updated**: Participant list source
- Before: Showed all users in the system
- After: Shows only users from the project's participant groups
- Automatically filters based on project context

---

## API Endpoints Reference

### Participant Group Management
```typescript
// Create participant group
POST /api/projects/:projectId/participants
Body: {
  name: string,
  description?: string,
  parentParticipant?: string
}

// Get all participant groups for a project
GET /api/projects/:projectId/participants

// Get specific participant group
GET /api/participants/:id

// Update participant group
PUT /api/participants/:id
Body: {
  name?: string,
  description?: string,
  parentParticipant?: string
}

// Delete participant group
DELETE /api/participants/:id
```

### Member Management
```typescript
// Add member to participant group
POST /api/participants/:participantId/members
Body: {
  userId: string,
  roles: string[] // e.g., ["PM", "Lead"]
}

// Update member roles
PUT /api/participants/:participantId/members/:userId
Body: {
  roles: string[]
}

// Remove member from participant group
DELETE /api/participants/:participantId/members/:userId
```

---

## UI Requirements (Future Enhancement)

### Recommended: Participant Management UI in Project Detail Page

The Project detail page should have a section for managing participant groups:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Team Structure</CardTitle>
    <Button onClick={openAddParticipantDialog}>
      Add Participant Group
    </Button>
  </CardHeader>
  <CardContent>
    {project.participants.map(group => (
      <ParticipantGroup
        key={group._id}
        group={group}
        onAddMember={() => openAddMemberDialog(group)}
        onEditGroup={() => openEditGroupDialog(group)}
        onDeleteGroup={() => handleDeleteGroup(group)}
      />
    ))}
  </CardContent>
</Card>
```

### Components to Build (Future Work)
1. **AddParticipantGroupDialog** - Create new participant groups
2. **EditParticipantGroupDialog** - Edit group name, description, parent
3. **AddMemberDialog** - Add users to groups with role selection
4. **EditMemberRolesDialog** - Update member's roles
5. **ParticipantGroupCard** - Display group with members and actions

---

## Example: Complete Workflow

```typescript
// 1. User creates a project through UI
const project = await projectApi.create({
  name: "E-commerce Platform",
  description: "New online store",
  status: "planning",
  startDate: new Date()
});

// 2. Backend creates project (MongoDB record created)
// participants: [] (empty array)

// 3. User needs to add participant groups manually
// (Currently via API, future: via UI in Project page)

// 4. Create participant groups
const managementTeam = await participantApi.create(project._id, {
  name: "Management",
  description: "Project oversight"
});

const devTeam = await participantApi.create(project._id, {
  name: "Development",
  parentParticipant: managementTeam._id
});

// 5. Add members to groups
await participantApi.addMember(managementTeam._id, pmUser._id, [
  "Project Manager",
  "Stakeholder"
]);

await participantApi.addMember(devTeam._id, dev1._id, [
  "Tech Lead",
  "Backend Developer"
]);

await participantApi.addMember(devTeam._id, dev2._id, [
  "Frontend Developer",
  "UI Designer"
]);

// 6. Now when creating events, only dev1 and dev2 will appear
// in the participant selection (extracted from participant groups)

const event = await eventApi.create({
  title: "Sprint Planning",
  projectId: project._id,
  participants: [dev1._id] // Can only select from project participants
});
```

---

## Troubleshooting

### Issue: "Participants are not showing in MongoDB"
**Cause**: Project was created but participant groups were not added  
**Solution**: Add participant groups and members via API or (future) UI

### Issue: "No users available when creating event"
**Cause**: Project has no participant groups yet  
**Solution**: Add at least one participant group with members first

### Issue: "Can't find participant management in UI"
**Cause**: UI components for participant management not yet built  
**Solution**: Currently use API endpoints directly or build UI components

---

## Migration from Old System

If you have existing projects with flat participant arrays:

1. Projects will still load (field will be empty array)
2. Create new participant groups
3. Add members to groups
4. Old participant references are obsolete

---

## Summary

✅ **Projects created WITHOUT initial participants**  
✅ **Participant groups added AFTER project creation**  
✅ **Members added to groups with specific roles**  
✅ **Events show only project participants**  
✅ **Workspace participants section removed**  
⚠️ **UI for participant management needed (future work)**

The new system provides better organization and role flexibility, but requires an additional step to set up participants after project creation.

