# Database Column Recommendations for Kanban Board

This document provides recommendations on how to utilize currently unused Supabase database columns specifically to enhance the Kanban Board experience in the Career Track Planer app.

## 1. Kanban Card UI Enhancements (Visual Indicators)
The individual job cards on the Kanban board can be enriched with visual cues using the following unused `jobs` columns:

*   **`priority` ('A', 'B', 'C')**: Add a small, color-coded badge or icon (e.g., a flame for 'A', a star for 'B') to the top corner of the card. This helps users quickly identify which applications need immediate attention within a busy column.
*   **`fit_score` (0-100)**: Display a small progress-bar or a colored score (e.g., Green for >80, Yellow for 50-80) on the card. This gives immediate feedback on how well the job matches the user's profile.
*   **`response_state` ('WAITING', 'REPLIED', etc.) & `last_contact_at`**: For cards in the "Applied" or "Interviewing" columns, a small icon (like a clock or an envelope) with a tooltip could indicate if the user is waiting for a reply or if a response was received, helping them know when to follow up.
*   **`source`**: A small icon representing the platform (LinkedIn, Stepstone, etc.) can be placed at the bottom of the card for quick context.

## 2. Board Filtering and Sorting
The Kanban board currently displays all active jobs. Unused columns can be used to add powerful filter/sort controls at the top of the board:

*   **Filter by `priority`**: Allow users to toggle visibility so they only see 'A' priority jobs across all columns.
*   **Sort by `fit_score`**: Instead of just sorting by date added, users could sort columns by the highest AI fit score, ensuring the most promising leads are at the top of the "Research" or "To Apply" columns.
*   **Filter by `next_action` / `follow_up_date`**: Introduce a "Needs Action Today" toggle that highlights or filters cards where `follow_up_date` is today or in the past, or where `next_action` is populated.

## 3. Actionable Card Elements (Quick Links & Modals)
Users shouldn't have to navigate away from the board to perform quick actions or view essential info:

*   **Document Quick Links (`cv_doc_link`, `cover_letter_link`, `interview_pack_link`)**: Add tiny action buttons (e.g., a document icon) directly on the card that open these Google Drive links in a new tab. This is incredibly useful when a recruiter calls unexpectedly.
*   **Next Action Prompt (`next_action`, `follow_up_date`)**: If `next_action` has text, show a small "Next: [Action]" snippet at the bottom of the card. Clicking it could open a modal to mark it complete.
*   **Quick Briefing Modal (`company_summary`, `research_notes`)**: Add an "info" icon to the card. Hovering or clicking it could open a quick popover displaying the AI-generated `company_summary`, saving the user from opening the full job details page just to remember what the company does.

## 4. Interview Preparation (Within the 'Interviewing' Column)
The `interview_rounds` table has several unused columns that can make the "Interviewing" column much more powerful:

*   **Interview Type Badges (`interview_type`)**: Show if the upcoming round is 'HR_SCREENING', 'TECHNICAL', or 'CULTURE_FIT' directly on the job card.
*   **Prep Status Tracker (`prep_status`)**: Add a visual toggle (Red/Yellow/Green dot) on the card to indicate if the user is 'NOT_STARTED', 'IN_PROGRESS', or 'READY' for their upcoming interview.
*   **AI Prep Generation (`prep_pack_url`, `key_questions`, `star_stories`)**: If `prep_status` is 'NOT_STARTED', display a magic wand icon on the card to trigger the AI to generate `key_questions` and `star_stories`, moving the status to 'READY'.

## 5. Workflow and Automation Visibility (`workflow_log`)
While `workflow_log` is a separate table, it can be surfaced on the board:

*   **Agentic Activity Indicator**: If the `workflow_log` shows recent automated actions (like `action_source` = 'PERPLEXITY' running a `FIT_CHECK`), the card could have a subtle "sparkle" animation or a "Recent AI Activity" tag, letting the user know the AI has updated the job's context in the background.

## Do We Need Them All?
*   **Keep and Implement:** `priority`, `fit_score`, `next_action`, `follow_up_date`, `response_state`, and the document links (`cv_doc_link`, etc.) provide immense, immediate value for a Kanban workflow.
*   **Reconsider/Deprecate:** `salary_min`, `salary_max`, and `salary_fit` might be better suited strictly for a detailed view or analytics, rather than the Kanban board itself, as they clutter the high-level overview. `applied_at` and `rejected_at` might be redundant if the `last_updated` and `status` timestamps are already tracking state changes effectively.
