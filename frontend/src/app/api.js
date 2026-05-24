import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Bookmark', 'Space', 'Dashboard', 'Invitation'],
  endpoints: (builder) => ({
    // ── Auth ──────────────────────────────────────────────
    login:          builder.mutation({ query: (body) => ({ url: '/auth/login',    method: 'POST', body }) }),
    register:       builder.mutation({ query: (body) => ({ url: '/auth/register', method: 'POST', body }) }),
    forgotPassword: builder.mutation({ query: (body) => ({ url: '/auth/forgot-password',         method: 'POST', body }) }),
    resetPassword:  builder.mutation({ query: ({ token, password }) => ({
      url: `/auth/reset-password/${token}`, method: 'POST', body: { password },
    }) }),

    // ── Bookmarks ─────────────────────────────────────────
    getBookmarks:   builder.query({ query: (q) => `/bookmarks${q ? `?q=${q}` : ''}`, providesTags: ['Bookmark'] }),
    getBookmark:    builder.query({ query: (id) => `/bookmarks/${id}` }),
    createBookmark: builder.mutation({ query: (body) => ({ url: '/bookmarks', method: 'POST', body }), invalidatesTags: ['Bookmark', 'Dashboard'] }),
    updateBookmark: builder.mutation({ query: ({ id, ...body }) => ({ url: `/bookmarks/${id}`, method: 'PUT', body }), invalidatesTags: ['Bookmark', 'Dashboard'] }),
    deleteBookmark: builder.mutation({ query: (id) => ({ url: `/bookmarks/${id}`, method: 'DELETE' }), invalidatesTags: ['Bookmark', 'Dashboard'] }),
    getRelated:     builder.query({ query: (id) => `/bookmarks/${id}/related` }),
    getGraph:       builder.query({ query: () => '/bookmarks/graph', providesTags: ['Bookmark'] }),

    // ── Spaces ────────────────────────────────────────────
    getSpaces:   builder.query({ query: () => '/spaces', providesTags: ['Space'] }),
    getSpace:    builder.query({ query: (id) => `/spaces/${id}`, providesTags: (r, e, id) => [{ type: 'Space', id }] }),
    createSpace: builder.mutation({ query: (body) => ({ url: '/spaces', method: 'POST', body }), invalidatesTags: ['Space'] }),
    deleteSpace: builder.mutation({ query: (id) => ({ url: `/spaces/${id}`, method: 'DELETE' }), invalidatesTags: ['Space'] }),
    addToSpace:  builder.mutation({ query: ({ id, bookmarkId }) => ({ url: `/spaces/${id}/bookmarks`, method: 'POST', body: { bookmarkId } }), invalidatesTags: (r, e, { id }) => [{ type: 'Space', id }] }),
    addComment:  builder.mutation({ query: ({ id, text }) => ({ url: `/spaces/${id}/comments`, method: 'POST', body: { text } }), invalidatesTags: (r, e, { id }) => [{ type: 'Space', id }] }),
    removeMember: builder.mutation({ query: ({ spaceId, memberId }) => ({ url: `/spaces/${spaceId}/members/${memberId}`, method: 'DELETE' }), invalidatesTags: ['Space'] }),

    // ── Invitations ───────────────────────────────────────
    sendInvite:          builder.mutation({ query: ({ spaceId, email }) => ({ url: `/spaces/${spaceId}/invite`, method: 'POST', body: { email } }), invalidatesTags: ['Invitation'] }),
    getSpaceInvitations: builder.query({ query: (spaceId) => `/spaces/${spaceId}/invitations`, providesTags: ['Invitation'] }),
    resendInvite:        builder.mutation({ query: ({ spaceId, invitationId }) => ({ url: `/spaces/${spaceId}/invitations/${invitationId}/resend`, method: 'POST' }), invalidatesTags: ['Invitation'] }),
    getInviteByToken:    builder.query({ query: (token) => `/invitations/token/${token}` }),
    acceptInvite:        builder.mutation({ query: (token) => ({ url: '/invitations/accept', method: 'POST', body: { token } }), invalidatesTags: ['Space'] }),
    rejectInvite:        builder.mutation({ query: (token) => ({ url: '/invitations/reject', method: 'POST', body: { token } }), invalidatesTags: ['Space'] }),

    // ── Dashboard ─────────────────────────────────────────
    getDashboard: builder.query({ query: () => '/dashboard', providesTags: ['Dashboard'] }),
  }),
});

export const {
  useLoginMutation, useRegisterMutation,
  useForgotPasswordMutation, useResetPasswordMutation,
  useGetBookmarksQuery, useGetBookmarkQuery, useCreateBookmarkMutation,
  useUpdateBookmarkMutation, useDeleteBookmarkMutation, useGetRelatedQuery,
  useGetGraphQuery,
  useGetSpacesQuery, useGetSpaceQuery, useCreateSpaceMutation, useDeleteSpaceMutation,
  useAddToSpaceMutation, useAddCommentMutation, useRemoveMemberMutation,
  useSendInviteMutation, useGetSpaceInvitationsQuery, useResendInviteMutation,
  useGetInviteByTokenQuery, useAcceptInviteMutation, useRejectInviteMutation,
  useGetDashboardQuery,
} = api;
