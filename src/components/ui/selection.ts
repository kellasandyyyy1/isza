// Shared selected and unselected looks for chips, pickers, segments and option cards.
// Selected is never coral: --selected-bg with a 1px --line border, --selected-ink text and a heavier weight.
// Both states keep a 1px border so nothing shifts when the selection changes.
export const SELECTED_CLASSES = "border border-line bg-selected-bg font-semibold text-selected-ink";
export const UNSELECTED_CLASSES = "border border-line bg-transparent text-ink hover:bg-selected-bg/60";
