import React, { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../../ui'
import { scraperService, type ScrapedTool } from '../../services/scraperService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, AlertTriangle, Download, ExternalLink, Image as ImageIcon, Sparkles, BookOpenText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function ToolCard({ tool, onImport, canImport }: { tool: ScrapedTool; onImport?: () => void; canImport?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-start gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-md transition-all bg-card/50">
      <div className="w-16 h-16 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 overflow-hidden">
        {tool.image_url ? <img src={tool.image_url} alt={tool.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-sm truncate">{tool.name}</h4>
          {tool.pricing && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground capitalize shrink-0">
              {tool.pricing}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{tool.description}</p>
        <div className="flex items-center gap-2">
          {canImport && onImport && (
            <Button size="sm" variant="secondary" onClick={onImport} className="h-7 text-xs">
              <Download className="w-3 h-3 mr-1" /> Import
            </Button>
          )}
          {tool.url && tool.url !== '#' && (
            <a href={tool.url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost" className="h-7 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" /> View
              </Button>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function AdminScraper() {
  const queryClient = useQueryClient()
  const [limit, setLimit] = useState(20)
  const [importing, setImporting] = useState<string | null>(null)
  const [source, setSource] = useState<'futuretools' | 'aixploria' | 'w3schools'>('aixploria')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['scrape-source', source, limit],
    queryFn: async () => {
      if (source === 'aixploria') return scraperService.getAixploriaTools(limit)
      if (source === 'w3schools') return scraperService.getW3SchoolsLanguages(limit)
      return scraperService.getTools(limit)
    },
    retry: 1,
  })

  const importMutation = useMutation({
    mutationFn: () => scraperService.importTools(limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const tools: ScrapedTool[] = data?.items || []
  const sourceTitle = useMemo(() => {
    if (source === 'aixploria') return 'AIXploria Free AI Tools'
    if (source === 'w3schools') return 'W3Schools Programming Languages'
    return 'FutureTools AI Catalog'
  }, [source])

  const canImport = source === 'futuretools'

  const handleImportAll = async () => {
    setImporting('all')
    try {
      await importMutation.mutateAsync()
    } finally {
      setImporting(null)
    }
  }

  const handleImportOne = async (tool: ScrapedTool) => {
    setImporting(tool.slug)
    try {
      await importMutation.mutateAsync()
    } finally {
      setImporting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Live Source Scraper</h2>
          <p className="text-sm text-muted-foreground">Real data from AIXploria, W3Schools, and FutureTools</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-background p-1">
            <button onClick={() => setSource('aixploria')} className={`rounded-md px-3 py-2 text-sm ${source === 'aixploria' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              <Sparkles className="w-4 h-4 inline mr-1" /> AI Tools
            </button>
            <button onClick={() => setSource('w3schools')} className={`rounded-md px-3 py-2 text-sm ${source === 'w3schools' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              <BookOpenText className="w-4 h-4 inline mr-1" /> Languages
            </button>
            <button onClick={() => setSource('futuretools')} className={`rounded-md px-3 py-2 text-sm ${source === 'futuretools' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              FutureTools
            </button>
          </div>
          <Input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-20 h-9 text-sm"
          />
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {canImport && (
            <Button size="sm" onClick={handleImportAll} disabled={isLoading || importMutation.isPending || tools.length === 0}>
              {importMutation.isPending && importing === 'all' ? 'Importing...' : 'Import All'}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-4">
        <h3 className="text-lg font-semibold">{sourceTitle}</h3>
        <p className="text-sm text-muted-foreground">Showing fresh data from the selected source.</p>
      </div>

      {isError && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-600">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Failed to load data from the selected source. Check your internet connection.
        </div>
      )}

      {importMutation.isError && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {importMutation.error instanceof Error ? importMutation.error.message : 'Import failed'}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse bg-secondary/30 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {tools.map((tool) => (
              <ToolCard
                key={tool.slug}
                tool={tool}
                onImport={canImport ? () => handleImportOne(tool) : undefined}
                canImport={canImport}
              />
            ))}
          </AnimatePresence>
          {tools.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No results found for this source. Try changing the source or the limit.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
