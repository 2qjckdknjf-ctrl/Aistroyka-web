# Expert Review Submission Service

**Module:** `expert-review-queue.submission.ts`  
**Function:** `submitExpertReview()`

## Flow

1. Validate verdict + conclusion  
2. Load queue item (pending/in_review only)  
3. Scrub corrected JSON  
4. Insert `ai_expert_reviews` (service-role)  
5. Mark queue `completed`  
6. Optional Gold Memory bridge (dry-run by default)  
7. Safe audit metadata log  

**Skip:** `skipExpertReviewQueueItem()` → status `skipped`
