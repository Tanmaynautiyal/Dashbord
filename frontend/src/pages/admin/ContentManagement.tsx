import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../../ui'
import { adminService } from '../../services/adminService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  RefreshCw, Plus, Pencil, Trash2, LayoutDashboard,
  Code, BookOpen, Calendar as CalendarIcon, X, CheckCircle2, AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function EditItemModal({
  title,
  fields,
  initialData,
  onClose,
  onSave,
  isPending,
}: {
  title: string
  fields: { name: string; label: string; type?: string }[]
  initialData?: any
  onClose: () => void
  onSave: (data: any) => void
  isPending: boolean
}) {
  const [form, setForm] = useState<any>(initialData || {})
  const [error, setError] = useState('')

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
        className="w-full max-w-lg"
      >
        <Card className="shadow-2xl border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setError('')
              onSave(form)
            }}
            className="p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {initialData ? (
                  <>
                    <Pencil className="w-5 h-5 text-primary" /> Edit {title}
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-primary" /> Add New {title}
                  </>
                )}
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

            <div className="space-y-3">
              {fields.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <label className="text-sm font-semibold">{f.label} *</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      value={form[f.name] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      rows={3}
                      required
                      placeholder={`Enter ${f.label.toLowerCase()}...`}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  ) : (
                    <Input
                      value={form[f.name] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      placeholder={`Enter ${f.label.toLowerCase()}...`}
                      required
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : initialData ? (
                  'Save Changes'
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  )
}

function GenericCrudTable({
  title,
  icon: Icon,
  dataKey,
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  fields,
}: any) {
  const queryClient = useQueryClient()
  const { data, isLoading, refetch } = useQuery({
    queryKey: [dataKey],
    queryFn: fetchFn,
  })

  const [form, setForm] = useState<any>({})
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const createMutation = useMutation({
    mutationFn: (payload: any) => createFn(payload),
    onSuccess: () => {
      setForm({})
      queryClient.invalidateQueries({ queryKey: [dataKey] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      showToast(`${title} item created successfully!`)
    },
    onError: (err: any) => alert(err?.response?.data?.detail ?? 'Failed to create item.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateFn(id, payload),
    onSuccess: () => {
      setEditingItem(null)
      queryClient.invalidateQueries({ queryKey: [dataKey] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      showToast(`${title} item updated successfully!`)
    },
    onError: (err: any) => alert(err?.response?.data?.detail ?? 'Failed to update item.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn(id),
    onSuccess: () => {
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: [dataKey] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      showToast(`${title} item deleted successfully!`)
    },
    onError: (err: any) => alert(err?.response?.data?.detail ?? 'Failed to delete item.'),
  })

  const items = data || []

  return (
    <Card className="space-y-4">
      {/* Toast banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="m-4 mb-0 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 px-4 py-3 rounded-lg text-sm font-medium"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <Icon className="w-5 h-5 text-primary" /> {title} ({items.length})
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Add Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate(form)
          }}
          className="bg-secondary/20 p-4 rounded-xl border border-border/60 space-y-3"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Quick Add {title}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            {fields.map((f: any) => (
              <div key={f.name} className="flex-1 w-full space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">{f.label}</label>
                <Input
                  placeholder={f.label}
                  value={form[f.name] || ''}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  className="h-9 text-sm"
                  required
                />
              </div>
            ))}
            <Button size="sm" type="submit" className="h-9 shrink-0" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Plus className="w-4 h-4 mr-1" />
              )}
              Add
            </Button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/20">
                {fields.map((f: any) => (
                  <th key={f.name} className="text-left p-3 font-semibold text-muted-foreground">
                    {f.label}
                  </th>
                ))}
                <th className="text-right p-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                  {fields.map((f: any) => (
                    <td key={f.name} className="p-3 truncate max-w-[280px]">
                      {item[f.name] || <span className="text-muted-foreground italic">—</span>}
                    </td>
                  ))}
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title={`Edit ${title}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title={`Delete ${title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={fields.length + 1} className="p-8 text-center text-muted-foreground">
                    No {title.toLowerCase()} found. Use the form above to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <EditItemModal
            title={title}
            fields={fields}
            initialData={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={(updatedData) =>
              updateMutation.mutate({ id: editingItem.id, payload: updatedData })
            }
            isPending={updateMutation.isPending}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <Card className="w-full max-w-sm p-6 space-y-4 shadow-2xl border-border">
              <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Delete {title}
              </h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this {title.toLowerCase()} item? This cannot be undone.
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
      </AnimatePresence>
    </Card>
  )
}

export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState('technologies')

  const tabs = [
    { id: 'technologies', label: 'Technologies', icon: Code },
    { id: 'categories', label: 'Categories', icon: LayoutDashboard },
    { id: 'topics', label: 'Learning Topics', icon: BookOpen },
    { id: 'daily', label: 'Daily Content', icon: CalendarIcon },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Content Management</h2>
          <p className="text-sm text-muted-foreground">Manage programming technologies, categories, and learning tracks</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-border/80 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 border-b-2 text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'technologies' && (
        <GenericCrudTable
          title="Technologies"
          icon={Code}
          dataKey="admin-tech"
          fetchFn={adminService.getTechnologies}
          createFn={adminService.createTechnology}
          updateFn={adminService.updateTechnology}
          deleteFn={adminService.deleteTechnology}
          fields={[
            { name: 'name', label: 'Name' },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'official_url', label: 'Official URL' },
          ]}
        />
      )}
      {activeTab === 'categories' && (
        <GenericCrudTable
          title="Categories"
          icon={LayoutDashboard}
          dataKey="admin-categories"
          fetchFn={adminService.getCategories}
          createFn={adminService.createCategory}
          updateFn={adminService.updateCategory}
          deleteFn={adminService.deleteCategory}
          fields={[
            { name: 'name', label: 'Name' },
            { name: 'slug', label: 'Slug' },
            { name: 'description', label: 'Description', type: 'textarea' },
          ]}
        />
      )}
      {activeTab === 'topics' && (
        <GenericCrudTable
          title="Learning Topics"
          icon={BookOpen}
          dataKey="admin-topics"
          fetchFn={adminService.getLearningTopics}
          createFn={adminService.createLearningTopic}
          updateFn={adminService.updateLearningTopic}
          deleteFn={adminService.deleteLearningTopic}
          fields={[
            { name: 'title', label: 'Title' },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'difficulty_level', label: 'Difficulty' },
          ]}
        />
      )}
      {activeTab === 'daily' && (
        <GenericCrudTable
          title="Daily Learning Content"
          icon={CalendarIcon}
          dataKey="admin-daily"
          fetchFn={adminService.getDailyLearning}
          createFn={adminService.createDailyLearning}
          updateFn={adminService.updateDailyLearning}
          deleteFn={adminService.deleteDailyLearning}
          fields={[
            { name: 'topic_id', label: 'Topic ID (UUID)' },
            { name: 'content_text', label: 'Content', type: 'textarea' },
            { name: 'publish_date', label: 'Publish Date (ISO)' },
          ]}
        />
      )}
    </div>
  )
}
