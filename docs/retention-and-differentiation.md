# PlanEra: Differentiation & Keeping Users On Site

## How we're different from ChatGPT (study plan generation)

- **Structured input from real data**  
  PlanEra generates study plans from the user’s **actual** tasks in the database (from uploaded syllabi). No manual list to paste; one click uses due dates, classes, and grade weights already in the app.

- **One click, no prompt engineering**  
  “AI Study Plan” runs on their pending tasks. ChatGPT requires the user to collect and paste assignments and then iterate on prompts.

- **Plan lives next to actions**  
  The plan appears in-app next to Dashboard, Tasks, and Calendar. Users don’t have to copy a ChatGPT reply into another tool; they act in the same place.

- **Stays in sync**  
  As users complete tasks, they can regenerate the plan so it reflects current workload. The product is the source of truth, not a one-off chat.

- **Purpose-built workflow**  
  Upload → AI extraction → tasks + calendar + reminders → study plan. We’re a vertical product for students; ChatGPT is horizontal.

**Copy used on site:**  
- FAQ: “How is PlanEra different from ChatGPT for study plans?” (homepage)  
- About: “Why PlanEra, not just ChatGPT” section

---

## How to keep users on site

### Already in place
- **PWA** – Add to home screen for one-tap access.
- **Dashboard as hub** – Pending tasks, AI Study Plan button, quick overview.
- **Calendar + Tasks + Upload** – Multiple reasons to open the app (see schedule, check off work, add another syllabus).
- **Email reminders** – Bring users back before deadlines.
- **Google Calendar sync / ICS** – PlanEra stays relevant as their main calendar source.

### Implemented vs ideas to prioritize

| Idea | Status | Notes |
|------|--------|--------|
| **Study plan as destination (/plan)** | Not implemented | Plan is only in the slide-over from Dashboard (StudyPlanButton). No `/plan` route. |
| **"Add these blocks to my calendar"** | Not implemented | Study plan panel has Regenerate only; no action to create calendar events from the plan. |
| **Weekly digest email** | Not implemented | Reminders are deadline-based; no weekly "Your week ahead" digest. |
| **Strong "Due today / This week" on dashboard** | **Implemented** | Dashboard has stat cards (Due Today, Hours This Week, Completed This Week), "Today's Focus", and Weekly Workload bar (next 7 days). |
| **Light progress/streaks** | Partially implemented | "Completed This Week" (X assignments done) exists. No consecutive-day streak. |
| **Prompt more uploads** | Partially implemented | Context options include Work, Sports, Greek Life; dashboard has "Add another class." No post–first-upload nudge. |
| **Post-upload CTA** | Partially implemented | Auto-redirect to `/tasks` after 3s. No explicit "View on Dashboard" or "Generate AI Study Plan" buttons. |

### High-impact ideas to prioritize (not yet done)

1. **Study plan as a destination**  
   - Optional dedicated route (e.g. `/plan`) so “my study plan” is bookmarkable and shareable, not only a slide-over.
   - “Your plan was updated” or “Regenerate” from the plan view to encourage return visits.

2. **Plan → calendar actions**  
   - “Add these blocks to my calendar” (or “Add to Google Calendar”) so the plan creates real events. The plan then drives behavior on-site and in their calendar.

3. **Weekly digest email**  
   - “Your week ahead” or “Study plan summary” with 3–5 priorities and a CTA to open PlanEra. Recurring reason to come back.

4. **Dashboard “today / this week”**  
   - Prominent “Due today” and “This week” so the dashboard is the daily check. Consider a small “Suggested focus” derived from the study plan or weights.

5. **Lightweight progress / streaks**  
   - e.g. “You’ve completed 3 tasks this week” or “5-day streak” to build habit and return visits without feeling gamified.

6. **Encourage more uploads**  
   - After first syllabus: “Add your work schedule” or “Add practice/org calendar” so PlanEra becomes the single place for all time commitments. More data = more value = more reason to stay.

7. **Post-upload next step**  
   - After upload success: clear CTA to “View on Dashboard” or “Generate AI Study Plan” so the next action is in-app, not leaving.

### Messaging / copy
- Landing and About already stress “one place,” “no manual copying,” and “under a minute.”
- In-app: reinforce “your plan stays in sync” and “one click” so the differentiation is clear where they use the study plan.

---

## Summary

- **Differentiation:** We use the user’s real task data, one-click study plan, and integrated calendar/tasks so they don’t paste into ChatGPT or rebuild the plan elsewhere.
- **Retention:** Make the study plan a first-class destination, tie it to calendar actions, add a weekly email, and keep the dashboard as the daily “what’s due / what to do” home.
