import React, { useState, useEffect } from 'react'
import { Card, Button, Input } from '../../ui'
import { toolsService, type AITool } from '../../services/toolsService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  RefreshCw, AlertTriangle, Plus, Pencil, Trash2,
  Search, X, ExternalLink, Star, Eye, CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORIES = [
  'AI Chatbot',
  'Coding Assistant',
  'Developer Tool',
  'Image Generation',
  'Video Generation',
  'AI Agent',
]

const PRICING = ['Free', 'Freemium', 'Paid']

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  official_url: '',
  category: 'AI Chatbot',
  pricing_type: 'Free',
  logo_url: '',
  is_featured: false,
  is_active: true,
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function ToolFormModal({
  tool,
  onClose,
  onSaved,
}: {
  tool?: AITool
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [form, setForm] = useState({
    name: tool?.name ?? EMPTY_FORM.name,
    slug: tool?.slug ?? EMPTY_FORM.slug,
    description: tool?.description ?? EMPTY_FORM.description,
    official_url: tool?.official_url ?? EMPTY_FORM.official_url,
    category: tool?.category ?? EMPTY_FORM.category,
    pricing_type: tool?.pricing_type ?? EMPTY_FORM.pricing_type,
    logo_url: tool?.logo_url ?? EMPTY_FORM.logo_url,
    is_featured: tool?.is_featured ?? EMPTY_FORM.is_featured,
    is_active: tool?.is_active ?? EMPTY_FORM.is_active,
  })
  const [error, setError] = useState('')

  // Auto-generate slug from name when creating new
  useEffect(() => {
    if (!tool && form.name) {
      setForm((f) => ({ ...f, slug: slugify(f.name) }))
    }
  }, [form.name, tool])

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }))

  const mutation = useMutation({
    mutationFn: async () => {
      let cleanUrl = form.official_url.trim()
      if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl
      }

      let cleanLogo = form.logo_url?.trim() || null
      if (cleanLogo && !cleanLogo.startsWith('http://') && !cleanLogo.startsWith('https://')) {
        cleanLogo = 'https://' + cleanLogo
      }

      const payload: any = {
        name: form.name.trim(),
        slug: (form.slug || slugify(form.name)).trim(),
        description: form.description.trim(),
        official_url: cleanUrl,
        category: form.category,
        pricing_type: form.pricing_type,
        logo_url: cleanLogo,
        is_featured: Boolean(form.is_featured),
        is_active: Boolean(form.is_active),
      }

      if (tool) {
        return await toolsService.update(tool.id, payload)
      } else {
        return await toolsService.create(payload)
      }
    },
    onSuccess: () => {
      onSaved(tool ? `Tool "${form.name}" updated successfully!` : `Tool "${form.name}" added successfully!`)
      onClose()
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => `${d.loc?.slice(-1)[0] || 'field'}: ${d.msg}`).join(' | '))
      } else {
        setError(detail ?? err?.message ?? 'Operation failed')
      }
    },
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="shadow-2xl border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setError('')
              mutation.mutate()
            }}
            className="p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {tool ? <><Pencil className="w-5 h-5 text-primary" /> Edit Tool</> : <><Plus className="w-5 h-5 text-primary" /> Add New AI Tool</>}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Tool Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Cursor AI"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Slug *</label>
                <Input
                  value={form.slug}
                  onChange={(e) => set('slug', slugify(e.target.value))}
                  placeholder="e.g. cursor-ai"
                  required
                />
                <p className="text-[11px] text-muted-foreground">Unique identifier used in URLs.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={3}
                placeholder="Describe what this AI tool does and how it helps developers..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Official Website URL *</label>
                <Input
                  value={form.official_url}
                  onChange={(e) => set('official_url', e.target.value)}
                  placeholder="https://cursor.sh"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Logo URL (optional)</label>
                <Input
                  value={form.logo_url ?? ''}
                  onChange={(e) => set('logo_url', e.target.value)}
                  placeholder="https://cursor.sh/logo.png"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Pricing Type *</label>
                <select
                  value={form.pricing_type}
                  onChange={(e) => set('pricing_type', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  {PRICING.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Accessible Toggle Switches */}
            <div className="flex gap-6 pt-2">
              <button
                type="button"
                onClick={() => set('is_featured', !form.is_featured)}
                className="flex items-center gap-3 group text-left cursor-pointer select-none"
              >
                <div
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.is_featured ? 'bg-amber-500' : 'bg-secondary'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      form.is_featured ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
                <div>
                  <span className="text-sm font-semibold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Featured
                  </span>
                  <p className="text-[11px] text-muted-foreground">Highlight on dashboard</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => set('is_active', !form.is_active)}
                className="flex items-center gap-3 group text-left cursor-pointer select-none"
              >
                <div
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.is_active ? 'bg-emerald-500' : 'bg-secondary'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      form.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
                <div>
                  <span className="text-sm font-semibold flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-emerald-500" /> Active
                  </span>
                  <p className="text-[11px] text-muted-foreground">Visible to users</p>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : tool ? (
                  <>
                    <Pencil className="w-4 h-4 mr-2" /> Update Tool
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" /> Add Tool
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default function AdminTools() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<AITool | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AITool | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-tools'],
    queryFn: () => toolsService.list({ page_size: 100 }),
    retry: 1,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => toolsService.remove(id),
    onSuccess: () => {
      const name = deleteTarget?.name || 'Tool'
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['admin-tools'] })
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      showToast(`Tool "${name}" deleted successfully!`)
    },
    onError: (err: any) => {
      alert(err?.response?.data?.detail ?? 'Failed to delete tool. Please try again.')
    },
  })

  const tools: AITool[] = data?.items ?? []

  const filtered = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleSaved = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: ['admin-tools'] })
    queryClient.invalidateQueries({ queryKey: ['tools'] })
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    showToast(msg)
  }

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 px-4 py-3 rounded-lg text-sm font-medium"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">AI Tool Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {tools.length} tools in catalog · {tools.filter((t) => t.is_featured).length} featured
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm w-64"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Tool
          </Button>
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-600">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Could not load tools. Check your connection.
          <button onClick={() => refetch()} className="ml-auto underline font-medium">
            Retry
          </button>
        </div>
      )}

      <Card>
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-secondary/30 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/20">
                  <th className="text-left p-4 font-semibold text-muted-foreground">Tool</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Category</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Pricing</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Featured</th>
                  <th className="text-right p-4 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((tool) => (
                  <motion.tr key={tool.id} layout className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {tool.logo_url ? (
                            <img
                              src={tool.logo_url}
                              alt=""
                              className="w-7 h-7 object-contain"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            tool.name
                              .split(' ')
                              .map((w) => w[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{tool.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{tool.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">{tool.category}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          tool.pricing_type === 'Free'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : tool.pricing_type === 'Freemium'
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-orange-500/10 text-orange-600'
                        }`}
                      >
                        {tool.pricing_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          tool.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        {tool.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      {tool.is_featured ? (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                          <Star className="w-3.5 h-3.5 fill-amber-500" /> Featured
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={tool.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Visit tool"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setEditing(tool)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit tool"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tool)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete tool"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      {search ? `No tools matching "${search}"` : 'No tools yet. Click "Add Tool" to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <Card className="w-full max-w-sm p-6 space-y-4 shadow-2xl border-border">
              <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Delete Tool
              </h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(deleteTarget.id)}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Create / Edit Modals */}
        {creating && <ToolFormModal onClose={() => setCreating(false)} onSaved={handleSaved} />}
        {editing && <ToolFormModal tool={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
      </AnimatePresence>
    </div>
  )
}
