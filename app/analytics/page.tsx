"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, DollarSign, Users, BarChart3, PieChart, Activity, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("monthly")
  const [isLoading, setIsLoading] = useState(false)
  const [currentData, setCurrentData] = useState<any>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected')
  const [showUpdateNotification, setShowUpdateNotification] = useState(false)

  // Fetch data from API
  const fetchAnalyticsData = async (range: string) => {
    try {
      setIsLoading(true)
      setConnectionStatus('connected')
      const response = await fetch(`/api/analytics?range=${range}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data")
      }
      
      const data = await response.json()
      setCurrentData(data)
      setLastUpdated(new Date())
      
      // Show update notification
      setShowUpdateNotification(true)
      setTimeout(() => setShowUpdateNotification(false), 3000)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast.error("Failed to load analytics data")
      setConnectionStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData(timeRange)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalyticsData(timeRange)
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [timeRange]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
    fetchAnalyticsData(value)
  }

  // Refresh data
  const handleRefresh = () => {
    fetchAnalyticsData(timeRange)
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Update Notification */}
      {showUpdateNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-right-2 duration-300">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Data updated successfully!</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive business insights and data visualization</p>
          {lastUpdated && (
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
              <span className="text-xs text-green-600 font-medium">
                ({Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago)
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium">
            <div 
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`}
            />
            <span className={
              connectionStatus === 'connected' ? 'text-green-600' : 
              connectionStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
            }>
              {connectionStatus === 'connected' ? 'Live' : 
               connectionStatus === 'error' ? 'Error' : 'Connecting...'}
            </span>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily (This Week)</SelectItem>
              <SelectItem value="monthly">Monthly (This Year)</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600 mb-2">Fetching real-time data...</div>
            <div className="text-sm text-gray-500">Connecting to live database</div>
          </div>
        </div>
      )}

      {!isLoading && !currentData && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-gray-500 text-lg mb-2">No data available</div>
            <div className="text-sm text-gray-400 mb-4">Unable to connect to live database</div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

             {!isLoading && currentData && (
         <>
           {/* Calculate derived values from currentData */}
           {(() => {
             // Safety checks to prevent runtime errors
             if (!currentData?.revenue?.length || !currentData?.serviceTypes?.length) {
               return (
                 <div className="text-center py-12">
                   <div className="text-gray-500 text-lg mb-2">No data available for selected time range</div>
                   <div className="text-sm text-gray-400">Try selecting a different time range or refresh the data</div>
                 </div>
               )
             }
             
                           const maxRevenue = Math.max(...currentData.revenue.map((d) => d.revenue)) || 1
              const maxServices = Math.max(...currentData.revenue.map((d) => d.services)) || 1
              const totalServices = currentData.serviceTypes.reduce((sum, item) => sum + item.count, 0)
             
             return (
               <>
                 {/* KPI Cards */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${currentData.totals.revenue.toLocaleString()}</div>
                <p className="text-xs text-green-600">Live data</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentData.totals.services}</div>
                <p className="text-xs text-blue-600">Live data</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <Users className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentData.totals.customers}</div>
                <p className="text-xs text-purple-600">Live data</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Service Value</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${currentData.totals.avgValue}</div>
                <p className="text-xs text-orange-600">Live data</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue & Services Chart - Enhanced Line Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>Revenue performance with trend analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Revenue Line Chart */}
                  <div className="h-64 relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                    <svg className="w-full h-full" viewBox="0 0 800 200">
                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4].map((i) => (
                        <g key={i}>
                          <line
                            x1="60"
                            y1={40 + i * 30}
                            x2="740"
                            y2={40 + i * 30}
                            stroke="#e0e7ff"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                          />
                          <text
                            x="45"
                            y={45 + i * 30}
                            className="text-xs fill-gray-500"
                            textAnchor="end"
                          >
                            ${Math.round(maxRevenue - (i * maxRevenue / 4) / 1000)}k
                          </text>
                        </g>
                      ))}

                      {/* Revenue area fill */}
                      <defs>
                        <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                        </linearGradient>
                      </defs>

                                             <path
                         d={`M60,160 ${currentData.revenue.map((data, index) => {
                           const x = currentData.revenue.length > 1 
                             ? 60 + (index * 680) / (currentData.revenue.length - 1)
                             : 60 + (index * 680)
                           const y = 160 - ((data.revenue / maxRevenue) * 120)
                           return `L${x},${y}`
                         }).join(" ")} L740,160 Z`}
                         fill="url(#revenueGradient)"
                       />

                      {/* Revenue line */}
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={currentData.revenue
                          .map((data, index) => {
                            const x = currentData.revenue.length > 1 
                              ? 60 + (index * 680) / (currentData.revenue.length - 1)
                              : 60 + (index * 680)
                            const y = 160 - ((data.revenue / maxRevenue) * 120)
                            return `${x},${y}`
                          })
                          .join(" ")}
                      />

                      {/* Data points */}
                      {currentData.revenue.map((data, index) => {
                        const x = currentData.revenue.length > 1 
                          ? 60 + (index * 680) / (currentData.revenue.length - 1)
                          : 60 + (index * 680)
                        const y = 160 - ((data.revenue / maxRevenue) * 120)
                        return (
                          <g key={index}>
                            <circle
                              cx={x}
                              cy={y}
                              r="5"
                              fill="#fff"
                              stroke="#3b82f6"
                              strokeWidth="3"
                              className="hover:r-7 transition-all duration-200"
                            />
                            <text
                              x={x}
                              y="185"
                              textAnchor="middle"
                              className="text-xs fill-gray-600 font-medium"
                            >
                              {data.period}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  </div>

                  {/* Revenue Statistics */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">${Math.max(...currentData.revenue.map(d => d.revenue)).toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Peak Revenue</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-green-600">${Math.round(currentData.revenue.reduce((sum, d) => sum + d.revenue, 0) / currentData.revenue.length).toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Average</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {((currentData.revenue[currentData.revenue.length - 1].revenue - currentData.revenue[0].revenue) / currentData.revenue[0].revenue * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Growth</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Service Volume
                </CardTitle>
                <CardDescription>Service count trends and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Service Volume Line Chart */}
                  <div className="h-64 relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                    <svg className="w-full h-full" viewBox="0 0 800 200">
                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4].map((i) => (
                        <g key={i}>
                          <line
                            x1="60"
                            y1={40 + i * 30}
                            x2="740"
                            y2={40 + i * 30}
                            stroke="#dcfce7"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                          />
                          <text
                            x="45"
                            y={45 + i * 30}
                            className="text-xs fill-gray-500"
                            textAnchor="end"
                          >
                            {Math.round(maxServices - (i * maxServices / 4))}
                          </text>
                        </g>
                      ))}

                      {/* Service volume area fill */}
                      <defs>
                        <linearGradient id="serviceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.05"/>
                        </linearGradient>
                      </defs>

                                             <path
                         d={`M60,160 ${currentData.revenue.map((data, index) => {
                           const x = currentData.revenue.length > 1 
                             ? 60 + (index * 680) / (currentData.revenue.length - 1)
                             : 60 + (index * 680)
                           const y = 160 - ((data.services / maxServices) * 120)
                           return `L${x},${y}`
                         }).join(" ")} L740,160 Z`}
                         fill="url(#serviceGradient)"
                       />

                                             {/* Service volume line */}
                       <polyline
                         fill="none"
                         stroke="#10b981"
                         strokeWidth="3"
                         strokeLinecap="round"
                         strokeLinejoin="round"
                         points={currentData.revenue
                           .map((data, index) => {
                             const x = currentData.revenue.length > 1 
                               ? 60 + (index * 680) / (currentData.revenue.length - 1)
                               : 60 + (index * 680)
                             const y = 160 - ((data.services / maxServices) * 120)
                             return `${x},${y}`
                           })
                           .join(" ")}
                       />

                                             {/* Data points */}
                       {currentData.revenue.map((data, index) => {
                         const x = currentData.revenue.length > 1 
                           ? 60 + (index * 680) / (currentData.revenue.length - 1)
                           : 60 + (index * 680)
                         const y = 160 - ((data.services / maxServices) * 120)
                         return (
                           <g key={index}>
                             <circle
                               cx={x}
                               cy={y}
                               r="5"
                               fill="#fff"
                               stroke="#10b981"
                               strokeWidth="3"
                               className="hover:r-7 transition-all duration-200"
                             />
                             <text
                               x={x}
                               y="185"
                               textAnchor="middle"
                               className="text-xs fill-gray-600 font-medium"
                             >
                               {data.period}
                             </text>
                           </g>
                         )
                       })}
                    </svg>
                  </div>

                  {/* Service Statistics */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-green-600">{Math.max(...currentData.revenue.map(d => d.services))}</div>
                      <div className="text-xs text-gray-600">Peak Services</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{Math.round(currentData.revenue.reduce((sum, d) => sum + d.services, 0) / currentData.revenue.length)}</div>
                      <div className="text-xs text-gray-600">Average</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">
                        {((currentData.revenue[currentData.revenue.length - 1].services - currentData.revenue[0].services) / currentData.revenue[0].services * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Growth</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Types Pie Chart - Enhanced Layout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="mr-2 h-5 w-5" />
                Service Distribution
              </CardTitle>
              <CardDescription>Breakdown of services by type with revenue analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Large Pie Chart Visualization */}
                <div className="xl:col-span-1 flex items-center justify-center">
                  <div className="relative" >
                  <svg
  style={{ width: '500px', height: '500px' }} // equivalent to w-96 h-96
  className="transform -rotate-90"
  viewBox="0 0 100 100"
>

                      {currentData.serviceTypes.map((item, index) => {
                        const percentage = (item.count / totalServices) * 100
                        const strokeDasharray = `${percentage} ${100 - percentage}`
                        const strokeDashoffset = currentData.serviceTypes
                          .slice(0, index)
                          .reduce((acc, curr) => acc + (curr.count / totalServices) * 100, 0)

                        return (
                          <circle
                            key={index}
                            cx="50"
                            cy="50"
                            r="15.915"
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth="5"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={-strokeDashoffset}
                            className="transition-all duration-500 hover:stroke-width-17 drop-shadow-sm"
                          />
                        )
                      })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-800">{totalServices}</div>
                        <div className="text-lg text-gray-500">Total Services</div>
                        <div className="text-sm text-gray-400 mt-1">${currentData.serviceTypes.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Legend and Statistics */}
                <div className="xl:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentData.serviceTypes.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 hover:border-gray-300"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-8 h-8 rounded-full shadow-md"
                            style={{ backgroundColor: item.color }}
                          />
                          <div>
                            <p className="font-semibold text-lg text-gray-800">{item.type}</p>
                            <p className="text-sm text-gray-500">{item.count} services completed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl text-gray-800">${item.revenue.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{((item.count / totalServices) * 100).toFixed(1)}% of total</p>
                          <p className="text-xs text-gray-400">${Math.round(item.revenue / item.count)} avg</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Statistics */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border">
                    <h4 className="font-semibold text-lg mb-4 text-gray-800">Service Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{totalServices}</div>
                        <div className="text-sm text-gray-600">Total Services</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          ${currentData.serviceTypes.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Total Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          ${Math.round(currentData.serviceTypes.reduce((sum, item) => sum + item.revenue, 0) / totalServices)}
                        </div>
                        <div className="text-sm text-gray-600">Avg per Service</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {currentData.serviceTypes.length}
                        </div>
                        <div className="text-sm text-gray-600">Service Types</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Analytics with Enhanced Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Customer Analytics
              </CardTitle>
              <CardDescription>Customer acquisition and retention trends with detailed analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Enhanced Line Chart Visualization */}
                <div className="h-80 relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                  <svg className="w-full h-full" viewBox="0 0 900 240">
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <g key={i}>
                        <line
                          x1="80"
                          y1={40 + i * 25}
                          x2="820"
                          y2={40 + i * 25}
                          stroke="#f3e8ff"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                        <text
                          x="70"
                          y={45 + i * 25}
                          className="text-xs fill-gray-500"
                          textAnchor="end"
                        >
                          {Math.max(...currentData.customers.map(d => Math.max(d.new, d.returning))) - i * 5 || 0}
                        </text>
                      </g>
                    ))}

                    {/* Area fills for better visualization */}
                    <defs>
                      <linearGradient id="newCustomerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                      </linearGradient>
                      <linearGradient id="returningCustomerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.05"/>
                      </linearGradient>
                    </defs>

                    {/* Area fill for new customers */}
                    <path
                      d={`M80,190 ${currentData.customers.map((data, index) => {
                        const x = currentData.customers.length > 1 
                          ? 80 + (index * 740) / (currentData.customers.length - 1)
                          : 80 + (index * 740)
                        const maxCustomers = Math.max(...currentData.customers.map(d => Math.max(d.new, d.returning)))
                        const y = 190 - ((data.new / maxCustomers) * 150)
                        return `L${x},${y}`
                      }).join(" ")} L820,190 Z`}
                      fill="url(#newCustomerGradient)"
                    />

                    {/* Area fill for returning customers */}
                    <path
                      d={`M80,190 ${currentData.customers.map((data, index) => {
                        const x = currentData.customers.length > 1 
                          ? 80 + (index * 740) / (currentData.customers.length - 1)
                          : 80 + (index * 740)
                        const maxCustomers = Math.max(...currentData.customers.map(d => Math.max(d.new, d.returning)))
                        const y = 190 - ((data.returning / maxCustomers) * 150)
                        return `L${x},${y}`
                      }).join(" ")} L820,190 Z`}
                      fill="url(#returningCustomerGradient)"
                    />

                    {/* New customers line */}
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={currentData.customers
                        .map((data, index) => {
                          const x = currentData.customers.length > 1 
                            ? 80 + (index * 740) / (currentData.customers.length - 1)
                            : 80 + (index * 740)
                          const maxCustomers = Math.max(...currentData.customers.map(d => Math.max(d.new, d.returning)))
                          const y = 190 - ((data.new / maxCustomers) * 150)
                          return `${x},${y}`
                        })
                        .join(" ")}
                    />

                    {/* Returning customers line */}
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={currentData.customers
                        .map((data, index) => {
                          const x = currentData.customers.length > 1 
                            ? 80 + (index * 740) / (currentData.customers.length - 1)
                            : 80 + (index * 740)
                          const maxCustomers = Math.max(...currentData.customers.map(d => Math.max(d.new, d.returning)))
                          const y = 190 - ((data.returning / maxCustomers) * 150)
                          return `${x},${y}`
                        })
                        .join(" ")}
                    />

                    {/* Enhanced data points for new customers */}
                    {currentData.customers.map((data, index) => {
                      const x = currentData.customers.length > 1 
                        ? 80 + (index * 740) / (currentData.customers.length - 1)
                        : 80 + (index * 740)
                      const maxCustomers = Math.max(...currentData.customers.map(d => Math.max(d.new, d.returning)))
                      const y = 190 - ((data.new / maxCustomers) * 150)
                      return (
                        <g key={`new-${index}`}>
                          <circle
                            cx={x}
                            cy={y}
                            r="6"
                            fill="#fff"
                            stroke="#3b82f6"
                            strokeWidth="3"
                            className="hover:r-8 transition-all duration-200 drop-shadow-sm"
                          />
                          <text
                            x={x}
                            y={y - 12}
                            textAnchor="middle"
                            className="text-xs fill-blue-600 font-semibold"
                          >
                            {data.new}
                          </text>
                        </g>
                      )
                    })}

                    {/* Enhanced data points for returning customers */}
                    {currentData.customers.map((data, index) => {
                      const x = currentData.customers.length > 1 
                        ? 80 + (index * 740) / (currentData.customers.length - 1)
                        : 80 + (index * 740)
                      const maxCustomers = Math.max(...currentData.customers.map(d => Math.max(d.new, d.returning)))
                      const y = 190 - ((data.returning / maxCustomers) * 150)
                      return (
                        <g key={`returning-${index}`}>
                          <circle
                            cx={x}
                            cy={y}
                            r="6"
                            fill="#fff"
                            stroke="#10b981"
                            strokeWidth="3"
                            className="hover:r-8 transition-all duration-200 drop-shadow-sm"
                          />
                          <text
                            x={x}
                            y={y - 12}
                            textAnchor="middle"
                            className="text-xs fill-green-600 font-semibold"
                          >
                            {data.returning}
                          </text>
                        </g>
                      )
                    })}

                    {/* X-axis labels */}
                    {currentData.customers.map((data, index) => {
                      const x = currentData.customers.length > 1 
                        ? 80 + (index * 740) / (currentData.customers.length - 1)
                        : 80 + (index * 740)
                      return (
                        <text
                          key={`label-${index}`}
                          x={x}
                          y="215"
                          textAnchor="middle"
                          className="text-sm fill-gray-600 font-medium"
                        >
                          {data.period}
                        </text>
                      )
                    })}
                  </svg>
                </div>

                {/* Customer Analytics Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">
                      {currentData.customers.reduce((sum, d) => sum + d.new, 0)}
                    </div>
                    <div className="text-sm text-blue-700">Total New Customers</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Avg: {Math.round(currentData.customers.reduce((sum, d) => sum + d.new, 0) / currentData.customers.length)} per period
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {currentData.customers.reduce((sum, d) => sum + d.returning, 0)}
                    </div>
                    <div className="text-sm text-green-700">Total Returning</div>
                    <div className="text-xs text-green-600 mt-1">
                      Avg: {Math.round(currentData.customers.reduce((sum, d) => sum + d.returning, 0) / currentData.customers.length)} per period
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((currentData.customers.reduce((sum, d) => sum + d.returning, 0) /
                      (currentData.customers.reduce((sum, d) => sum + d.new + d.returning, 0))) * 100)}%
                    </div>
                    <div className="text-sm text-purple-700">Retention Rate</div>
                    <div className="text-xs text-purple-600 mt-1">Customer loyalty metric</div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">
                      {currentData.customers.reduce((sum, d) => sum + d.new + d.returning, 0)}
                    </div>
                    <div className="text-sm text-orange-700">Total Customers</div>
                    <div className="text-xs text-orange-600 mt-1">All-time engagement</div>
                  </div>
                </div>

                {/* Detailed Period Analysis */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h4 className="font-semibold text-gray-800">Period-by-Period Analysis</h4>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {currentData.customers.map((data, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="font-semibold text-lg text-gray-800 w-16">{data.period}</div>
                            <div className="flex space-x-6">
                              <div className="text-center">
                                <div className="text-sm font-medium text-blue-600">{data.new}</div>
                                <div className="text-xs text-gray-500">New</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-medium text-green-600">{data.returning}</div>
                                <div className="text-xs text-gray-500">Returning</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-medium text-gray-800">{data.new + data.returning}</div>
                                <div className="text-xs text-gray-500">Total</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-purple-600">
                                {Math.round((data.returning / (data.new + data.returning)) * 100)}%
                              </div>
                              <div className="text-xs text-gray-500">Retention</div>
                            </div>
                            <div className="w-32">
                              <div className="flex space-x-1 h-6 rounded-full overflow-hidden bg-gray-200">
                                <div
                                  className="bg-blue-500 transition-all duration-300"
                                  style={{ width: `${(data.new / (data.new + data.returning)) * 100}%` }}
                                />
                                <div
                                  className="bg-green-500 transition-all duration-300"
                                  style={{ width: `${(data.returning / (data.new + data.returning)) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend and Insights */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm" />
                      <span className="text-sm font-medium text-gray-700">New Customers</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm" />
                      <span className="text-sm font-medium text-gray-700">Returning Customers</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 max-w-md">
                    <strong>Insight:</strong> Higher retention rates indicate strong customer satisfaction and service quality.
                    Monitor trends to identify opportunities for customer retention improvements.
                  </div>
                                 </div>
               </div>
             </CardContent>
           </Card>
               </>
             )
           })()}
         </>
       )}

      {/* Data Source Info */}
      {currentData && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Data Source:</span> Live Database
            </div>
            <div className="text-sm text-gray-500">
              Auto-refresh every 5 minutes • Last sync: {lastUpdated?.toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
