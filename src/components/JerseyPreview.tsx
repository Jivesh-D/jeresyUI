interface JerseyPreviewProps {
  jerseyNumber: string
  name: string
  tagLine: string
}

export function JerseyPreview({ jerseyNumber, name, tagLine }: JerseyPreviewProps) {
  const displayNumber = jerseyNumber.trim() || '00'
  const displayName = name.trim().toUpperCase() || 'PLAYER NAME'
  const displayTag = tagLine.trim() || 'tag line'

  return (
    <div className="jersey-preview" aria-label="Jersey preview">
      <div className="jersey-back">
        <span className="jersey-number">{displayNumber}</span>
        <span className="jersey-name">{displayName}</span>
        <span className="jersey-tag">{displayTag}</span>
      </div>
    </div>
  )
}
