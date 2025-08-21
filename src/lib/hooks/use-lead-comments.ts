import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LeadComment,
  CreateCommentData,
  UpdateCommentData,
} from "@/types/comment";

// Fetch comments for a lead
export function useLeadComments(leadId: string) {
  return useQuery({
    queryKey: ["leads", leadId, "comments"],
    queryFn: async (): Promise<LeadComment[]> => {
      const response = await fetch(`/api/leads/${leadId}/comments`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!leadId,
  });
}

// Create a new comment
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCommentData): Promise<LeadComment> => {
      const response = await fetch(`/api/leads/${data.leadId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create comment");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch comments for the lead
      queryClient.invalidateQueries({
        queryKey: ["leads", data.leadId, "comments"],
      });
    },
  });
}

// Update a comment
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      data,
    }: {
      commentId: string;
      data: UpdateCommentData;
    }): Promise<LeadComment> => {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update comment");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch comments for the lead
      queryClient.invalidateQueries({
        queryKey: ["leads", data.leadId, "comments"],
      });
    },
  });
}

// Delete a comment
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string): Promise<void> => {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete comment");
      }
    },
    onSuccess: (_, commentId) => {
      // Invalidate all comment queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: ["leads"],
      });
    },
  });
}

// Fetch comment history
export function useCommentHistory(commentId: string) {
  return useQuery({
    queryKey: ["comments", commentId, "history"],
    queryFn: async () => {
      const response = await fetch(`/api/comments/${commentId}/history`);
      if (!response.ok) {
        throw new Error("Failed to fetch comment history");
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!commentId,
  });
}
