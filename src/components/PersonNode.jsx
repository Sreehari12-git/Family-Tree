function PersonNode({ person, isSelected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(person.id)}
      style={{
        border: isSelected ? "3px solid red" : "2px solid brown",
        padding: "10px",
        borderRadius: "8px",
        margin: "10px",
        display: "inline-block",
        cursor: "pointer",
        backgroundColor: isSelected ? "#ffeaea" : "white"
      }}
    >
      {person.name}
    </div>
  );
}

export default PersonNode;