import React, { useMemo, useState } from 'react'
import { Search as SearchIcon, Clock3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui'

const items = [
  { title: 'ChatGPT', type: 'AI Tool', description: 'General-purpose AI assistant for coding, writing, and workflow automation.' },
  { title: 'GitHub Copilot', type: 'AI Tool', description: 'AI pair programmer for intelligent code completions inside VS Code and JetBrains.' },
  { title: 'Cursor', type: 'AI Tool', description: 'AI-first code editor built for deep context awareness and multi-file editing.' },
  { title: 'Python', type: 'Technology', description: 'Core language used for automation, tooling, and AI experimentation.' },
  { title: 'Docker', type: 'Technology', description: 'Containerization platform to package and run distributed applications consistently.' },
  { title: 'FastAPI', type: 'Technology', description: 'Modern, high-performance web framework for building Python REST APIs.' },
  { title: 'RAG Foundations', type: 'Article', description: 'A guide to retrieval augmented generation and vector search.' },
  { title: 'AI Learning Roadmap', type: 'Learning Topic', description: 'A structured learning plan for AI builders and engineers.' },
]

export default function AdminSearch() {
  const [query, setQuery] = useState('')

  const suggestions = ['ChatGPT', 'Python', 'Docker', 'AI Tool', 'RAG']

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim()
    if (!term) return items
    return items.filter((item) => {
      return (
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term)
      )
    })
  }, [query])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">Global Search</h2>
        <p className="text-sm text-muted-foreground">Search AI tools, technologies, articles, and learning topics.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search AI tools, technologies, topics..."
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold">Suggested:</span>
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuery(item)}
                className="rounded-full bg-secondary hover:bg-primary/10 hover:text-primary px-3 py-1 text-xs transition-colors cursor-pointer"
              >
                {item}
              </button>
            ))}
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs text-primary underline ml-2"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filtered.map((item) => (
              <div key={item.title} className="rounded-xl border border-border/50 p-4 hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    Match
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No results found for "{query}".
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
