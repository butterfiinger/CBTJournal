// Reusable component for a row of selectable chips.
// Supports multi-select and visual variants.
// Always displays selected items, even if they're not in the default options list.

export default function ChipRow({ options, selected, onToggle, variant = 'wound' }) {
  const selectedClass = variant === 'good' ? 'selected-good' : 'selected-wound';

  // Merge: show all defaults, plus any selected items that aren't in defaults.
  // Selected non-default items appear first so they're prominent.
  const selectedNotInDefaults = selected.filter((s) => !options.includes(s));
  const displayOptions = [...selectedNotInDefaults, ...options];

  return (
    <div>
      <div className="chip-row">
        {displayOptions.map((option) => {
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
