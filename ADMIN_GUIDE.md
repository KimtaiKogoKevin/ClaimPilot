# Admin Dashboard Guide

## Overview

The Admin Dashboard is a comprehensive system administration interface for the Claims Management System that provides full control over users, claims, system settings, and audit logging. This guide covers all administrative capabilities and workflows.

## Access Requirements

- **Role**: Admin
- **Route**: `/admin` (automatic redirect after login for admin users)
- **Authentication**: Required (JWT-based standalone authentication)

## Dashboard Sections

The Admin Dashboard is organized into five main tabs:

### 1. Analytics Tab

The Analytics tab provides a high-level overview of system health and activity.

#### Statistics Cards

- **Total Users**: Current count of all registered users across all roles
- **Total Claims**: Total number of claims in the system
- **Users by Role**: Breakdown of users by their assigned role (insured, broker, insurer, service provider, admin)
- **Claims by Status**: Distribution of claims across different statuses (submitted, under_review, approved, rejected, paid)

#### Use Cases

- Monitor system growth and user adoption
- Identify bottlenecks in claims processing
- Track role distribution for capacity planning

### 2. User Management Tab

Complete user lifecycle management with search, filtering, and CRUD operations.

#### Features

**Search & Filter**
- Search by email, first name, or last name
- Filter by role: all, admin, insurer, broker, insured, service_provider
- Real-time filtering without page reload

**User Table Columns**
- Name (first + last)
- Email address
- Role badge
- Account creation date
- Action buttons (Edit, Delete)

**Create User**
1. Click "Create User" button
2. Fill in required fields:
   - First Name
   - Last Name
   - Email
   - Role (select from dropdown)
3. Click "Save"
4. User is created with default password (should be reset via password reset)

**Edit User**
1. Click Edit button on user row
2. Update any field (first name, last name, email, role)
3. Click "Save"
4. Changes are applied immediately
5. Audit log entry is created

**Delete User**
1. Click Delete button on user row
2. Confirm deletion in dialog
3. User is permanently deleted
4. Note: You cannot delete your own account
5. Audit log entry is created

**Change User Role**
1. Edit user
2. Select new role from dropdown
3. Save changes
4. User's access permissions update immediately

**Reset Password**
- Via "Reset Password" button (if implemented)
- Generates a time-limited reset token
- Token expires after 24 hours
- Audit log entry is created

#### User Roles

- **insured**: Can create and manage their own claims
- **broker**: Can create claims for clients and view analytics
- **insurer**: Can review claims and access analytics dashboard
- **service_provider**: Can view assigned claims for repairs/services
- **admin**: Full system access including user management

### 3. Claims Management Tab

Bulk operations and advanced claim management capabilities.

#### Bulk Operations

**Select Claims**
- Use checkboxes to select individual claims
- Use header checkbox to select all claims on current view
- Selection count shown in bulk action buttons

**Bulk Update Status**
1. Select claims using checkboxes
2. Choose new status from dropdown:
   - submitted
   - under_review
   - approved
   - rejected
   - paid
3. Click "Update Status (N)" button
4. All selected claims updated simultaneously
5. Audit log entry created for bulk operation

**Bulk Delete Claims**
1. Select claims using checkboxes
2. Click "Delete (N)" button
3. Confirm deletion in confirmation dialog
4. All selected claims permanently deleted
5. Audit log entry created

#### Claims Table

Displays all claims in the system with:
- Selection checkbox
- Reference number
- Policy number
- Status badge
- Creation date

#### Use Cases

- Clean up test or invalid claims
- Batch update claims after review session
- Change status of multiple related claims
- Archive completed claims

### 4. System Settings Tab

Key-value configuration store for system-wide settings.

#### Settings Structure

Each setting consists of:
- **Key**: Unique identifier (e.g., `EMAIL_FROM_ADDRESS`)
- **Value**: Setting value (can be text, JSON, etc.)
- **Category**: Organization grouping (general, email, security, api)
- **Description**: Optional explanation of setting purpose
- **Updated At**: Last modification timestamp
- **Updated By**: Admin user who last modified

#### Operations

**Add New Setting**
1. Click "Add Setting" button
2. Enter required fields:
   - Key (uppercase, underscores for spaces)
   - Value (the setting value)
   - Category (select from dropdown)
   - Description (optional)
3. Click "Save"
4. Setting is created
5. Audit log entry created

**Edit Setting**
1. Click Edit button on setting row
2. Modify value, category, or description
3. Click "Save"
4. Setting updated (key cannot be changed)
5. Audit log entry created

**Delete Setting**
1. Click Delete button on setting row
2. Confirm deletion
3. Setting permanently removed
4. Audit log entry created

#### Common Settings

- **Email Configuration**: SMTP settings, from addresses, email templates
- **Security Settings**: Password policies, session timeouts, 2FA requirements
- **API Settings**: External service configurations, API keys (stored securely)
- **General Settings**: Application name, support contact, feature flags

#### Best Practices

- Use descriptive keys in UPPERCASE_WITH_UNDERSCORES format
- Always add descriptions for complex settings
- Group related settings using categories
- Test settings in development before production
- Document setting changes in audit logs
- Use JSON format for complex configuration objects

### 5. Audit Logs Tab

Complete audit trail of all administrative actions.

#### Log Information

Each audit log entry contains:
- **Timestamp**: When action occurred
- **Admin ID**: Which admin performed the action
- **Action**: Type of action (create, update, delete, etc.)
- **Entity Type**: What was affected (user, claim, system_setting)
- **Entity ID**: Specific record identifier
- **Changes**: JSON object with change details
- **IP Address**: Source IP of the action
- **User Agent**: Browser/client information

#### Filter Options

- **Entity Type**: Filter by user, claim, or system_setting
- **Admin ID**: Show actions by specific admin
- **Date Range**: Filter by start/end dates (if implemented)

#### Logged Actions

**User Management**
- create: New user created
- update: User information modified
- delete: User account deleted
- update_role: User role changed
- reset_password: Password reset initiated

**Claim Management**
- bulk_update_status: Multiple claims status updated
- bulk_delete: Multiple claims deleted
- assign_broker: Broker assigned to claim
- assign_provider: Service provider assigned to claim

**System Settings**
- upsert_setting: Setting created or updated
- delete_setting: Setting removed

#### Use Cases

- Security auditing and compliance
- Troubleshooting user permission issues
- Investigating unauthorized changes
- Regulatory reporting
- User activity monitoring
- Change history tracking

## Security & Access Control

### Role-Based Access Control (RBAC)

- All admin routes protected by `authenticateToken` middleware
- Each route validates `user.role === 'admin'`
- Non-admin users receive 403 Forbidden response
- Unauthorized access attempts can be logged

### Admin Account Protection

- Admins cannot delete their own account
- Password resets logged in audit trail
- All administrative actions tracked
- IP addresses and user agents recorded

### Best Security Practices

1. **Limit Admin Accounts**: Only create admin users when necessary
2. **Regular Audits**: Review audit logs weekly for suspicious activity
3. **Strong Passwords**: Enforce password policies via system settings
4. **Session Management**: Configure appropriate session timeouts
5. **IP Whitelisting**: Consider restricting admin access by IP (via system settings)
6. **2FA**: Enable two-factor authentication for admin accounts
7. **Backup Admin**: Always have at least two admin accounts
8. **Regular Reviews**: Periodically review user roles and remove unnecessary access

## Database Schema

### Audit Logs Table

```typescript
auditLogs {
  id: string (primary key)
  adminId: string (references users.id)
  action: string
  entityType: string
  entityId: string
  changes: json
  ipAddress: string
  userAgent: string
  createdAt: timestamp
}
```

### System Settings Table

```typescript
systemSettings {
  id: string (primary key)
  key: string (unique)
  value: text
  category: string
  description: text
  updatedBy: string (references users.id)
  updatedAt: timestamp
  createdAt: timestamp
}
```

**Note**: These tables are defined in `shared/schema.ts` but may not exist in the database until:
- Database endpoint is enabled
- Database migration is run via `npm run db:push`
- Tables are created in production environment

## API Endpoints

### User Management

```
GET    /api/admin/users                    - List all users (with filters)
POST   /api/admin/users                    - Create user
PUT    /api/admin/users/:id                - Update user
DELETE /api/admin/users/:id                - Delete user
PUT    /api/admin/users/:id/role           - Change user role
POST   /api/admin/users/:id/reset-password - Reset password
```

### Claim Management

```
POST   /api/admin/claims/bulk-status              - Bulk update status
POST   /api/admin/claims/bulk-delete              - Bulk delete claims
PUT    /api/admin/claims/:id/assign-broker        - Assign broker
PUT    /api/admin/claims/:id/assign-provider      - Assign service provider
```

### Analytics & Stats

```
GET    /api/admin/stats                    - System statistics
```

### System Settings

```
GET    /api/admin/settings                 - Get all settings (optional category filter)
PUT    /api/admin/settings                 - Create/update setting
DELETE /api/admin/settings/:key            - Delete setting
```

### Audit Logs

```
GET    /api/admin/audit-logs               - Get audit logs (with filters)
```

## Common Workflows

### Onboarding a New User

1. Navigate to Users tab
2. Click "Create User"
3. Fill in user details
4. Assign appropriate role
5. Save user
6. Initiate password reset for the user
7. Provide reset token to user securely
8. User logs in and changes password

### Managing a Claims Backlog

1. Navigate to Claims tab
2. Select multiple claims using checkboxes
3. Choose appropriate status from dropdown
4. Click "Update Status" to process batch
5. Review audit logs to confirm changes
6. Monitor analytics tab for updated statistics

### Configuring Email Settings

1. Navigate to Settings tab
2. Click "Add Setting"
3. Add email-related settings:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `EMAIL_FROM_ADDRESS`
   - `EMAIL_FROM_NAME`
4. Set category to "email"
5. Add descriptions for each setting
6. Save settings
7. Test email functionality
8. Review audit logs for configuration changes

### Investigating Suspicious Activity

1. Navigate to Audit Logs tab
2. Filter by entity type if known
3. Review recent actions
4. Check IP addresses and user agents
5. Identify unauthorized changes
6. Take corrective action (change passwords, revoke access)
7. Document findings
8. Update security policies if needed

### Regular Maintenance Tasks

#### Weekly
- Review audit logs for unusual activity
- Check system statistics for anomalies
- Verify backup admin account accessibility

#### Monthly
- Review user accounts and remove inactive users
- Audit role assignments for accuracy
- Review and update system settings
- Generate compliance reports from audit logs

#### Quarterly
- Comprehensive security audit
- User access review
- System settings optimization
- Documentation updates

## Troubleshooting

### Cannot Access Admin Dashboard

**Symptoms**: Redirected to dashboard but see "Access Denied"

**Solutions**:
1. Verify your account has admin role
2. Log out and log back in
3. Check browser console for authentication errors
4. Contact another admin to verify your role

### Bulk Operations Not Working

**Symptoms**: Bulk update/delete buttons don't respond

**Solutions**:
1. Ensure claims are selected (checkboxes checked)
2. For bulk update: verify status is selected
3. Check browser console for errors
4. Verify admin permissions
5. Try individual operations first

### Settings Not Saving

**Symptoms**: Settings form submits but changes don't persist

**Solutions**:
1. Verify all required fields are filled
2. Check for duplicate keys (keys must be unique)
3. Ensure value is not empty
4. Review browser console for validation errors
5. Check audit logs to see if save was attempted

### Audit Logs Empty

**Symptoms**: No audit logs displayed

**Solutions**:
1. Database tables may not be created yet
2. Run database migration: `npm run db:push`
3. Check database connection
4. Verify filters are not too restrictive
5. Perform an action and check if log is created

## Development Notes

### Local Development

- Database may not be enabled in Replit development environment
- Some features require database connection
- Use in-memory storage for testing when DB unavailable
- Database schema changes require migration

### Testing Admin Features

1. Create test admin account
2. Test each CRUD operation
3. Verify audit logs are created
4. Check RBAC enforcement
5. Test bulk operations with sample data
6. Verify error handling

### Production Deployment

1. Enable database endpoint
2. Run database migrations
3. Create initial admin account
4. Configure system settings
5. Test all admin functionality
6. Set up monitoring and alerts
7. Document admin credentials securely
8. Train admin users

## Support & Resources

### Getting Help

- Review this guide thoroughly
- Check audit logs for error details
- Review browser console for client errors
- Check server logs for backend issues
- Contact system administrator

### Additional Documentation

- `shared/schema.ts`: Database schema definitions
- `server/storage.ts`: Storage interface and implementation
- `server/routes.ts`: API route definitions
- `client/src/pages/admin-dashboard.tsx`: Frontend implementation

### Security Contacts

For security concerns or suspected unauthorized access:
1. Review audit logs immediately
2. Change admin passwords
3. Document the incident
4. Contact security team
5. Preserve evidence for investigation

## Appendix

### Data Retention

- Audit logs: Retained indefinitely
- Deleted users: Permanently removed (consider archiving strategy)
- Deleted claims: Permanently removed (consider archiving strategy)
- System settings: Retained with full change history in audit logs

### Compliance Considerations

- GDPR: User deletion provides "right to be forgotten"
- Audit logs support compliance reporting
- All administrative actions tracked
- IP addresses logged for security auditing

### Future Enhancements

Potential improvements to consider:
- Advanced audit log search
- Export audit logs to CSV
- User activity reports
- Automated alerts for suspicious activity
- Role-based setting access
- Batch user import
- Scheduled reports
- Dashboard widgets
- Custom analytics
