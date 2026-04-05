# Multi-tool selection implementation plan

## Current state
- posts table has a single `toolId` column (NOT NULL)
- createPost in db.ts takes a single toolId
- routers.ts posts.create accepts z.number() for toolId
- CreatePost.tsx uses a single Select component for toolId

## Strategy: Add post_tools junction table
- Create `post_tools` table (postId, toolId) for many-to-many
- Keep `toolId` in posts as the "primary" tool for backward compatibility
- When ALL is selected, insert all tool IDs into post_tools
- When specific tools are selected, insert those into post_tools, use first as primary toolId
- Update getPostById and getPosts to return all associated tools
- Update CreatePost.tsx to use checkbox-style multi-select with ALL option
