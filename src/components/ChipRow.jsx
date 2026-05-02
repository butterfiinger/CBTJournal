// Reusable component for a row of selectable chips.
// Supports multi-select, "show all" affordance, and visual variants.

export default function ChipRow({ options, selected, onToggle, onShowAll, variant = 'wound' }) {
  const selectedClass = variant === 'good' ? 'selected-good' : 'selected-wound';

  return (
    <div>
      <div className="chip-row">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              className={`chip ${isSelected ? selectedClass : ''}`}
              onClick={() => onToggle(option)}
            >
              {option}
              {isSelected && ' ✓'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
