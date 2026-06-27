'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreVertical, Pencil, Trash2, Loader2, User, Phone, Mail } from 'lucide-react'

type Tenant = { id: string; name: string }
type User = {
  id: string
  email: string | null
  phone: string | null
  name: string
  role: string
  tenantId: string | null
  tenant?: { name: string } | null
  createdAt: string
}

const ROLES = ['SUPER_ADMIN', 'CLIENT_ADMIN']

export function UsersTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  const usersQ = useQuery<{ users: User[] }>({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await fetch('/api/users')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })
  const tenantsQ = useQuery<{ tenants: Tenant[] }>({
    queryKey: ['tenants'],
    queryFn: async () => {
      const r = await fetch('/api/tenants')
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
  })

  const users = usersQ.data?.users ?? []
  const tenants = tenantsQ.data?.tenants ?? []

  const filtered = users.filter((u) => {
    const matchesSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed')
      return j
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User created')
      setCreateOpen(false)
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create user'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const r = await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed')
      return j
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated')
      setEditUser(null)
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update user'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted')
      setDeleteUser(null)
    },
    onError: () => toast.error('Failed to delete user'),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="text-sm text-muted-foreground">Manage system users and their access</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {usersQ.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No users found
            </CardContent>
          </Card>
        ) : (
          filtered.map((user) => (
            <Card key={user.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {user.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            <span>{user.email}</span>
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.role === 'SUPER_ADMIN' ? 'destructive' : 'default'}>
                      {user.role}
                    </Badge>
                    {user.tenant && (
                      <Badge variant="outline">{user.tenant.name}</Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditUser(user)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteUser(user)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <UserFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        tenants={tenants}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      {/* Edit Dialog */}
      {editUser && (
        <UserFormDialog
          open={!!editUser}
          onOpenChange={(open) => !open && setEditUser(null)}
          user={editUser}
          tenants={tenants}
          onSubmit={(data) => updateMutation.mutate({ id: editUser.id, data })}
          loading={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteUser?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function UserFormDialog({
  open,
  onOpenChange,
  user,
  tenants,
  onSubmit,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User
  tenants: Tenant[]
  onSubmit: (data: any) => void
  loading: boolean
}) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(user?.role ?? 'CLIENT_ADMIN')
  const [tenantId, setTenantId] = useState<string>(user?.tenantId ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation: must have either email or phone
    if (!email && !phone) {
      toast.error('Please provide either email or phone number')
      return
    }

    const data: any = {
      name,
      email: email || null,
      phone: phone || null,
      role,
      tenantId: role === 'CLIENT_ADMIN' ? tenantId : null,
    }

    // Only include password if creating new user or if password field is filled
    if (!user || password) {
      if (!password) {
        toast.error('Password is required')
        return
      }
      data.password = password
    }

    onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Create User'}</DialogTitle>
          <DialogDescription>
            {user ? 'Update user information' : 'Add a new user to the system'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="15551234567"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              E.164 format without + (e.g., 15551234567)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password {user ? '(leave empty to keep current)' : '*'}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!user}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {role === 'CLIENT_ADMIN' && (
            <div className="space-y-2">
              <Label htmlFor="tenant">Tenant *</Label>
              <Select value={tenantId} onValueChange={setTenantId} disabled={loading}>
                <SelectTrigger id="tenant">
                  <SelectValue placeholder="Select tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {user ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
