# UX Review and Improvement Plan

## Critique of Current UX
The current application provides a functional foundation but lacks the polish and intuitive navigation expected of a modern, "premium" application, especially for non-technical users.

1.  **Navigation Flow**:
    *   **Issue**: The app relies on a custom `mode` state that mixes top-level navigation (Home, History) with specific task flows (Voice, Text).
    *   **Issue**: "History" is presented as just another button on the home screen, whereas it is typically a persistent section in most apps.
    *   **Issue**: There is no dedicated "Settings" area. Changing language requires "Resetting" the app, which is a destructive and confusing action.

2.  **Visual Hierarchy**:
    *   **Issue**: The Home screen is a vertical stack of buttons. While accessible, it feels more like a menu than a dashboard.
    *   **Issue**: The "Logout" button is small and tucked away, which is fine, but it lacks a proper home.

3.  **Aesthetics**:
    *   **Issue**: The stark black background is functional but could be improved with subtle gradients or distinct sectioning to feel more "premium".
    *   **Issue**: Transitions between states are abrupt (conditional rendering without animation).

## Proposed Improvements
To make the app simpler, smoother, and more professional, we will implement a **Bottom Navigation** structure. This is a standard pattern that users intuitively understand.

### 1. Structure Changes
*   **Main Screen Container**: Introduce a `MainScreen` that houses the three core pillars of the app:
    1.  **Home**: Quick access to "Voice Note" and "Text Message" actions.
    2.  **History**: A dedicated tab for viewing past translations.
    3.  **Settings**: A dedicated tab for Language preferences, App Installation, and Logout.
*   **Task Flows**: "Voice Note" and "Text Message" will remain as focused, full-screen experiences that hide the bottom navigation to minimize distractions.

### 2. Component Updates
*   **Bottom Navigation Bar**: A fixed bar at the bottom with clear icons and labels (Home, History, Settings).
*   **Settings Component**: A new view to manage preferences without "resetting" the entire onboarding flow.
*   **Visual Polish**:
    *   Improve card design on the Home screen.
    *   Add subtle entry animations for screens.
    *   Use a consistent header across the main tabs.

### 3. Implementation Steps
1.  Create `components/BottomNavigation.tsx`.
2.  Create `components/Settings.tsx`.
3.  Create `components/MainScreen.tsx` to manage the tabs.
4.  Refactor `App.tsx` to delegate the main view to `MainScreen`.
