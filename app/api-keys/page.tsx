"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Key, Plus, Eye, EyeOff, Trash2, Edit, TestTube, Copy, CheckCircle2, XCircle, Activity, Clock, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

export default function ApiKeysPage() {
  const { toast } = useToast()
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewKey, setShowNewKey] = useState(false)
  const [newKeyDialog, setNewKeyDialog] = useState(false)
  const [newKey, setNewKey] = useState<any>(null)
  const [testKey, setTestKey] = useState<string>('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<number | null>(null)
  const [apiSettings, setApiSettings] = useState({
    baseUrl: 'https://api.gtvmotor.dev/api/v1',
    apiKey: ''
  })

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    permissions: ['read'] as string[],
    rate_limit: 1000,
    notes: ''
  })

  useEffect(() => {
    const initialize = async () => {
      await loadApiSettings()
      await loadApiKeys()
    }
    initialize()
  }, [])

  const loadApiSettings = async () => {
    try {
      const response = await fetch('/api/settings?type=api')
      const data = await response.json()
      if (data.success && data.data) {
        setApiSettings({
          baseUrl: data.data.baseUrl || 'https://api.gtvmotor.dev/api/v1',
          apiKey: data.data.apiKey || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6'
        })
      } else {
        // Use defaults if settings not found
        setApiSettings({
          baseUrl: 'https://api.gtvmotor.dev/api/v1',
          apiKey: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6'
        })
      }
    } catch (error) {
      console.error('Failed to load API settings:', error)
      // Use defaults on error
      setApiSettings({
        baseUrl: 'https://api.gtvmotor.dev/api/v1',
        apiKey: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6'
      })
    }
  }

  const loadApiKeys = async () => {
    try {
      setLoading(true)
      const apiKey = apiSettings.apiKey || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6'
      const baseUrl = apiSettings.baseUrl || 'https://api.gtvmotor.dev/api/v1'

      const response = await fetch(`${baseUrl}/api-keys`, {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setApiKeys(data.data || [])
      } else {
        throw new Error(data.error || data.message || 'Failed to load API keys')
      }
    } catch (error: any) {
      console.error('Failed to load API keys:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load API keys. Make sure you're using an API key with admin permissions.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the API key",
        variant: "destructive"
      })
      return
    }

    try {
      setCreating(true)
      const apiKey = apiSettings.apiKey || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6'
      const baseUrl = apiSettings.baseUrl || 'https://api.gtvmotor.dev/api/v1'

      const response = await fetch(`${baseUrl}/api-keys`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setNewKey(data.data)
        setNewKeyDialog(true)
        setDialogOpen(false) // Close create dialog
        setFormData({ name: '', permissions: ['read'], rate_limit: 1000, notes: '' })
        await loadApiKeys()
        toast({
          title: "Success",
          description: "API key created successfully"
        })
      } else {
        throw new Error(data.error || data.message || 'Failed to create API key')
      }
    } catch (error: any) {
      console.error('Create API key error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create API key. Make sure you're using an API key with admin permissions.",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const testApiKey = async () => {
    if (!testKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key to test",
        variant: "destructive"
      })
      return
    }

    try {
      setTesting(true)
      setTestResult(null) // Clear previous result
      const baseUrl = apiSettings.baseUrl || 'https://api.gtvmotor.dev/api/v1'

      const response = await fetch(`${baseUrl}/test-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ api_key: testKey.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setTestResult(data.data)

        // Show toast based on result
        if (data.data.valid) {
          if (data.data.active) {
            toast({
              title: "Success",
              description: `API key is valid and active (${data.data.source})`
            })
          } else {
            toast({
              title: "Warning",
              description: "API key is valid but inactive",
              variant: "destructive"
            })
          }
        } else {
          toast({
            title: "Invalid API Key",
            description: data.data.error_message || "API key not found",
            variant: "destructive"
          })
        }
      } else {
        throw new Error(data.error || data.message || 'Failed to test API key')
      }
    } catch (error: any) {
      console.error('Test API key error:', error)
      setTestResult({
        valid: false,
        error_message: error.message || "Failed to test API key"
      })
      toast({
        title: "Error",
        description: error.message || "Failed to test API key",
        variant: "destructive"
      })
    } finally {
      setTesting(false)
    }
  }

  const toggleKeyStatus = async (keyId: number, newStatus: boolean) => {
    try {
      const apiKey = apiSettings.apiKey || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6'
      const baseUrl = apiSettings.baseUrl || 'https://api.gtvmotor.dev/api/v1'

      // Optimistically update UI
      setApiKeys(prevKeys =>
        prevKeys.map(key =>
          key.id === keyId ? { ...key, active: newStatus } : key
        )
      )

      const response = await fetch(`${baseUrl}/api-keys?id=${keyId}`, {
        method: 'PATCH',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: newStatus })
      })

      if (!response.ok) {
        // Revert on error
        await loadApiKeys()
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Refresh to get latest data
        await loadApiKeys()
        toast({
          title: "Success",
          description: `API key ${newStatus ? 'activated' : 'deactivated'}`
        })
      } else {
        // Revert on error
        await loadApiKeys()
        throw new Error(data.error || data.message || 'Failed to update API key')
      }
    } catch (error: any) {
      console.error('Toggle key status error:', error)
      // Revert on error
      await loadApiKeys()
      toast({
        title: "Error",
        description: error.message || "Failed to update API key",
        variant: "destructive"
      })
    }
  }

  const handleDeleteClick = (keyId: number) => {
    setKeyToDelete(keyId)
    setDeleteDialogOpen(true)
  }

  const deleteApiKey = async () => {
    if (!keyToDelete) return

    try {
      const apiKey = apiSettings.apiKey || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6'
      const baseUrl = apiSettings.baseUrl || 'https://api.gtvmotor.dev/api/v1'

      const response = await fetch(`${baseUrl}/api-keys?id=${keyToDelete}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setDeleteDialogOpen(false)
        setKeyToDelete(null)
        await loadApiKeys()
        toast({
          title: "Success",
          description: "API key deleted successfully"
        })
      } else {
        throw new Error(data.error || data.message || 'Failed to delete API key')
      }
    } catch (error: any) {
      console.error('Delete API key error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete API key",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "API key copied to clipboard"
    })
  }

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone.
              Any applications using this key will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setKeyToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteApiKey} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Key Management</h1>
          <p className="text-gray-500">Create, manage, and test API keys for external integrations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for external application integration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Key Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mobile App, Web Dashboard, Partner API"
                />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="space-y-2 mt-2">
                  {['read', 'write', 'admin'].map((perm) => (
                    <div key={perm} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.permissions.includes(perm)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, permissions: [...formData.permissions, perm] })
                          } else {
                            setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm) })
                          }
                        }}
                      />
                      <Label className="font-normal capitalize">{perm}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Rate Limit (requests per hour)</Label>
                <Input
                  type="number"
                  value={formData.rate_limit}
                  onChange={(e) => setFormData({ ...formData, rate_limit: parseInt(e.target.value) || 1000 })}
                />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional information about this API key"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormData({ name: '', permissions: ['read'], rate_limit: 1000, notes: '' })}>
                Cancel
              </Button>
              <Button onClick={createApiKey} disabled={!formData.name.trim() || creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create API Key
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* New Key Dialog */}
      <Dialog open={newKeyDialog} onOpenChange={setNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created Successfully</DialogTitle>
            <DialogDescription>
              Save this API key immediately. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input value={newKey?.api_key || ''} readOnly className="font-mono" />
                <Button size="icon" variant="outline" onClick={() => copyToClipboard(newKey?.api_key || '')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Important:</strong> Copy and save this API key now. You will not be able to see it again.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewKeyDialog(false)}>I've Saved It</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test API Key Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TestTube className="mr-2 h-5 w-5" />
            Test API Key
          </CardTitle>
          <CardDescription>Test an API key to verify it works correctly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                placeholder="Enter the actual API key (64 characters) - shown only when created"
                type={showNewKey ? "text" : "password"}
                className="flex-1"
              />
              <Button onClick={() => setShowNewKey(!showNewKey)} variant="outline" size="icon">
                {showNewKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button onClick={testApiKey} disabled={testing || !testKey.trim()}>
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Key'
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ⚠️ Enter the actual API key (64-character hex string), not the hash. The key is only shown once when created.
            </p>
          </div>

          {testResult && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                {testResult.valid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-semibold">
                  {testResult.valid ? 'Valid API Key' : 'Invalid API Key'}
                </span>
              </div>

              {testResult.error_message && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg space-y-2">
                  <p className="text-sm text-red-800 dark:text-red-200 font-semibold">
                    {testResult.error_message}
                  </p>
                  {testResult.debug_info && (
                    <div className="text-xs text-red-600 dark:text-red-300 mt-2">
                      <p>Key Length: {testResult.debug_info.key_length} characters</p>
                      <p>Key Preview: {testResult.debug_info.key_preview}</p>
                      {testResult.debug_info.keys_in_database !== undefined && (
                        <p>Keys in Database: {testResult.debug_info.keys_in_database}</p>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-red-600 dark:text-red-300 mt-2">
                    Make sure you copied the complete API key (64 characters) when it was created.
                  </p>
                </div>
              )}

              {testResult.valid && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Badge variant={testResult.active ? "default" : "secondary"}>
                      {testResult.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <Label>Source</Label>
                    <Badge variant="outline">{testResult.source}</Badge>
                  </div>
                  <div>
                    <Label>Permissions</Label>
                    <div className="flex gap-1 mt-1">
                      {testResult.permissions.map((p: string) => (
                        <Badge key={p} variant="outline" className="capitalize">{p}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Rate Limit</Label>
                    <p>{testResult.rate_limit} requests/hour</p>
                  </div>
                </div>
              )}

              {testResult.test_endpoints && testResult.test_endpoints.length > 0 && (
                <div>
                  <Label>Endpoint Tests</Label>
                  <div className="space-y-2 mt-2">
                    {testResult.test_endpoints.map((endpoint: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{endpoint.name}</span>
                        {endpoint.test_result?.success ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {endpoint.test_result.http_code} ({endpoint.test_result.response_time_ms}ms)
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testResult.traffic_stats && (
                <div>
                  <Label>Traffic Statistics</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <p className="text-sm text-gray-500">Total Requests</p>
                      <p className="text-2xl font-bold">{testResult.traffic_stats.total_requests || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Success Rate</p>
                      <p className="text-2xl font-bold">
                        {testResult.traffic_stats.total_requests
                          ? Math.round((testResult.traffic_stats.total_success / testResult.traffic_stats.total_requests) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Avg Response Time</p>
                      <p className="text-2xl font-bold">
                        {testResult.traffic_stats.avg_response_time
                          ? Math.round(testResult.traffic_stats.avg_response_time)
                          : 0}ms
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage your API keys for external integrations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : apiKeys.length === 0 ? (
            <p className="text-gray-500">No API keys found. Create your first API key to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.key_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {key.permissions.map((p: string) => (
                          <Badge key={p} variant="outline" className="capitalize">{p}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{key.rate_limit}/hour</TableCell>
                    <TableCell>
                      <Switch
                        checked={!!key.active}
                        onCheckedChange={(checked) => toggleKeyStatus(key.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      {key.usage_stats?.total_requests || 0} requests
                    </TableCell>
                    <TableCell>
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            toast({
                              title: "Info",
                              description: "To test an API key, enter the actual key (64 characters) in the Test API Key section above. The hash cannot be used for testing.",
                              variant: "default"
                            })
                          }}
                          title="Enter the actual API key (not the hash) in the Test section above"
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteClick(key.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  )
}

