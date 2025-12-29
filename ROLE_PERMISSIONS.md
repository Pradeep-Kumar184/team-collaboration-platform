# Role-Based Access Control (RBAC) System

## User Roles

### MEMBER (Default Role)
- **Projects**: View only
- **Tasks**: View, update status for assigned tasks
- **Team**: View team members
- **Chat**: Send and receive messages
- **Invitations**: Cannot create invitations

### MANAGER
- **Projects**: Create, view, update
- **Tasks**: Create, view, update, delete, assign tasks
- **Team**: View team members, create invitations
- **Chat**: Send and receive messages
- **Invitations**: Create and manage team invitations

### ADMIN (Full Access)
- **Projects**: Create, view, update, delete
- **Tasks**: Create, view, update, delete, assign tasks
- **Team**: View team members, edit member roles, create invitations
- **Chat**: Send and receive messages
- **Invitations**: Create and manage team invitations

## Team Invitation System

### Creating Invitations (ADMIN/MANAGER only)
1. Go to Team page
2. Click "Create Invitation" button
3. Optionally specify email address (restricts invitation to that email)
4. Select role for new member (MEMBER, MANAGER, or ADMIN)
5. Copy the generated invitation link

### Joining via Invitation
1. New user receives invitation link (e.g., `/join/abc123def456`)
2. User visits the link and sees team information
3. User must log in/register first
4. User clicks "Join Team" to accept invitation
5. User is automatically added to team with specified role

### Invitation Features
- **Expiration**: Invitations expire after 7 days
- **Single Use**: Each invitation can only be used once
- **Email Restriction**: Optional - restrict invitation to specific email
- **Role Assignment**: Specify role for new member
- **Management**: View, copy, and delete active invitations

## Role Assignment

### Method 1: During Registration (Self-Selection)
- Users can select their role when registering
- Available options: MEMBER, MANAGER, ADMIN
- First user automatically becomes ADMIN regardless of selection

### Method 2: Team Invitations (Recommended)
- ADMIN/MANAGER creates invitation with specific role
- New user joins via invitation link
- Role is automatically assigned based on invitation

### Method 3: Admin Role Management (Post-Registration)
- Only ADMINs can change user roles via the Team page
- Go to Team page → Click "Edit Role" for any user
- Select new role and save

## New Member Onboarding

### Automatic Team Assignment
1. New users are automatically added to the "Default Team"
2. All team members can see and message each other
3. New members get MEMBER role by default (unless invited with different role)
4. Activity log tracks when new members join

### Permissions for New Members
- **Immediate Access**: Can send/receive messages in team chat
- **Task Visibility**: Can view all team projects and tasks
- **Task Updates**: Can update status of tasks assigned to them
- **Real-time Features**: Automatic Socket.IO connection for live updates
- **Dashboard Access**: Full access to team dashboard and activity logs

## Implementation Details

### Backend Authorization
- **Middleware**: `roleMiddleware(allowedRoles)` in `/backend/middleware/auth.js`
- **Usage**: Applied to protected routes in `/backend/routes/`

### Frontend UI Restrictions
- **Role Checks**: `user?.role === "ADMIN"` or `user?.role === "MANAGER"`
- **Conditional Rendering**: Buttons and actions hidden based on permissions

### Route Permissions

#### Projects (`/api/projects`)
- `GET /` - All authenticated users
- `GET /:id` - All authenticated users
- `POST /` - ADMIN, MANAGER only
- `PUT /:id` - ADMIN, MANAGER only
- `DELETE /:id` - ADMIN only

#### Tasks (`/api/tasks`)
- `GET /` - All authenticated users
- `POST /` - ADMIN, MANAGER only
- `PUT /:id` - All authenticated users (members can only update assigned tasks)
- `DELETE /:id` - ADMIN, MANAGER only

#### Messages (`/api/messages`)
- `GET /` - All authenticated users (team members only)
- `POST /` - All authenticated users (team members only)

#### Users (`/api/users`)
- `GET /team` - All authenticated users
- `PUT /:id/role` - ADMIN only

#### Invitations (`/api/invitations`)
- `GET /validate/:code` - Public (no authentication required)
- `POST /` - ADMIN, MANAGER only
- `GET /` - ADMIN, MANAGER only
- `POST /use` - All authenticated users
- `DELETE /:id` - ADMIN, MANAGER only

## Security Features

1. **Backend Validation**: All routes protected with authentication and role middleware
2. **Frontend UI**: Conditional rendering based on user role
3. **Role Indicator**: User role displayed in navbar with color coding
4. **First User**: Automatically becomes ADMIN and creates default team
5. **Error Handling**: Proper 403 Forbidden responses for insufficient permissions
6. **Invitation Security**: Codes expire, single-use, optional email restriction
7. **Activity Logging**: All team actions are logged and visible to members

## Scalability for Future Members

### Easy Team Growth
- **Invitation Links**: Simple sharing via URL
- **Bulk Invitations**: Can create multiple invitations with different roles
- **Self-Service**: New members can join without admin intervention
- **Automatic Setup**: New members get immediate access to all team features

### Team Management
- **Activity Tracking**: See when new members join and what they do
- **Role Flexibility**: Easy to change roles as team grows
- **Permission Inheritance**: New members automatically get appropriate access
- **Real-time Integration**: Instant access to chat and collaborative features