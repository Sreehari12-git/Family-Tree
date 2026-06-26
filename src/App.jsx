import {getRelationship} from "./utils/relationship";
import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import ReactFlow, {
  Background,
  Controls,
  getBezierPath,
  BaseEdge,
} from "reactflow";
import "reactflow/dist/style.css";

const FamilyEdge = ({ id, sourceX, sourceY, targetX, targetY, data = {} }) => {
  const { variant, barY, x1, x2 } = data || {};

  if (variant === "drop") {
    const d = `M ${sourceX} ${sourceY} L ${sourceX} ${barY}`;
    return <path id={id} d={d} fill="none" stroke="#888" strokeWidth={1.5} />;
  }

  if (variant === "hbar") {
    const d = `M ${x1} ${barY} L ${x2} ${barY}`;
    return <path id={id} d={d} fill="none" stroke="#888" strokeWidth={1.5} />;
  }

  if (variant === "child-drop") {
    const approachY = targetY - 20;
    const d = `M ${x1} ${barY} L ${x1} ${approachY} L ${targetX} ${approachY} L ${targetX} ${targetY}`;
    return <path id={id} d={d} fill="none" stroke="#888" strokeWidth={1.5} />;
  }

  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY });
  return <BaseEdge id={id} path={path} style={{ stroke: "#999", strokeWidth: 1.5 }} />;
};

const edgeTypes = { family: FamilyEdge };

function App() {
  const [nodes, setNodes] = useState(() => {
    const saved = localStorage.getItem("familyTree");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("familyTree", JSON.stringify(nodes));
  }, [nodes]);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [relationText, setRelationText] = useState("");
  const [name, setName] = useState("");
  const [editingNode, setEditingNode] = useState(null);

  const createRootNode = () => {
    if (!name.trim()) return;
    const id = uuid();
    setNodes(prev => ({
      ...prev,
      [id]: { id, name, gender: "", birthDate: "", parents: [], children: [], siblings: [], partner: null }
    }));
    setName("");
  };

  const addParents = () => {
    if (!selectedId) return;
    const fatherId = uuid(), motherId = uuid();
    setNodes(prev => ({
      ...prev,
      [fatherId]: { id: fatherId, name: "Father", gender: "male", birthDate: "", parents: [], children: [selectedId], siblings: [], partner: motherId },
      [motherId]: { id: motherId, name: "Mother", gender: "female", birthDate: "", parents: [], children: [selectedId], siblings: [], partner: fatherId },
      [selectedId]: { ...prev[selectedId], parents: [fatherId, motherId] }
    }));
  };

  const addChild = () => {
    if (!selectedId) return;
    const childId = uuid();
    setNodes(prev => {
      const sel = prev[selectedId];
      const partnerId = sel.partner;
      const parentsArr = partnerId ? [selectedId, partnerId] : [selectedId];
      const updated = {
        ...prev,
        [childId]: { id: childId, name: "Child", gender: "", birthDate: "", parents: parentsArr, children: [], siblings: [], partner: null },
        [selectedId]: { ...sel, children: [...sel.children, childId] }
      };
      if (partnerId) updated[partnerId] = { ...prev[partnerId], children: [...prev[partnerId].children, childId] };
      return updated;
    });
  };

  const addPartner = () => {
    if (!selectedId) return;

    setNodes(prev => {
      const sel = prev[selectedId];

      if (sel.partner) {
        alert("Partner already exists");
        return prev;
      }

      if (!sel.gender) {
        alert("Please set gender before adding a partner.");
        return prev;
      }

      const partnerId = uuid();

      const partnerGender =
        sel.gender === "male"
          ? "female"
          : sel.gender === "female"
          ? "male"
          : "";

      if (!partnerGender) {
        alert("Same gender or unspecified gender partners are not allowed.");
        return prev;
      }

      const updated = {
        ...prev,
        [partnerId]: {
          id: partnerId,
          name: "Partner",
          gender: partnerGender,
          birthDate: "",
          parents: [],
          children: [...sel.children],
          siblings: [],
          partner: selectedId
        },
        [selectedId]: {
          ...sel,
          partner: partnerId
        }
      };

      sel.children.forEach(cid => {
        updated[cid] = {
          ...prev[cid],
          parents: [...prev[cid].parents, partnerId]
        };
      });

      return updated;
    });
  };

  const addSibling = () => {
    if (!selectedId) return;
    setNodes(prev => {
      const sel = prev[selectedId];
      if (!sel.parents.length) { alert("Cannot add sibling without parents"); return prev; }
      const sibId = uuid();
      const updated = {
        ...prev,
        [sibId]: { id: sibId, name: "Sibling", gender: "", birthDate: "", parents: [...sel.parents], children: [], siblings: [selectedId], partner: null },
        [selectedId]: { ...sel, siblings: [...sel.siblings, sibId] }
      };
      sel.parents.forEach(pid => {
        updated[pid] = { ...prev[pid], children: [...prev[pid].children, sibId] };
      });
      return updated;
    });
  };

  const deleteNode = () => {
    if (!selectedId) return;
    setNodes(prev => {
      const updated = { ...prev };
      const person = updated[selectedId];
      if (!person) return prev;
      person.parents.forEach(pid => { if (updated[pid]) updated[pid] = { ...updated[pid], children: updated[pid].children.filter(id => id !== selectedId) }; });
      person.children.forEach(cid => { if (updated[cid]) updated[cid] = { ...updated[cid], parents: updated[cid].parents.filter(id => id !== selectedId) }; });
      if (person.partner && updated[person.partner]) updated[person.partner] = { ...updated[person.partner], partner: null };
      person.siblings.forEach(sid => { if (updated[sid]) updated[sid] = { ...updated[sid], siblings: updated[sid].siblings.filter(id => id !== selectedId) }; });
      delete updated[selectedId];
      return updated;
    });
    setSelectedId(null);
  };

  const resetTree = () => {
    if (!window.confirm("Delete the entire family tree?")) return;
    localStorage.removeItem("familyTree");
    setNodes({});
    setSelectedId(null);
  };

  function computeLevels(nodes) {
    const levels = {};
    Object.keys(nodes).forEach(id => { levels[id] = 0; });

    let dirty = true;
    while (dirty) {
      dirty = false;
      Object.values(nodes).forEach(p => {
        p.parents.forEach(pid => {
          const req = (levels[pid] ?? 0) + 1;
          if ((levels[p.id] ?? 0) < req) {
            levels[p.id] = req;
            dirty = true;
          }
        });
      });
    }

    return levels;
  }

  const computeLayout = () => {
    if (!Object.keys(nodes).length) return { flowNodes: [], flowEdges: [] };

    const NODE_W = 160;
    const NODE_H = 50;
    const PARTNER_GAP = 16;
    const SIBLING_GAP = 40;
    const FAMILY_GAP = 80;
    const ROW_H = 160;

    const levels = {};
    Object.keys(nodes).forEach(id => { levels[id] = 0; });

    let dirty = true;
    while (dirty) {
      dirty = false;
      Object.values(nodes).forEach(p => {
        p.parents.forEach(pid => {
          const req = (levels[pid] ?? 0) + 1;
          if ((levels[p.id] ?? 0) < req) { levels[p.id] = req; dirty = true; }
        });
        if (p.partner != null) {
          const maxL = Math.max(levels[p.id] ?? 0, levels[p.partner] ?? 0);
          if ((levels[p.id] ?? 0) !== maxL) { levels[p.id] = maxL; dirty = true; }
          if ((levels[p.partner] ?? 0) !== maxL) { levels[p.partner] = maxL; dirty = true; }
        }
      });
    }

    const levelMap = {};
    Object.entries(levels).forEach(([id, lvl]) => {
      if (!levelMap[lvl]) levelMap[lvl] = [];
      levelMap[lvl].push(id);
    });
    const sortedLevels = Object.keys(levelMap).map(Number).sort((a, b) => a - b);

    const buildSlots = ids => {
      const seen = new Set();
      const slots = [];
      ids.forEach(id => {
        if (seen.has(id)) return;
        seen.add(id);
        const pid = nodes[id]?.partner;
        if (pid && ids.includes(pid) && !seen.has(pid)) {
          seen.add(pid);
          slots.push([id, pid]);
        } else {
          slots.push([id]);
        }
      });
      return slots;
    };

    const slotW = slot => slot.length === 2 ? NODE_W * 2 + PARTNER_GAP : NODE_W;

    const xPos = {};

    const placeSlots = (slots, startX) => {
      let cursor = startX;
      slots.forEach((slot, i) => {
        if (i > 0) cursor += SIBLING_GAP;
        xPos[slot[0]] = cursor;
        if (slot.length === 2) xPos[slot[1]] = cursor + NODE_W + PARTNER_GAP;
        cursor += slotW(slot);
      });
      return cursor;
    };

    const layoutLevel = (lvl, refGetter) => {
      const slots = buildSlots(levelMap[lvl]);

      const idealCenter = slots.map(slot => {
        const refs = refGetter(slot).filter(r => xPos[r] !== undefined);
        if (!refs.length) return null;
        const xs = refs.map(r => xPos[r]);
        return (Math.min(...xs) + Math.max(...xs) + NODE_W) / 2;
      });

      const keyOf = slots.map(slot => {
        const refs = refGetter(slot);
        return refs.slice().sort().join("|") || "free";
      });

      const groupMap = {};
      slots.forEach((_, i) => {
        if (!groupMap[keyOf[i]]) groupMap[keyOf[i]] = [];
        groupMap[keyOf[i]].push(i);
      });

      const groups = Object.values(groupMap).map(idxs => {
        const cs = idxs.map(i => idealCenter[i]).filter(c => c !== null);
        const avg = cs.length ? cs.reduce((a, b) => a + b, 0) / cs.length : null;
        return { idxs, avg };
      }).sort((a, b) => {
        if (a.avg === null) return 1;
        if (b.avg === null) return -1;
        return a.avg - b.avg;
      });

      let cursor = 0;
      groups.forEach(({ idxs, avg }) => {
        const groupSlots = idxs.map(i => slots[i]);
        const totalW = groupSlots.reduce((s, sl, i) => s + slotW(sl) + (i > 0 ? SIBLING_GAP : 0), 0);
        let start = avg !== null ? avg - totalW / 2 : cursor;
        start = Math.max(start, cursor);
        const end = placeSlots(groupSlots, start);
        cursor = end + FAMILY_GAP;
      });
    };

    const anchorLvl = sortedLevels.reduce(
      (best, lvl) => levelMap[lvl].length >= levelMap[best].length ? lvl : best,
      sortedLevels[0]
    );
    placeSlots(buildSlots(levelMap[anchorLvl]), 0);

    sortedLevels.filter(l => l > anchorLvl).forEach(lvl => {
      layoutLevel(lvl, slot => {
        const pids = new Set();
        slot.forEach(id => (nodes[id]?.parents || []).forEach(p => pids.add(p)));
        return [...pids];
      });
    });

    sortedLevels.filter(l => l < anchorLvl).sort((a, b) => b - a).forEach(lvl => {
      layoutLevel(lvl, slot => {
        const cids = new Set();
        slot.forEach(id => (nodes[id]?.children || []).forEach(c => cids.add(c)));
        return [...cids];
      });
    });

    const flowNodes = Object.values(nodes).map(person => {
      const gender = person.gender;
      const isSelected = selectedIds.includes(person.id);

      const borderColor = isSelected
        ? "#c0392b"
        : gender === "male"
        ? "#2980b9"
        : gender === "female"
        ? "#8e44ad"
        : "#c05621";
      return {
        id: person.id,
        data: {
          label: (
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{person.name}</div>
              {person.birthDate && <div style={{ fontSize: 10, color: "#888" }}>{person.birthDate}</div>}
            </div>
          )
        },
        position: {
          x: xPos[person.id] ?? 0,
          y: (levels[person.id] ?? 0) * ROW_H
        },
        style: {
          border: `2px solid ${borderColor}`,
          borderWidth: isSelected ? 3 : 2,
          padding: "8px 12px",
          borderRadius: 8,
          background: isSelected ? "#fff5f5" : "white",
          width: NODE_W,
          fontSize: 13,
        }
      };
    });

    const edgeSet = new Set();
    const flowEdges = [];

    Object.values(nodes).forEach(person => {
      if (!person.partner) return;
      const eid = [person.id, person.partner].sort().join("~~");
      if (edgeSet.has(eid)) return;
      edgeSet.add(eid);
      flowEdges.push({
        id: eid,
        source: person.id,
        target: person.partner,
        animated: true,
        style: { stroke: "#e74c3c", strokeDasharray: "6,4", strokeWidth: 1.5 }
      });
    });

    const coupleMap = {};

    Object.values(nodes).forEach(child => {
      if (!child.parents.length) return;

      if (child.parents.length === 2) {
        const [p1, p2] = child.parents;
        const arePartners = nodes[p1]?.partner === p2 || nodes[p2]?.partner === p1;

        if (arePartners) {
          const coupleKey = [p1, p2].sort().join(",");
          if (!coupleMap[coupleKey]) {
            const parentLvl = levels[p1] ?? 0;
            const childLvl  = levels[child.id] ?? 0;
            const parentBottomY = parentLvl * ROW_H + NODE_H;
            const childTopY     = childLvl * ROW_H;
            const barY  = parentBottomY + (childTopY - parentBottomY) * 0.5;
            const p1CX  = (xPos[p1] ?? 0) + NODE_W / 2;
            const p2CX  = (xPos[p2] ?? 0) + NODE_W / 2;
            coupleMap[coupleKey] = {
              p1, p2, barY,
              leftX:  Math.min(p1CX, p2CX),
              rightX: Math.max(p1CX, p2CX),
              midX:   (p1CX + p2CX) / 2,
              children: []
            };
          }
          coupleMap[coupleKey].children.push(child.id);
          return;
        }
      }

      child.parents.forEach(pid => {
        const eid = `${pid}->${child.id}`;
        if (!edgeSet.has(eid)) {
          edgeSet.add(eid);
          flowEdges.push({
            id: eid, source: pid, target: child.id,
            type: "smoothstep",
            style: { stroke: "#888", strokeWidth: 1.5 }
          });
        }
      });
    });

    Object.entries(coupleMap).forEach(([coupleKey, { p1, p2, barY, leftX, rightX, midX, children }]) => {
      [p1, p2].forEach(pid => {
        const eid = `drop|${pid}|${coupleKey}`;
        if (!edgeSet.has(eid)) {
          edgeSet.add(eid);
          flowEdges.push({
            id: eid, source: pid, target: p2,
            type: "family", data: { variant: "drop", barY }
          });
        }
      });

      const hbarEid = `hbar|${coupleKey}`;
      if (!edgeSet.has(hbarEid)) {
        edgeSet.add(hbarEid);
        flowEdges.push({
          id: hbarEid, source: p1, target: p2,
          type: "family", data: { variant: "hbar", barY, x1: leftX, x2: rightX }
        });
      }

      children.forEach(childId => {
        const childCenterX = (xPos[childId] ?? 0) + NODE_W / 2;
        const eid = `cdrop|${coupleKey}|${childId}`;
        if (!edgeSet.has(eid)) {
          edgeSet.add(eid);
          flowEdges.push({
            id: eid, source: p1, target: childId,
            type: "family", data: { variant: "child-drop", barY, x1: midX }
          });
        }
      });
    });

    return { flowNodes, flowEdges };
  };

  const { flowNodes, flowEdges } = computeLayout();

  const btnStyle = (disabled, danger) => ({
    padding: "6px 12px", borderRadius: 6, border: "none",
    background: disabled ? "#eee" : danger ? "#c0392b" : "#2c3e50",
    color: disabled ? "#aaa" : "white",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13, fontWeight: 500
  });

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ margin: "0 0 12px" }}>🌳 Family Tree</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && createRootNode()}
          placeholder="Enter name..."
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14, width: 160 }}
        />
        <button style={btnStyle(false, false)} onClick={createRootNode}>＋ Create</button>
        <button style={btnStyle(!selectedId, false)} onClick={() => setEditingNode(nodes[selectedId])}>✏️ Edit</button>
        <button style={btnStyle(!selectedId, false)} onClick={addParents}>👨‍👩 Add Parents</button>
        <button style={btnStyle(!selectedId, false)} onClick={addChild}>👶 Add Child</button>
        <button style={btnStyle(!selectedId, false)} onClick={addPartner}>💑 Add Partner</button>
        <button style={btnStyle(!selectedId, false)} onClick={addSibling}>🧑‍🤝‍🧑 Add Sibling</button>
        <button style={btnStyle(!selectedId, true)} onClick={deleteNode}>🗑 Delete</button>
        <button style={btnStyle(false, true)} onClick={resetTree}>↺ Reset</button>
      </div>

      {selectedId && nodes[selectedId] && (
        <div style={{ marginBottom: 8, fontSize: 13, color: "#666" }}>
          Selected: <strong>{nodes[selectedId].name}</strong>
          {relationText && (
            <div style={{ marginBottom: 10, fontSize: 14, color: "#2c3e50" }}>
              <strong>Relationship:</strong> {relationText}
            </div>
          )}
        </div>
      )}

      <div style={{ height: "75vh", border: "1px solid #ddd", borderRadius: 10, overflow: "hidden" }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          edgeTypes={edgeTypes}
          onNodeClick={(_, node) => {
            setSelectedIds(prev => {
              const updated = [...prev, node.id].slice(-2);

              if (updated.length === 2) {
                const relation = getRelationship(
                  updated[0],
                  updated[1],
                  nodes,
                  computeLevels(nodes)
                );
                setRelationText(relation);
              }

              return updated;
            });

            setSelectedId(node.id);
          }}
          fitView
          fitViewOptions={{ padding: 0.3 }}
        >
          <Background color="#f5f0e8" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      {editingNode && (
        <div style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          background: "white", padding: 24, borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)", zIndex: 1000, minWidth: 280
        }}>
          <h3 style={{ marginTop: 0 }}>Edit Person</h3>

          <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>Name</label>
          <input value={editingNode.name}
            onChange={e => setEditingNode({ ...editingNode, name: e.target.value })}
            style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", marginBottom: 12, fontSize: 14, boxSizing: "border-box" }}
          />

          <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>Gender</label>
          <select value={editingNode.gender}
            onChange={e => setEditingNode({ ...editingNode, gender: e.target.value })}
            style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", marginBottom: 12, fontSize: 14, boxSizing: "border-box" }}
          >
            <option value="">Unspecified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <label style={{ fontSize: 13, display: "block", marginBottom: 4 }}>Birth Date</label>
          <input type="date" value={editingNode.birthDate}
            onChange={e => setEditingNode({ ...editingNode, birthDate: e.target.value })}
            style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", marginBottom: 16, fontSize: 14, boxSizing: "border-box" }}
          />

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={btnStyle(false, false)} onClick={() => setEditingNode(null)}>Cancel</button>
            <button style={btnStyle(false, false)} onClick={() => {
              setNodes(prev => {
                const person = editingNode;
                const partnerId = person.partner;

                if (partnerId && prev[partnerId]) {
                  const partner = prev[partnerId];

                  if (
                    person.gender &&
                    partner.gender &&
                    person.gender === partner.gender
                  ) {
                    alert("Same gender partners are not allowed.");
                    return prev;
                  }
                }

                return {
                  ...prev,
                  [person.id]: person
                };
              });

              setEditingNode(null);
            }}>💾 Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;