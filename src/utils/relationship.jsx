
//id1, id2 → the two selected people
//nodes → your entire family tree data
//Exported so it can be used in App.jsx
export function getRelationship(id1, id2, nodes) {
  if (!nodes[id1] || !nodes[id2]) return "Invalid selection";
  if (id1 === id2) return "Same person";

  const a = nodes[id1];
  const b = nodes[id2];

  const genderWord = (person, male, female) =>
    person.gender === "male" ? male : female;

  // -------------------------------------------------
  // 1️⃣ SPOUSE CHECK FIRST
  // -------------------------------------------------
 // -------------------------------------------------
// 1️⃣ SPOUSE CHECK (Using partner field)
// -------------------------------------------------
//if a has a partner and it is person b
if (a.partner && a.partner === id2) {
//if a is male and b is female then a is  husband and b is  wife
  if (a.gender === "male" && b.gender === "female") {
    return `${a.name} (husband) -> ${b.name} (wife)`;
  }
//similarly vice versa
  if (a.gender === "female" && b.gender === "male") {
    return `${b.name} (husband) -> ${a.name} (wife)`;
  }
//they are partners but does genders are not opposite
  return `${a.name} and ${b.name} are partners`;
}

// -------------------------------------------------
// 1️⃣6️⃣ BROTHER-IN-LAW / SISTER-IN-LAW (SYMMETRIC)
// If A is married to B's sibling OR vice versa
// -------------------------------------------------

const areSiblings = (person1, person2) => {
  if (!person1?.parents?.length || !person2?.parents?.length) return false;
  return person1.parents.some(p => person2.parents.includes(p));
};

// Case 1: A is married to B's sibling
if (a.partner && nodes[a.partner]) {
  const partnerOfA = nodes[a.partner];

  if (areSiblings(partnerOfA, b)) {
    const aRelation = a.gender === "male" ? "brother-in-law" : "sister-in-law";
    const bRelation = b.gender === "male" ? "brother-in-law" : "sister-in-law";

    return `${a.name} (${aRelation}) <-> ${b.name} (${bRelation})`;
  }
}

// Case 2: B is married to A's sibling
if (b.partner && nodes[b.partner]) {
  const partnerOfB = nodes[b.partner];

  if (areSiblings(partnerOfB, a)) {
    const bRelation = b.gender === "male" ? "brother-in-law" : "sister-in-law";
    const aRelation = a.gender === "male" ? "brother-in-law" : "sister-in-law";

    return `${b.name} (${bRelation}) <-> ${a.name} (${aRelation})`;
  }
}

// -------------------------------------------------
// PARENT-IN-LAW CHECK (BEFORE BFS)
// -------------------------------------------------

// A is parent of B's partner
if (b.partner && nodes[b.partner]) {
  const partnerOfB = nodes[b.partner];

  if (partnerOfB.parents?.includes(a.id)) {
    const parentInLaw = genderWord(a, "father-in-law", "mother-in-law");
    const childInLaw = genderWord(b, "son-in-law", "daughter-in-law");

    return `${a.name} (${parentInLaw}) <-> ${b.name} (${childInLaw})`;
  }
}

// B is parent of A's partner
if (a.partner && nodes[a.partner]) {
  const partnerOfA = nodes[a.partner];

  if (partnerOfA.parents?.includes(b.id)) {
    const parentInLaw = genderWord(b, "father-in-law", "mother-in-law");
    const childInLaw = genderWord(a, "son-in-law", "daughter-in-law");

    return `${b.name} (${parentInLaw}) <-> ${a.name} (${childInLaw})`;
  }
}

// -------------------------------------------------
// NEW: Partners of brothers (Sister-in-law ↔ Sister-in-law)
// If A and B are both partners of two brothers
// -------------------------------------------------

// -------------------------------------------------
// Partners of brothers (Sister-in-law ↔ Sister-in-law)
// -------------------------------------------------

// if (a.partner && b.partner) {

//   const partnerOfA = nodes[a.partner];
//   const partnerOfB = nodes[b.partner];

//   if (partnerOfA && partnerOfB) {

//     const arePartnersBrothers =
//       partnerOfA.gender === "male" &&
//       partnerOfB.gender === "male" &&
//       partnerOfA.parents?.some(p =>
//         partnerOfB.parents?.includes(p)
//       );

//     if (arePartnersBrothers) {
//       return `${a.name} (sister-in-law) <-> ${b.name} (sister-in-law)`;
//     }
//   } 
// }

// -------------------------------------------------
// If partners of A and B are siblings
// -------------------------------------------------

if (a.partner && b.partner) {

  const partnerOfA = nodes[a.partner];
  const partnerOfB = nodes[b.partner];

  if (
    partnerOfA &&
    partnerOfB &&
    areSiblings(partnerOfA, partnerOfB)
  ) {

    const relationA =
      a.gender === "male"
        ? "brother-in-law"
        : "sister-in-law";

    const relationB =
      b.gender === "male"
        ? "brother-in-law"
        : "sister-in-law";

    return `${a.name} (${relationA}) <-> ${b.name} (${relationB})`;
  }
}


  // -------------------------------------------------
  // Build Graph
  // -------------------------------------------------
  const graph = {};

  Object.values(nodes).forEach(person => {
    graph[person.id] = new Set();

    (person.parents || []).forEach(parentId => {
      graph[person.id].add(parentId);

      graph[parentId] ??= new Set();
      graph[parentId].add(person.id);
    });
  });

  // -------------------------------------------------
  // BFS
  // -------------------------------------------------
  const queue = [[id1, [id1]]];
  const visited = new Set([id1]);

  while (queue.length) {
    const [current, path] = queue.shift();

    if (current === id2) {
      return interpretPath(path, nodes);
    }

    for (let neighbor of graph[current] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }

  return "No relation";
}

// -------------------------------------------------
// INTERPRET RELATION
// -------------------------------------------------
function interpretPath(path, nodes) {
  const length = path.length - 1;

  const a = nodes[path[0]];
  const b = nodes[path[path.length - 1]];

  const genderWord = (person, male, female) =>
    person.gender === "male" ? male : female;

  // -------------------------------------------------
  // 2️⃣ DIRECT PARENT
  // -------------------------------------------------
  if (length === 1) {
    if (b.parents?.includes(a.id)) {
      return `${a.name} (${genderWord(a,"father","mother")}) -> ${b.name} (${genderWord(b,"son","daughter")})`;
    }
    if (a.parents?.includes(b.id)) {
      return `${b.name} (${genderWord(b,"father","mother")}) -> ${a.name} (${genderWord(a,"son","daughter")})`;
    }
  }

  // -------------------------------------------------
  // 3️⃣ GRAND / GREAT-GRAND / ANCESTOR
  // -------------------------------------------------
 const isDescending = path.every((node, i) =>
  i === 0 || nodes[path[i - 1]].parents?.includes(node)
);

const isAscending = path.every((node, i) =>
  i === 0 || nodes[node].parents?.includes(path[i - 1])
);

if (length >= 2 && (isAscending || isDescending)) {

  // If second node is parent of first → ascending
  const first = nodes[path[0]];
  const last = nodes[path[path.length - 1]];

  // Determine ancestor properly
  let ancestor, descendant;

  if (isAscending) {
    ancestor = first;
    descendant = last;
  } else {
    ancestor = last;
    descendant = first;
  }

  // GRANDPARENT
  if (length === 2) {
    return `${ancestor.name} (${genderWord(ancestor,"grandfather","grandmother")}) <-> ${descendant.name} (grandchild)`;
  }

  // GREAT-GRANDPARENT
  if (length === 3) {
    return `${ancestor.name} (${genderWord(ancestor,"great-grandfather","great-grandmother")}) <-> ${descendant.name} (great-grandchild)`;
  }

  if (length > 3) {
    return `${ancestor.name} (ancestor ${length - 1} levels above) <-> ${descendant.name}`;
  }
}
  // -------------------------------------------------
  // 4️⃣ SIBLINGS
  // -------------------------------------------------
  if (
    length === 2 &&
    a.parents &&
    b.parents &&
    a.parents.some(p => b.parents.includes(p))
  ) {
    return `${a.name} (${genderWord(a,"brother","sister")}) <-> ${b.name} (${genderWord(b,"brother","sister")})`;
  }

  // -------------------------------------------------
  // 5️⃣ UNCLE / AUNT
  // Pattern: A -> parent -> grandparent -> sibling -> B
  // -------------------------------------------------
  // -------------------------------------------------
// UNCLE / AUNT LOGIC (Clean Version)
// A is uncle/aunt of B if:
// A is sibling of B's parent
// -------------------------------------------------

// -------------------------------------------------
// UNCLE / AUNT LOGIC
// A is uncle/aunt of B if:
// A is sibling of B's parent
// OR
// B is sibling of A's parent
// -------------------------------------------------

 const areSiblings = (personId1, personId2) => {
  const p1 = nodes[personId1];
  const p2 = nodes[personId2];
  if (!p1?.parents?.length || !p2?.parents?.length) return false;
  return p1.parents.some(p => p2.parents.includes(p));
};

const aParents = a.parents || [];
const bParents = b.parents || [];

// -------------------------------------------------
// Case 1: A is blood uncle/aunt of B
// -------------------------------------------------
if (bParents.length) {
  const matchingParent = bParents.find(bParentId => 
    areSiblings(a.id, bParentId)
  );

  if (matchingParent) {
    const uncleOrAunt = a.gender === "male" ? "uncle" : "aunt";
    const nephewOrNiece = b.gender === "male" ? "nephew" : "niece";

    return `${a.name} (${uncleOrAunt}) <-> ${b.name} (${nephewOrNiece})`;
  }

  // -------------------------------------------------
  // NEW: A is married to blood-uncle/aunt of B
  // -------------------------------------------------
  if (a.partner && nodes[a.partner]) {
    const partnerOfA = nodes[a.partner];

    const partnerMatch = bParents.find(bParentId =>
      areSiblings(partnerOfA.id, bParentId)
    );

    if (partnerMatch) {
      const uncleOrAunt = a.gender === "male" ? "uncle" : "aunt";
      const nephewOrNiece = b.gender === "male" ? "nephew" : "niece";

      return `${a.name} (${uncleOrAunt}) <-> ${b.name} (${nephewOrNiece})`;
    }
  }
}

// -------------------------------------------------
// Case 2: B is blood uncle/aunt of A
// -------------------------------------------------
if (aParents.length) {
  const matchingParent = aParents.find(aParentId => 
    areSiblings(b.id, aParentId)
  );

  if (matchingParent) {
    const uncleOrAunt = b.gender === "male" ? "uncle" : "aunt";
    const nephewOrNiece = a.gender === "male" ? "nephew" : "niece";

    return `${b.name} (${uncleOrAunt}) <-> ${a.name} (${nephewOrNiece})`;
  }

  // -------------------------------------------------
  // NEW: B is married to blood-uncle/aunt of A
  // -------------------------------------------------
  if (b.partner && nodes[b.partner]) {
    const partnerOfB = nodes[b.partner];

    const partnerMatch = aParents.find(aParentId =>
      areSiblings(partnerOfB.id, aParentId)
    );

    if (partnerMatch) {
      const uncleOrAunt = b.gender === "male" ? "uncle" : "aunt";
      const nephewOrNiece = a.gender === "male" ? "nephew" : "niece";

      return `${b.name} (${uncleOrAunt}) <-> ${a.name} (${nephewOrNiece})`;
    }
  }
}

  // -------------------------------------------------
// // 1️⃣5️⃣ IN-LAW CHECK
// // A is parent of B's partner OR vice versa
// // -------------------------------------------------

// // Case 1: A is parent of B's partner
// if (b.partner && nodes[b.partner]) {
//   const partnerOfB = nodes[b.partner];

//   if (partnerOfB.parents?.includes(a.id)) {
//     const parentInLaw = genderWord(a, "father-in-law", "mother-in-law");
//     const childInLaw = genderWord(b, "son-in-law", "daughter-in-law");

//     return `${a.name} (${parentInLaw}) <-> ${b.name} (${childInLaw})`;
//   }
// }

// // Case 2: B is parent of A's partner
// if (a.partner && nodes[a.partner]) {
//   const partnerOfA = nodes[a.partner];

//   if (partnerOfA.parents?.includes(b.id)) {
//     const parentInLaw = genderWord(b, "father-in-law", "mother-in-law");
//     const childInLaw = genderWord(a, "son-in-law", "daughter-in-law");

//     return `${b.name} (${parentInLaw}) <-> ${a.name} (${childInLaw})`;
//   }
// }

  // -------------------------------------------------
  // 6️⃣ COUSINS
  // Pattern length 4: child -> parent -> grandparent -> parent -> child
  // -------------------------------------------------
  if (length === 4) {

  const parentA = path[1];
  const parentB = path[3];

  // 1️⃣ Must have different parents
  if (parentA === parentB) return;

  const parentsOfParentA = nodes[parentA].parents || [];
  const parentsOfParentB = nodes[parentB].parents || [];

  // 2️⃣ Parents must share at least one parent (siblings)
  const areParentsSiblings =
    parentsOfParentA.some(p => parentsOfParentB.includes(p));

  if (areParentsSiblings) {
return `${a.name} (cousin) -> ${b.name} (cousin)`;  }
}



  return `${a.name} is related to ${b.name}`;
}