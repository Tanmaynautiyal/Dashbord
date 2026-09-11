import React, { useState } from 'react'
import { Card, Button, Input } from '../../ui'
import { adminService, type UserDetail } from '../../services/adminService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  RefreshCw, AlertTriangle, Mail, Calendar, Shield, Search,
  CheckCircle2, XCircle, Plus, Pencil, Trash2, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function UserFormModal({
  user,
  onClose,
  onSaved,
}: {
  user?: UserDetail
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(user?.role ?? 'user')
  const [isActive, setIsActive] = useState(user?.is_active ?? true)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (user) {
        const payload: any = {
          name: name.trim(),
          email: email.trim(),
          role,
          is_active: isActive,
        }
        if (password.trim()) payload.password = password.trim()
        return await adminService.updateUser(user.id, payload)
      } else {
        return await adminService.createUser({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
          is_active: isActive,
        })
      }
    },
    onSuccess: () => {
      onSaved(user ? `User "${name}" updated successfully!` : `User "${name}" created successfully!`)
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
        className="w-full max-w-md"
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
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {user ? <><Pencil className="w-5 h-5 text-primary" /> Edit User</> : <><Plus className="w-5 h-5 text-primary" /> Add New User</>}
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

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Full Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Email Address *</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">
                {user ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={user ? '••••••••' : 'Minimum 6 characters'}
                required={!user}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Status</label>
                <select
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(e) => setIsActive(e.target.value === 'active')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : user ? (
                  'Update User'
                ) : (
                  'Create User'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null)
  const [creatingUser, setCreatingUser] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserDetail | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminService.getUsers,
    retry: 1,
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      adminService.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      showToast('User role updated successfully!')
    },
    onError: (err: any) => alert(err?.response?.data?.detail ?? 'Failed to update role.'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminService.updateUserStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      showToast('User status updated successfully!')
    },
    onError: (err: any) => alert(err?.response?.data?.detail ?? 'Failed to update status.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      const name = deleteTarget?.name || 'User'
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      showToast(`User "${name}" deleted successfully!`)
    },
    onError: (err: any) => alert(err?.response?.data?.detail ?? 'Failed to delete user.'),
  })

  const users = (data?.users || []).filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleSaved = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    showToast(msg)
  }

  return (
    <div className="space-y-6">
      {/* Toast banner */}
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">User Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.total ?? 0} total users registered · Edit roles, status, or credentials
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm w-56"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => setCreatingUser(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add User
          </Button>
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-600">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Could not load users.
          <button onClick={() => refetch()} className="ml-auto underline font-medium">
            Retry
          </button>
        </div>
      )}

      <Card>
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-secondary/30 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/20">
                  <th className="text-left p-4 font-semibold text-muted-foreground">User</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Email</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Role</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Joined</th>
                  <th className="text-right p-4 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {users.map((user) => (
                  <motion.tr key={user.id} layout className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {user.name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="font-semibold">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[200px]">{user.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <select
                          className="bg-background border border-input rounded-md text-xs px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer capitalize"
                          value={user.role}
                          onChange={(e) => roleMutation.mutate({ id: user.id, role: e.target.value })}
                          disabled={roleMutation.isPending}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => statusMutation.mutate({ id: user.id, is_active: !user.is_active })}
                        disabled={statusMutation.isPending}
                        title={`Click to ${user.is_active ? 'deactivate' : 'activate'}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          user.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit user details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      {search ? `No users matching "${search}"` : 'No users found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete User Confirmation Modal */}
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
                <Trash2 className="w-5 h-5" /> Delete User
              </h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete user <strong>{deleteTarget.name}</strong> ({deleteTarget.email})?
                This action cannot be undone.
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
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Create / Edit Modals */}
        {creatingUser && <UserFormModal onClose={() => setCreatingUser(false)} onSaved={handleSaved} />}
        {editingUser && (
          <UserFormModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={handleSaved} />
        )}
      </AnimatePresence>
    </div>
  )
}
