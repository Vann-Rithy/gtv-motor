"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  Activity,
  AlertTriangle,
  Clock,
  Users,
  Key,
  Globe,
  RefreshCw,
  Download,
  Calendar
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useToast } from "@/hooks/use-toast"

interface AnalyticsData {
  overview?: {
    total_requests: number
    successful_requests: number
    failed_requests: number
    avg_response_time_ms: number
    min_response_time_ms: number
    max_response_time_ms: number
    unique_ips: number
    unique_api_keys: number
    unique_endpoints: number
  }
  by_day?: Array<{
    date: string
    requests: number
    successful: number
    failed: number
    avg_response_time: number
    min_response_time?: number
    max_response_time?: number
    unique_ips?: number
    unique_keys?: number
  }>
}

interface EndpointStats {
  endpoint: string
  method: string
  total_requests: number
  successful_requests: number
  failed_requests: number
  avg_response_time_ms: number
  min_response_time_ms: number
  max_response_time_ms: number
  unique_ips: number
  error_rate_percent: number
}

interface ApiKeyStats {
  api_key_id: string
  total_requests: number
  successful_requests: number
  failed_requests: number
  avg_response_time_ms: number
  endpoints_used: number
  unique_ips: number
  first_request: string
  last_request: string
  key_active?: boolean
  rate_limit?: number
}

interface ErrorStats {
  status_code: number
  endpoint: string
  method: string
  error_message: string
  error_count: number
  affected_ips: number
  last_occurrence: string
}

export default function ApiAnalyticsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)
  const [analyticsType, setAnalyticsType] = useState('overview')
  const [breakdownPeriod, setBreakdownPeriod] = useState<'day' | 'month' | 'year'>('day')

  // Overview data
  const [overviewData, setOverviewData] = useState<AnalyticsData | null>(null)
  const [endpointsData, setEndpointsData] = useState<EndpointStats[]>([])
  const [keysData, setKeysData] = useState<ApiKeyStats[]>([])
  const [errorsData, setErrorsData] = useState<ErrorStats[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [trafficData, setTrafficData] = useState<any[]>([])

  // Get API settings
  const [apiSettings, setApiSettings] = useState({
    baseUrl: 'https://api.gtvmotor.dev/api/v1', // Default to API v1
    apiKey: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6' // Default API key from config
  })

  useEffect(() => {
    // Load API settings
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings?type=api')
        const data = await response.json()
        if (data.success && data.data) {
          setApiSettings({
            baseUrl: data.data.baseUrl || 'https://api.gtvmotor.dev/api/v1',
            // Use saved API key if available, otherwise use default
            apiKey: data.data.apiKey || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6'
          })
        } else {
          console.warn('Settings API returned unsuccessful response:', data)
          // Keep default API key if settings load fails
        }
      } catch (error) {
        console.error('Failed to load API settings:', error)
        // Keep default API key if fetch fails
      }
    }
    loadSettings()
  }, [])

  const fetchAnalytics = async (type: string, daysParam: number = days, breakdown: string = breakdownPeriod) => {
    // Use default API key if none is set
    const apiKey = apiSettings.apiKey || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6'

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your API key in Settings first",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const url = `/analytics?type=${type}&days=${daysParam}&breakdown=${breakdown}`

      // Use enhanced API client with timeout, retry, and caching
      const { apiClientWithSettings } = await import('@/lib/api-client-with-settings')

      // Refresh settings to get latest timeout/retry/cache settings
      await apiClientWithSettings.refreshSettings()

      const data = await apiClientWithSettings.request(url, {
        method: 'GET',
        useCache: true // Use cache if enabled in settings
      })

      if (data.success) {
        switch (type) {
          case 'overview':
            setOverviewData(data.data)
            break
          case 'endpoints':
            setEndpointsData(data.data || [])
            break
          case 'keys':
            setKeysData(data.data || [])
            break
          case 'errors':
            setErrorsData(data.data || [])
            break
          case 'performance':
            setPerformanceData(data.data || [])
            break
          case 'traffic':
            setTrafficData(data.data || [])
            break
        }
      } else {
        throw new Error(data.error || 'Failed to fetch analytics')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load analytics data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Always try to fetch analytics (will use default key if needed)
    // Small delay to ensure settings are loaded first
    const timer = setTimeout(() => {
      fetchAnalytics(analyticsType, days, breakdownPeriod)
    }, 100)

    return () => clearTimeout(timer)
  }, [analyticsType, days, breakdownPeriod, apiSettings.apiKey, apiSettings.baseUrl])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
            API Analytics Dashboard
          </h1>
        </div>
        <div className="flex gap-3">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24h</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => fetchAnalytics(analyticsType, days)} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {!apiSettings.apiKey && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  API Key Required
                </p>
                <p className="text-sm">
                  Please configure your API key in <strong>Settings → API Configuration</strong> to view analytics.
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Using default API key. To use a custom key, save it in Settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={analyticsType} onValueChange={setAnalyticsType}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : overviewData?.overview ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatNumber(overviewData.overview.total_requests)}</div>
                  <p className="text-xs text-gray-500 mt-1">Last {days} days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Success Rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {overviewData.overview.total_requests > 0
                      ? ((overviewData.overview.successful_requests / overviewData.overview.total_requests) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatNumber(overviewData.overview.successful_requests)} successful
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Avg Response Time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatTime(overviewData.overview.avg_response_time_ms)}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Min: {formatTime(overviewData.overview.min_response_time_ms)} |
                    Max: {formatTime(overviewData.overview.max_response_time_ms)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Unique IPs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatNumber(overviewData.overview.unique_ips)}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatNumber(overviewData.overview.unique_api_keys)} API keys
                  </p>
                </CardContent>
              </Card>

              {/* Daily Breakdown with Line Chart */}
              {overviewData.by_day && overviewData.by_day.length > 0 && (
                <Card className="md:col-span-2 lg:col-span-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Daily Breakdown</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant={breakdownPeriod === 'day' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setBreakdownPeriod('day')
                            fetchAnalytics('overview', days, 'day')
                          }}
                        >
                          Day
                        </Button>
                        <Button
                          variant={breakdownPeriod === 'month' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setBreakdownPeriod('month')
                            fetchAnalytics('overview', days, 'month')
                          }}
                        >
                          Month
                        </Button>
                        <Button
                          variant={breakdownPeriod === 'year' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setBreakdownPeriod('year')
                            fetchAnalytics('overview', days, 'year')
                          }}
                        >
                          Year
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Line Chart */}
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={overviewData.by_day.map(day => {
                              let dateLabel = '';
                              if (breakdownPeriod === 'day') {
                                dateLabel = new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              } else if (breakdownPeriod === 'month') {
                                // day.date is in format 'YYYY-MM'
                                const [year, month] = day.date.split('-');
                                dateLabel = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                              } else {
                                // day.date is just the year
                                dateLabel = day.date;
                              }
                              return {
                                date: dateLabel,
                                requests: day.requests,
                                successful: day.successful,
                                failed: day.failed,
                                avgResponseTime: day.avg_response_time
                              };
                            })}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip
                              formatter={(value: any, name: string) => {
                                if (name === 'avgResponseTime') {
                                  return formatTime(value)
                                }
                                return formatNumber(value)
                              }}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Legend />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="requests"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              name="Total Requests"
                              dot={{ r: 4 }}
                            />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="successful"
                              stroke="#10b981"
                              strokeWidth={2}
                              name="Successful"
                              dot={{ r: 4 }}
                            />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="failed"
                              stroke="#ef4444"
                              strokeWidth={2}
                              name="Failed"
                              dot={{ r: 4 }}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="avgResponseTime"
                              stroke="#f59e0b"
                              strokeWidth={2}
                              name="Avg Response (ms)"
                              dot={{ r: 4 }}
                              strokeDasharray="5 5"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Summary Table */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th className="px-4 py-2 text-left">Date</th>
                                <th className="px-4 py-2 text-right">Requests</th>
                                <th className="px-4 py-2 text-right">Successful</th>
                                <th className="px-4 py-2 text-right">Failed</th>
                                <th className="px-4 py-2 text-right">Avg Response</th>
                                <th className="px-4 py-2 text-right">Unique IPs</th>
                              </tr>
                            </thead>
                            <tbody>
                              {overviewData.by_day.map((day, idx) => (
                                <tr key={idx} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <td className="px-4 py-2">
                                    {breakdownPeriod === 'day'
                                      ? new Date(day.date).toLocaleDateString()
                                      : breakdownPeriod === 'month'
                                      ? (() => {
                                          const [year, month] = day.date.split('-');
                                          return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                        })()
                                      : `${day.date}`
                                    }
                                  </td>
                                  <td className="px-4 py-2 text-right font-medium">
                                    {formatNumber(day.requests)}
                                  </td>
                                  <td className="px-4 py-2 text-right text-green-600">
                                    {formatNumber(day.successful)}
                                  </td>
                                  <td className="px-4 py-2 text-right text-red-600">
                                    {formatNumber(day.failed)}
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    {formatTime(day.avg_response_time)}
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    {day.unique_ips ? formatNumber(day.unique_ips) : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No analytics data available. Make some API requests first.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : endpointsData.length > 0 ? (
            <div className="space-y-4">
              {endpointsData.map((endpoint, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{endpoint.method}</Badge>
                          <span className="font-mono text-sm">{endpoint.endpoint}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500">Total Requests</p>
                            <p className="text-lg font-semibold">{formatNumber(endpoint.total_requests)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Success Rate</p>
                            <p className="text-lg font-semibold text-green-600">
                              {((endpoint.successful_requests / endpoint.total_requests) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Avg Response</p>
                            <p className="text-lg font-semibold">{formatTime(endpoint.avg_response_time_ms)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Error Rate</p>
                            <p className="text-lg font-semibold text-red-600">
                              {endpoint.error_rate_percent}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No endpoint data available.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="keys">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : keysData.length > 0 ? (
            <div className="space-y-4">
              {keysData.map((key, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Key className="h-4 w-4" />
                          <span className="font-medium">{key.api_key_id || 'Unknown Key'}</span>
                          {key.key_active !== undefined && (
                            <Badge variant={key.key_active ? "default" : "secondary"}>
                              {key.key_active ? 'Active' : 'Inactive'}
                            </Badge>
                          )}
                          {key.rate_limit && (
                            <Badge variant="outline">
                              {key.rate_limit}/hr
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500">Total Requests</p>
                            <p className="text-lg font-semibold">{formatNumber(key.total_requests)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Endpoints Used</p>
                            <p className="text-lg font-semibold">{key.endpoints_used}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Unique IPs</p>
                            <p className="text-lg font-semibold">{key.unique_ips}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Avg Response</p>
                            <p className="text-lg font-semibold">{formatTime(key.avg_response_time_ms)}</p>
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-gray-500">
                          First: {new Date(key.first_request).toLocaleString()} |
                          Last: {new Date(key.last_request).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No API key data available.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : errorsData.length > 0 ? (
            <div className="space-y-4">
              {errorsData.map((error, idx) => (
                <Card key={idx} className="border-red-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive">{error.status_code}</Badge>
                          <Badge variant="outline">{error.method}</Badge>
                          <span className="font-mono text-sm">{error.endpoint}</span>
                        </div>
                        {error.error_message && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {error.error_message}
                          </p>
                        )}
                        <div className="flex gap-4 text-sm">
                          <span className="text-gray-500">
                            Occurrences: <strong>{formatNumber(error.error_count)}</strong>
                          </span>
                          <span className="text-gray-500">
                            Affected IPs: <strong>{error.affected_ips}</strong>
                          </span>
                          <span className="text-gray-500">
                            Last: {new Date(error.last_occurrence).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No errors found. Great! 🎉
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : performanceData.length > 0 ? (
            <div className="space-y-4">
              {performanceData.map((perf, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{perf.hour}</span>
                          {perf.endpoint && (
                            <Badge variant="outline">{perf.endpoint}</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500">Requests</p>
                            <p className="text-lg font-semibold">{formatNumber(perf.requests)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Avg Response</p>
                            <p className="text-lg font-semibold">{formatTime(perf.avg_response_time_ms)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Min Response</p>
                            <p className="text-lg font-semibold">{formatTime(perf.min_response_time_ms)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Max Response</p>
                            <p className="text-lg font-semibold">{formatTime(perf.max_response_time_ms)}</p>
                          </div>
                        </div>
                        {perf.error_rate_percent > 0 && (
                          <div className="mt-2">
                            <Badge variant="destructive">
                              Error Rate: {perf.error_rate_percent}%
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No performance data available.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : trafficData.length > 0 ? (
            <div className="space-y-4">
              {trafficData.map((traffic, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4" />
                          <span className="font-medium">Hour {traffic.hour}:00</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500">Requests</p>
                            <p className="text-lg font-semibold">{formatNumber(traffic.requests)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Successful</p>
                            <p className="text-lg font-semibold text-green-600">
                              {formatNumber(traffic.successful)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Failed</p>
                            <p className="text-lg font-semibold text-red-600">
                              {formatNumber(traffic.failed)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Unique IPs</p>
                            <p className="text-lg font-semibold">{formatNumber(traffic.unique_ips)}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            Avg Response: {formatTime(traffic.avg_response_time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No traffic data available.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

