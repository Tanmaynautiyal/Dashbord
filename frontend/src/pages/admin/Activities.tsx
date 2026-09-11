import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../ui'
import { adminService } from '../../services/adminService'

export default function AdminActivities() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-activities-page'],
    queryFn: () => adminService.getActivities(100),
    retry: 1,
  })

  const activities = data?.activities ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Activity Monitoring</h2>
          <p className="text-sm text-muted-foreground">Track login events, tool usage, bookmarks, and learning history.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {isError && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-600">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Backend not connected — activity data is unavailable.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent platform activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-left">Action</th>
                  <th className="p-3 text-left">Resource</th>
                  <th className="p-3 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity: any) => (
                  <tr key={activity.id} className="border-b border-border/30">
                    <td className="p-3">{activity.user_name || 'System'}</td>
                    <td className="p-3 capitalize">{activity.action?.replace(/_/g, ' ')}</td>
                    <td className="p-3 text-muted-foreground">{activity.resource_type || 'N/A'}</td>
                    <td className="p-3 text-muted-foreground">{new Date(activity.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">No activity found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
