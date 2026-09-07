# Pathshala AI — Dashboard Calculations & Analytics Engine

This document provides a comprehensive technical reference for all algorithmic calculations powering the **Pathshala AI Dashboard**, including study streaks, the dual-factor heatmap learning score, quick performance metrics, and task attainment velocity.

---

## 1. Study Streak Calculation (`useStreak.js`)

### Purpose
To motivate daily learning consistency without unfairly punishing students who study late at night or across different time zones.

### Inputs
- $\mathcal{A}_{\text{active}}$: The set of unique calendar dates ($YYYY-MM-DD$ in user's local timezone) on which verified study activity occurred.
  - Sourced from:
    1. Daily user activity logins (`user_activity` collection).
    2. Note generation timestamps (`notes` collection).
    3. Lecture watch history timestamps (`watch_history` collection).
    4. Completed planner tasks (`planner_tasks` collection).

### Logic & Formulas

#### A. The Midnight Grace Period
Let $D_{\text{today}}$ be today's local date string ($YYYY-MM-DD$).  
Let $D_{\text{yesterday}}$ be yesterday's local date string ($YYYY-MM-DD$).

1. **Active Today**:
   If $D_{\text{today}} \in \mathcal{A}_{\text{active}}$:
   $$\text{Anchor Date} = D_{\text{today}}$$
   $$\text{currentStreak} = 1$$
   Iterate backwards day-by-day ($D_{\text{today}} - k \text{ days}$). For every consecutive day in $\mathcal{A}_{\text{active}}$, increment $\text{currentStreak}$.

2. **Grace Period Active (Not Studied Yet Today)**:
   If $D_{\text{today}} \notin \mathcal{A}_{\text{active}}$ AND $D_{\text{yesterday}} \in \mathcal{A}_{\text{active}}$:
   $$\text{Anchor Date} = D_{\text{yesterday}}$$
   $$\text{currentStreak} = 1$$
   Iterate backwards from yesterday. The student's streak remains **alive and unbroken** until 11:59:59 PM local time today.

3. **Broken Streak**:
   If neither $D_{\text{today}}$ nor $D_{\text{yesterday}}$ is in $\mathcal{A}_{\text{active}}$:
   $$\text{currentStreak} = 0$$

#### B. Longest Streak
Sort all unique active dates in ascending order:
$$\mathcal{D} = [d_1, d_2, \dots, d_n]$$
Iterate through $\mathcal{D}$:
$$\text{If } (d_{i} - d_{i-1}) = 1 \text{ day} \implies \text{tempStreak} = \text{tempStreak} + 1$$
$$\text{If } (d_{i} - d_{i-1}) > 1 \text{ day} \implies \text{tempStreak} = 1$$
$$\text{longestStreak} = \max(\text{longestStreak}, \text{tempStreak})$$

---

## 2. Heatmap Depth & Dual-Factor Daily Learning Score ($S$)

### Purpose
To calculate the color depth of each day square in the 12-week (84-day) heatmap grid. The score balances cognitive synthesis (notes), milestone completion (planner targets), active intake (videos), and platform presence (logins).

### The Mathematical Formula

For any calendar date $d$:

$$S(d) = S_{\text{planner}}(d) + S_{\text{notes}}(d) + S_{\text{videos}}(d) + S_{\text{visit}}(d)$$

#### Component Breakdown:

1. **Planner Score with Dual-Factor Weighting $S_{\text{planner}}(d)$**:
   $$S_{\text{planner}}(d) = \left( \sum_{t \in \mathcal{T}_{\text{completed}}(d)} W_{\text{priority}}(t) \right) + \text{Bonus}_{\text{attainment}}(d)$$

   - **Task Priority Weights $W_{\text{priority}}$**:
     - `high`: $3\text{ points}$ (heavy lecture, exam chapter, major milestone)
     - `medium`: $2\text{ points}$ (standard target, problem set)
     - `low`: $1\text{ point}$ (quick revision, bookmarking)

   - **Goal Attainment Bonus $\text{Bonus}_{\text{attainment}}$**:
     Let $N_{\text{completed}} = |\mathcal{T}_{\text{completed}}(d)|$ and $N_{\text{total}} = |\mathcal{T}_{\text{total}}(d)|$.
     $$\text{If } N_{\text{total}} > 0: \quad R_{\text{completion}} = \frac{N_{\text{completed}}}{N_{\text{total}}}$$
     $$\text{Bonus}_{\text{attainment}} = \text{round}(R_{\text{completion}} \times 3)$$

     > **Why this matters for single heavy targets:**  
     > If a student creates 1 high-priority task and completes it:  
     > $W_{\text{priority}} = 3\text{ pts}$  
     > $R_{\text{completion}} = 1.0 \implies \text{Bonus} = +3\text{ pts}$  
     > **Total Planner Score = 6 pts** $\rightarrow$ Reaches **Level 3: Deep Focus** immediately!

2. **AI Notes Generated $S_{\text{notes}}(d)$**:
   $$S_{\text{notes}}(d) = N_{\text{notes}}(d) \times 4\text{ points}$$
   Generating a structured AI outline and notes requires synthesizing educational content and active review.

3. **Lecture Videos Watched $S_{\text{videos}}(d)$**:
   $$S_{\text{videos}}(d) = N_{\text{videosWatched}}(d) \times 2\text{ points}$$
   Tracks focused time spent watching educational lectures from watch history.

4. **App Presence $S_{\text{visit}}(d)$**:
   $$S_{\text{visit}}(d) = 1\text{ point} \quad (\text{if user opened the app on date } d)$$

---

### Visual Intensity Tier Mapping

The continuous score $S(d)$ maps into 5 discrete visual levels:

| Level | Score Range | Learning Classification | Dark Mode Visual | Light Mode Visual |
| :---: | :---: | :--- | :--- | :--- |
| **0** | $S = 0$ | **Rest / Inactive** | `bg-zinc-900 border-zinc-950/20` | `bg-orange-100/70 border-orange-200/60` |
| **1** | $1 \le S \le 2$ | **Light Study** (1 video or login) | `bg-orange-500/20 border-orange-500/10` | `bg-orange-300 border-orange-400/40` |
| **2** | $3 \le S \le 5$ | **Moderate Study** (1 note or 2 tasks) | `bg-orange-500/45 border-orange-500/25` | `bg-orange-400 border-orange-500/60` |
| **3** | $6 \le S \le 8$ | **Deep Focus** (1 heavy plan done, or note + video) | `bg-orange-500/75 border-orange-500/50` | `bg-orange-500 border-orange-600` |
| **4** | $S \ge 9$ | **Masterclass Day** (Multiple notes & full targets) | `bg-orange-500 border-orange-400 shadow-sm shadow-orange-500/30` | `bg-orange-600 border-orange-700 shadow-sm` |

---

## 3. Quick Performance Metrics Calculations

### 1. Videos Learned
$$\text{Total Videos} = |\text{unique videos in watch\_history and notes}|$$

### 2. Notes Generated
$$\text{Total Notes} = |\text{notes in user's notes collection}|$$

### 3. Total Study Days
$$\text{Active Days} = |\mathcal{A}_{\text{active}}|$$

### 4. Weekly Velocity (Average Videos per Active Week)
Let $W_{\text{active}}$ be the count of unique calendar weeks (Sunday to Saturday) that had at least one active study session:
$$\text{Weekly Average} = \begin{cases} 
\frac{\text{Total Videos}}{W_{\text{active}}}, & \text{if } W_{\text{active}} > 0 \\
0.0, & \text{otherwise}
\end{cases}$$

---

## 4. Today's Study Plan (Daily Target Progress)

### Completion Rate
$$\text{Completion Percentage} = \begin{cases} 
\text{round}\left( \frac{N_{\text{completed}}}{N_{\text{total}}} \times 100 \right)\%, & \text{if } N_{\text{total}} > 0 \\
0\%, & \text{otherwise}
\end{cases}$$

### Visual State
- $0\%$: Muted progress bar.
- $1\% - 99\%$: Amber/orange animated progress bar.
- $100\%$: Glowing solid green/orange attainment badge with celebration state.
