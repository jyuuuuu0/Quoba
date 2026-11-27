/** Words of the query worth highlighting: two characters or longer, regex-escaped. */
function terms(query: string): string[] {
  return query
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
}

/** Wraps query words in the text with a subtle mint mark. */
export function Highlight({ text, query }: { text: string; query: string }): React.JSX.Element {
  const words = terms(query)
  if (words.length === 0) return <>{text}</>
  const pattern = new RegExp(`(${words.join('|')})`, 'gi')
  const parts = text.split(pattern)
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="rounded-[3px] bg-mint-soft px-0.5 text-inherit">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  )
}
