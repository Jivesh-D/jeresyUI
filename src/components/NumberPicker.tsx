interface NumberPickerProps {
  value: string
  takenNumbers: Set<string>
  onChange: (value: string) => void
  disabled?: boolean
}

const NUMBERS = Array.from({ length: 99 }, (_, i) => String(i + 1))

export function NumberPicker({ value, takenNumbers, onChange, disabled }: NumberPickerProps) {
  return (
    <div className="number-picker">
      <div className="number-picker-legend">
        <span><span className="dot available" /> Available</span>
        <span><span className="dot taken" /> Taken</span>
        <span><span className="dot selected" /> Yours</span>
      </div>
      <div className="number-grid" role="listbox" aria-label="Jersey numbers">
        {NUMBERS.map((num) => {
          const isTaken = takenNumbers.has(num) && num !== value
          const isSelected = value === num

          return (
            <button
              key={num}
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={disabled || isTaken}
              className={[
                'number-cell',
                isTaken && 'taken',
                isSelected && 'selected',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onChange(num)}
            >
              {num}
            </button>
          )
        })}
      </div>
      {value && (
        <p className="selected-number-label">
          Selected: <strong>#{value}</strong>
        </p>
      )}
    </div>
  )
}
