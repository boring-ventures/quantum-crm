export interface LeadComment {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  content: string;
  leadId: string;
  userId: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  history: CommentHistory[];
}

export interface CommentHistory {
  id: string;
  createdAt: Date;
  commentId: string;
  previousValue: string;
  newValue: string;
  editedById: string;
  action: string;
  editedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateCommentData {
  content: string;
  leadId: string;
}

export interface UpdateCommentData {
  content: string;
}

export interface CommentPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canViewHistory: boolean;
}
