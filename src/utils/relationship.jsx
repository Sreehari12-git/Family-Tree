export function getRelationship(id1, id2, nodes) {
  if (!nodes[id1] || !nodes[id2]) return "Invalid selection";
  if (id1 === id2) return "Same person";

  const a = nodes[id1];
  const b = nodes[id2];

  const genderWord = (person, male, female) =>
    person.gender === "male" ? male : female;

if (a.partner && a.partner === id2) {
  if (a.gender === "male" && b.gender === "female") {
    return `${a.name} (husband) -> ${b.name} (wife)`;
  }
  if (a.gender === "female" && b.gender === "male") {
    return `${b.name} (husband) -> ${a.name} (wife)`;
  }
  return `${a.name} and ${b.name} are partners`;
}

const areSiblings = (person1, person2) => {
  if (!person1?.parents?.length || !person2?.parents?.length) return false;
  return person1.parents.some(p => person2.parents.includes(p));
};

if (a.partner && nodes[a.partner]) {
  const partnerOfA = nodes[a.partner];

  if (areSiblings(partnerOfA, b)) {
    const aRelation = a.gender === "male" ? "brother-in-law" : "sister-in-law";
    const bRelation = b.gender === "male" ? "brother-in-law" : "sister-in-law";

    return `${a.name} (${aRelation}) <-> ${b.name} (${bRelation})`;
  }
}

if (b.partner && nodes[b.partner]) {
  const partnerOfB = nodes[b.partner];

  if (areSiblings(partnerOfB, a)) {
    const bRelation = b.gender === "male" ? "brother-in-law" : "sister-in-law";
    const aRelation = a.gender === "male" ? "brother-in-law" : "sister-in-law";

    return `${b.name} (${bRelation}) <-> ${a.name} (${aRelation})`;
  }
}

if (b.partner && nodes[b.partner]) {
  const partnerOfB = nodes[b.partner];

  if (partnerOfB.parents?.includes(a.id)) {
    const parentInLaw = genderWord(a, "father-in-law", "mother-in-law");
    const childInLaw = genderWord(b, "son-in-law", "daughter-in-law");

    return `${a.name} (${parentInLaw}) <-> ${b.name} (${childInLaw})`;
  }
}

if (a.partner && nodes[a.partner]) {
  const partnerOfA = nodes[a.partner];

  if (partnerOfA.parents?.includes(b.id)) {
    const parentInLaw = genderWord(b, "father-in-law", "mother-in-law");
    const childInLaw = genderWord(a, "son-in-law", "daughter-in-law");

    return `${b.name} (${parentInLaw}) <-> ${a.name} (${childInLaw})`;
  }
}

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

  const graph = {};

  Object.values(nodes).forEach(person => {
    graph[person.id] = new Set();

    (person.parents || []).forEach(parentId => {
      graph[person.id].add(parentId);

      graph[parentId] ??= new Set();
      graph[parentId].add(person.id);
    });
  });

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

function interpretPath(path, nodes) {
  const length = path.length - 1;

  const a = nodes[path[0]];
  const b = nodes[path[path.length - 1]];

  const genderWord = (person, male, female) =>
    person.gender === "male" ? male : female;


  if (length === 1) {
    if (b.parents?.includes(a.id)) {
      return `${a.name} (${genderWord(a,"father","mother")}) -> ${b.name} (${genderWord(b,"son","daughter")})`;
    }
    if (a.parents?.includes(b.id)) {
      return `${b.name} (${genderWord(b,"father","mother")}) -> ${a.name} (${genderWord(a,"son","daughter")})`;
    }
  }

 const isDescending = path.every((node, i) =>
  i === 0 || nodes[path[i - 1]].parents?.includes(node)
);

const isAscending = path.every((node, i) =>
  i === 0 || nodes[node].parents?.includes(path[i - 1])
);

if (length >= 2 && (isAscending || isDescending)) {

  const first = nodes[path[0]];
  const last = nodes[path[path.length - 1]];

  let ancestor, descendant;

  if (isAscending) {
    ancestor = first;
    descendant = last;
  } else {
    ancestor = last;
    descendant = first;
  }

  if (length === 2) {
    return `${ancestor.name} (${genderWord(ancestor,"grandfather","grandmother")}) <-> ${descendant.name} (grandchild)`;
  }

  if (length === 3) {
    return `${ancestor.name} (${genderWord(ancestor,"great-grandfather","great-grandmother")}) <-> ${descendant.name} (great-grandchild)`;
  }

  if (length > 3) {
    return `${ancestor.name} (ancestor ${length - 1} levels above) <-> ${descendant.name}`;
  }

  if (
    length === 2 &&
    a.parents &&
    b.parents &&
    a.parents.some(p => b.parents.includes(p))
  ) {
    return `${a.name} (${genderWord(a,"brother","sister")}) <-> ${b.name} (${genderWord(b,"brother","sister")})`;
  }


 const areSiblings = (personId1, personId2) => {
  const p1 = nodes[personId1];
  const p2 = nodes[personId2];
  if (!p1?.parents?.length || !p2?.parents?.length) return false;
  return p1.parents.some(p => p2.parents.includes(p));
};

const aParents = a.parents || [];
const bParents = b.parents || [];


if (bParents.length) {
  const matchingParent = bParents.find(bParentId => 
    areSiblings(a.id, bParentId)
  );

  if (matchingParent) {
    const uncleOrAunt = a.gender === "male" ? "uncle" : "aunt";
    const nephewOrNiece = b.gender === "male" ? "nephew" : "niece";

    return `${a.name} (${uncleOrAunt}) <-> ${b.name} (${nephewOrNiece})`;
  }

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


if (aParents.length) {
  const matchingParent = aParents.find(aParentId => 
    areSiblings(b.id, aParentId)
  );

  if (matchingParent) {
    const uncleOrAunt = b.gender === "male" ? "uncle" : "aunt";
    const nephewOrNiece = a.gender === "male" ? "nephew" : "niece";

    return `${b.name} (${uncleOrAunt}) <-> ${a.name} (${nephewOrNiece})`;
  }

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


  if (length === 4) {

  const parentA = path[1];
  const parentB = path[3];

  if (parentA === parentB) return;

  const parentsOfParentA = nodes[parentA].parents || [];
  const parentsOfParentB = nodes[parentB].parents || [];

  const areParentsSiblings =
    parentsOfParentA.some(p => parentsOfParentB.includes(p));

  if (areParentsSiblings) {
return `${a.name} (cousin) -> ${b.name} (cousin)`;  }
}



  return `${a.name} is related to ${b.name}`;
}
