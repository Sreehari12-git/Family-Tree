# 🌳 Interactive Family Tree Builder

Interactive Family Tree Builder is a modern, responsive web application built with **React**, **Vite**, and **React Flow** that allows users to create, modify, visualize, and analyze their family lineage. The application computes optimal vertical tree hierarchies automatically and dynamically determines the relationship between any two selected family members.

---

## 🚀 Key Features

*   **Interactive Visualization Canvas**: Powered by `reactflow` with full support for zooming, panning, and control tools.
*   **Optimal Node Layout**: Custom level-computing algorithm (inspired by Bellman-Ford/BFS ranking) that automatically positions generations, partners, and siblings in neat horizontal and vertical tiers.
*   **Clean Lineage Routing (T-Junctions)**: A custom `FamilyEdge` SVG edge renderer with three routing modes (`drop`, `hbar`, and `child-drop`) designed to eliminate line crossing and keep child connectors centered between their parents.
*   **Full Node Lifecycle Management**:
    *   Add parents, siblings, partners, and children relative to a selected person.
    *   Edit member properties: Name, Gender (Male, Female, Other), and Birth Date.
    *   Delete nodes (cleanly detaching links) or reset the entire workspace.
*   **Validation Constraints**: Protects tree integrity by enforcing logical checks, such as:
    *   Preventing partner assignments without specifying a gender first.
    *   Enforcing opposite-gender partners.
    *   Restricting sibling additions to nodes that have parent records.
*   **Dynamic Relationship Finder**: Select any two nodes in the tree to automatically trace their connection. Computes standard direct relations (spouses, parents, children, siblings) as well as complex paths (aunts/uncles, cousins, in-laws, grandparents, and distant ancestors) via BFS-based path calculation.
*   **State Persistence**: Uses browser `localStorage` to save the family tree automatically.

---

## 🛠️ Technology Stack

*   **Framework**: [React 19](https://react.dev/)
*   **Build Tool**: [Vite](https://vite.dev/)
*   **Graph/Visual Canvas**: [React Flow 11](https://reactflow.dev/)
*   **ID Generation**: `uuid` (v13)
*   **Styling**: Vanilla inline styles and custom CSS

---

## 📂 Directory Structure

```text
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
└── src/
    ├── main.jsx                 # Application entry point
    ├── App.jsx                  # Main interface, React Flow setup, layout engine, and modal dialogs
    ├── App.css                  # Component-specific styles
    ├── index.css                # Global canvas backgrounds and utility styles
    ├── components/
    │   └── PersonNode.jsx       # Custom presentation component for family members
    └── utils/
        └── relationship.jsx     # BFS graph-traversal engine and relationship interpreter
```

### Key Components & Modules

1.  **[App.jsx](file:///c:/Users/SreehariKP/OneDrive%20-%20Gnapi%20Technologies%20Private%20Limited/Documents/Training%20Projects/FT/ft/src/App.jsx)**:
    *   Manages the local state of all family members (`nodes`).
    *   Implements the `computeLayout()` method which groups people by generation depth and positions them horizontal-wise relative to their siblings and partners.
    *   Defines `FamilyEdge` (a custom edge component) that renders paths cleanly as T-junctions connecting partners to their children.
2.  **[relationship.jsx](file:///c:/Users/SreehariKP/OneDrive%20-%20Gnapi%20Technologies%20Private%20Limited/Documents/Training%20Projects/FT/ft/src/utils/relationship.jsx)**:
    *   Builds an adjacency list of the family graph.
    *   Traces relationships using BFS path interpretation.
    *   Interprets paths into natural relationship labels (e.g. `Uncle`, `Cousin`, `Great-Grandmother`, `Son-in-law`).
3.  **[PersonNode.jsx](file:///c:/Users/SreehariKP/OneDrive%20-%20Gnapi%20Technologies%20Private%20Limited/Documents/Training%20Projects/FT/ft/src/components/PersonNode.jsx)**:
    *   A reusable React component wrapper to display a person node on the interface.

---

## ⚙️ Installation & Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    This will start a local server, usually running at `http://localhost:5173`.

3.  **Build for Production**:
    ```bash
    npm run build
    ```

---

## 💡 How to Use

1.  **Create a Root Node**: Enter a name in the top input field and click **Create**.
2.  **Select a Node**: Click any card in the React Flow canvas to highlight it.
3.  **Build Out the Tree**: With a node selected, click the utility buttons at the top to add **Parents**, **Siblings**, **Partners**, or **Children**.
4.  **Edit Details**: Click **Edit** to adjust name, gender, or birth date in a popup modal.
5.  **Check Relationships**: Click on one person node, then click a second person node. The application will compute and display the exact relationship between the two selected members (e.g. `A (grandfather) <-> B (grandchild)`).
