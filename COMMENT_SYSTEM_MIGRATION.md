# 🚀 Comment System Migration Guide

This document outlines the transformation of the lead comment system from a simple text field to a full social network-style commenting system with permissions and audit logging.

## 📋 Overview

The new comment system provides:

- **Social network-style comments** with individual user attribution
- **Permission-based editing** (self, team, all scopes)
- **Complete audit trail** with edit history
- **Backward compatibility** with existing comments
- **Real-time updates** and professional UI design

## 🗄️ Database Changes

### New Models Added

```prisma
model LeadComment {
  id        String           @id @default(uuid())
  createdAt DateTime         @default(now()) @map("created_at")
  updatedAt DateTime         @updatedAt @map("updated_at")
  content   String           @db.Text
  leadId    String           @map("lead_id")
  userId    String           @map("user_id")
  isDeleted Boolean          @default(false) @map("is_deleted")
  deletedAt DateTime?        @map("deleted_at")
  lead      Lead             @relation(fields: [leadId], references: [id], onDelete: Cascade)
  user      User             @relation(fields: [userId], references: [id])
  history   CommentHistory[]
}

model CommentHistory {
  id            String      @id @default(uuid())
  createdAt     DateTime    @default(now()) @map("created_at")
  commentId     String      @map("comment_id")
  previousValue String      @map("previous_value") @db.Text
  newValue      String      @map("new_value") @db.Text
  editedById    String      @map("edited_by_id")
  action        String
  comment       LeadComment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  editedBy      User        @relation("CommentHistoryEditedBy", fields: [editedById], references: [id])
}
```

## 🔐 Permission System

### Scope Levels

1. **"self"** - Users can only edit their own comments
2. **"team"** - Users can edit comments from leads assigned to them
3. **"all"** - Users can edit all comments (admin level)

### Permission Actions

- `leads:update` - Required to create and edit comments
- `leads:delete` - Required to delete comments

## 🎨 UI Components

### New Components Created

1. **`CommentCard`** - Individual comment display with actions
2. **`CommentList`** - Container for all comments with add functionality
3. **`CommentHistoryDialog`** - Modal showing edit history

### Features

- **Professional design** matching existing dashboard
- **Dark/light mode support**
- **Real-time updates**
- **Intuitive editing** with inline forms
- **Permission-based UI** (actions shown based on user permissions)

## 📁 File Changes

### Modified Files

1. **Database Schema**

   - `prisma/schema.prisma` - Added new models and relations

2. **Components**

   - `src/components/leads/lead-detail-page.tsx` - Integrated new comment system
   - `src/components/leads/new-lead-dialog.tsx` - Support for initial comments
   - `src/components/leads/edit-lead-dialog.tsx` - Comments now read-only

3. **API Routes**

   - `src/app/api/leads/[id]/comments/route.ts` - CRUD operations for comments
   - `src/app/api/comments/[id]/route.ts` - Edit/delete individual comments
   - `src/app/api/comments/[id]/history/route.ts` - Comment history retrieval

4. **Hooks**
   - `src/lib/hooks/use-lead-comments.ts` - React Query hooks for comments
   - `src/lib/hooks/index.ts` - Export new hooks

### New Files Created

1. **Components**

   - `src/components/leads/comments/comment-card.tsx`
   - `src/components/leads/comments/comment-list.tsx`
   - `src/components/leads/comments/comment-history-dialog.tsx`

2. **Types**

   - `src/types/comment.ts` - TypeScript interfaces

3. **Migration Scripts**
   - `scripts/migrate-comments.ts` - Data migration script
   - `package-scripts/migrate-comments.js` - Migration runner

## 🚀 Migration Process

### Step 1: Apply Database Schema

```bash
# Generate and apply the new database schema
npx prisma generate
npx prisma db push
```

### Step 2: Migrate Existing Comments

```bash
# Run the migration script
npm run migrate-comments
```

This will:

- ✅ Convert existing `extraComments` to individual `LeadComment` records
- ✅ Create audit history for migrated comments
- ✅ Preserve original creation dates
- ✅ Assign comments to appropriate users (createdBy or assignedTo)

### Step 3: Test the System

1. **View existing comments** - Previous comments should appear as "Previous comments"
2. **Add new comments** - Test the new comment creation flow
3. **Edit comments** - Verify permission-based editing works
4. **View history** - Check that edit history is tracked
5. **Permission testing** - Test different user scope levels

## 📊 Backward Compatibility

- ✅ **Existing `extraComments` field preserved** - No data loss
- ✅ **Previous comments displayed** in read-only mode
- ✅ **Edit dialog shows legacy comments** as read-only
- ✅ **New lead creation** can still add initial comments

## 🎯 User Experience

### For Users

- **Familiar interface** - Similar to social media commenting
- **Clear attribution** - See who made each comment and when
- **Edit capabilities** - Based on user permissions
- **History tracking** - View what changed and when

### For Administrators

- **Complete audit trail** - Track all comment changes
- **Permission control** - Manage who can edit what
- **Professional appearance** - Maintains dashboard consistency

## ⚡ Performance Considerations

- **Lazy loading** - Comments loaded on-demand
- **Pagination ready** - Components support large comment lists
- **Optimized queries** - Proper database indexes
- **React Query caching** - Efficient client-side caching

## 🔧 Troubleshooting

### Common Issues

1. **Migration fails** - Check database connectivity and user permissions
2. **Comments not showing** - Verify API routes are working
3. **Permission errors** - Check user permission configuration
4. **UI not updating** - Ensure React Query cache invalidation

### Rollback Process

If needed, the system can be rolled back by:

1. Removing the new comment components
2. Restoring the original textarea-based system
3. The `extraComments` field remains intact

## 🎉 Benefits Achieved

- ✅ **Enhanced user collaboration** through individual commenting
- ✅ **Complete audit trail** for compliance and tracking
- ✅ **Professional user experience** with modern UI
- ✅ **Scalable architecture** for future enhancements
- ✅ **Permission-based access control** for security
- ✅ **Backward compatibility** ensuring no data loss

---

_Migration completed successfully! The lead comment system now provides a comprehensive social networking experience for better team collaboration._
