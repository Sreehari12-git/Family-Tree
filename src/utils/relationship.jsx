export function getRelationship(id1, id2, nodes) {
  if (!nodes[id1] || !nodes[id2]) return "Invalid selection";
  if (id1 === id2) return "Same person";

  const a = nodes[id1];
  const b = nodes[id2];

  const genderWord = (person, male, female) =>
    person.gender === "male" ? male : person.gender === "female" ? female : male;
  const areSiblings = (person1, person2) => {
    if (!person1?.parents?.length || !person2?.parents?.length) return false;
    return person1.parents.some(p => person2.parents.includes(p));
  };

  const areSiblingsById = (id_1, id_2) => areSiblings(nodes[id_1], nodes[id_2]);

  if (a.partner && a.partner === id2) {
    if (a.gender === "male" && b.gender === "female")
      return `${a.name} (husband) -> ${b.name} (wife)`;
    if (a.gender === "female" && b.gender === "male")
      return `${b.name} (husband) -> ${a.name} (wife)`;
    return `${a.name} and ${b.name} are partners`;
  }

  if (b.parents?.includes(a.id)) {
    return `${a.name} (${genderWord(a, "father", "mother")}) -> ${b.name} (${genderWord(b, "son", "daughter")})`;
  }
  if (a.parents?.includes(b.id)) {
    return `${b.name} (${genderWord(b, "father", "mother")}) -> ${a.name} (${genderWord(a, "son", "daughter")})`;
  }

  const getAncestors = (personId, maxDepth) => {
    const result = new Map(); 
    const queue = [[personId, 0]];
    while (queue.length) {
      const [curId, depth] = queue.shift();
      if (depth >= maxDepth) continue;
      for (const pid of nodes[curId]?.parents || []) {
        if (!result.has(pid)) {
          result.set(pid, depth + 1);
          queue.push([pid, depth + 1]);
        }
      }
    }
    return result;
  };

  const ancestorLabel = (depth, person, asAncestor) => {
    if (asAncestor) {
      if (depth === 1) return genderWord(person, "father-in-law", "mother-in-law");
      if (depth === 2) return genderWord(person, "grandfather", "grandmother");
      if (depth === 3) return genderWord(person, "great-grandfather", "great-grandmother");
      return genderWord(person, "great-grandfather", "great-grandmother");
    } else {
      if (depth === 1) return genderWord(person, "son-in-law", "daughter-in-law");
      if (depth === 2) return "grandchild";
      if (depth === 3) return "great-grandchild";
      return "great-grandchild";
    }
  };

  if (b.partner && nodes[b.partner]) {
    const bPartnerAncestors = getAncestors(b.partner, 4);
    if (bPartnerAncestors.has(a.id)) {
      const depth = bPartnerAncestors.get(a.id);
      return `${a.name} (${ancestorLabel(depth, a, true)}) <-> ${b.name} (${ancestorLabel(depth, b, false)})`;
    }
  }
  if (a.partner && nodes[a.partner]) {
    const aPartnerAncestors = getAncestors(a.partner, 4);
    if (aPartnerAncestors.has(b.id)) {
      const depth = aPartnerAncestors.get(b.id);
      return `${b.name} (${ancestorLabel(depth, b, true)}) <-> ${a.name} (${ancestorLabel(depth, a, false)})`;
    }
  }

  
  if (a.partner && areSiblings(nodes[a.partner], b)) {
    return `${a.name} (${genderWord(a, "brother-in-law", "sister-in-law")}) <-> ${b.name} (${genderWord(b, "brother-in-law", "sister-in-law")})`;
  }
  if (b.partner && areSiblings(nodes[b.partner], a)) {
    return `${b.name} (${genderWord(b, "brother-in-law", "sister-in-law")}) <-> ${a.name} (${genderWord(a, "brother-in-law", "sister-in-law")})`;
  }

  
  if (a.partner && b.partner && areSiblings(nodes[a.partner], nodes[b.partner])) {
    return `${a.name} (${genderWord(a, "brother-in-law", "sister-in-law")}) <-> ${b.name} (${genderWord(b, "brother-in-law", "sister-in-law")})`;
  }

 
  if (areSiblings(a, b)) {
    return `${a.name} (${genderWord(a, "brother", "sister")}) <-> ${b.name} (${genderWord(b, "brother", "sister")})`;
  }

 
  const aIsUncleAunt = (b.parents || []).find(bpId => areSiblingsById(a.id, bpId));
  if (aIsUncleAunt) {
    return `${a.name} (${genderWord(a, "uncle", "aunt")}) <-> ${b.name} (${genderWord(b, "nephew", "niece")})`;
  }
  
  if (a.partner) {
    const aPartnerIsUncleAunt = (b.parents || []).find(bpId => areSiblingsById(a.partner, bpId));
    if (aPartnerIsUncleAunt) {
      return `${a.name} (${genderWord(a, "uncle", "aunt")}) <-> ${b.name} (${genderWord(b, "nephew", "niece")})`;
    }
  }

  const bIsUncleAunt = (a.parents || []).find(apId => areSiblingsById(b.id, apId));
  if (bIsUncleAunt) {
    return `${b.name} (${genderWord(b, "uncle", "aunt")}) <-> ${a.name} (${genderWord(a, "nephew", "niece")})`;
  }
 
  if (b.partner) {
    const bPartnerIsUncleAunt = (a.parents || []).find(apId => areSiblingsById(b.partner, apId));
    if (bPartnerIsUncleAunt) {
      return `${b.name} (${genderWord(b, "uncle", "aunt")}) <-> ${a.name} (${genderWord(a, "nephew", "niece")})`;
    }
  }

  
  const graph = {};
  Object.values(nodes).forEach(person => {
    graph[person.id] ??= new Set();
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
    if (current === id2) return interpretPath(path, nodes);
    for (let neighbor of graph[current] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }

  return "No relation found";
}


function interpretPath(path, nodes) {
  const length = path.length - 1;
  const a = nodes[path[0]];
  const b = nodes[path[path.length - 1]];

  const genderWord = (person, male, female) =>
    person.gender === "male" ? male : person.gender === "female" ? female : male;

  
  const isAscending = path.every((id, i) =>
    i === 0 || nodes[id].parents?.includes(path[i - 1])
  );
  const isDescending = path.every((id, i) =>
    i === 0 || nodes[path[i - 1]].parents?.includes(id)
  );

  if (length >= 2 && (isAscending || isDescending)) {
    const ancestor  = isAscending ? a : b;
    const descendant = isAscending ? b : a;

    if (length === 2)
      return `${ancestor.name} (${genderWord(ancestor, "grandfather", "grandmother")}) <-> ${descendant.name} (grandchild)`;
    if (length === 3)
      return `${ancestor.name} (${genderWord(ancestor, "great-grandfather", "great-grandmother")}) <-> ${descendant.name} (great-grandchild)`;
    return `${ancestor.name} (ancestor, ${length - 1} levels up) <-> ${descendant.name}`;
  }

  
  if (length === 4) {
    const parentA = path[1];
    const parentB = path[3];
    if (parentA !== parentB) {
      const parentsOfA = nodes[parentA]?.parents || [];
      const parentsOfB = nodes[parentB]?.parents || [];
      if (parentsOfA.some(p => parentsOfB.includes(p))) {
        return `${a.name} (cousin) <-> ${b.name} (cousin)`;
      }
    }
  }

  return `${a.name} is related to ${b.name}`;
}

