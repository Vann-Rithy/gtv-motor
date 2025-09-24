"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Filter,
  Search,
  Package,
  Calendar,
  Hash
} from "lucide-react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface StockMovement {
  id: number
  item_id: number
  item_name: string
  item_sku: string
  category_name: string
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number
  reference_type: string
  reference_id?: number
  notes?: string
  created_at: string
}

export default function StockMovementsPage() {
  const router = useRouter()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMovementType, setSelectedMovementType] = useState<string>("all")
  const [selectedReferenceType, setSelectedReferenceType] = useState<string>("all")

  // Load stock movements
  const loadMovements = async () => {
    try {
      setLoading(true)
      const params: any = {}
      
      if (searchTerm) params.search = searchTerm
      if (selectedMovementType !== "all") params.movement_type = selectedMovementType
      if (selectedReferenceType !== "all") params.reference_type = selectedReferenceType

      const response = await apiClient.getStockMovements(params)
      setMovements(response.data || [])
    } catch (error) {
      console.error("Failed to load stock movements:", error)
      toast.error("Failed to load stock movements")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMovements()
  }, [searchTerm, selectedMovementType, selectedReferenceType])

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'out':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'adjustment':
        return <Hash className="h-4 w-4 text-blue-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'in':
        return <Badge className="bg-green-100 text-green-800">Stock In</Badge>
      case 'out':
        return <Badge className="bg-red-100 text-red-800">Stock Out</Badge>
      case 'adjustment':
        return <Badge className="bg-blue-100 text-blue-800">Adjustment</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getReferenceTypeBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge className="bg-purple-100 text-purple-800">Purchase</Badge>
      case 'service':
        return <Badge className="bg-orange-100 text-orange-800">Service</Badge>
      case 'adjustment':
        return <Badge className="bg-gray-100 text-gray-800">Adjustment</Badge>
      case 'return':
        return <Badge className="bg-teal-100 text-teal-800">Return</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const filteredMovements = movements.filter((movement) => {
    const matchesSearch = 
      movement.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.item_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesMovementType = selectedMovementType === "all" || movement.movement_type === selectedMovementType
    const matchesReferenceType = selectedReferenceType === "all" || movement.reference_type === selectedReferenceType

    return matchesSearch && matchesMovementType && matchesReferenceType
  })

  const totalIn = movements.filter(m => m.movement_type === 'in').reduce((sum, m) => sum + m.quantity, 0)
  const totalOut = movements.filter(m => m.movement_type === 'out').reduce((sum, m) => sum + m.quantity, 0)
  const netMovement = totalIn - totalOut

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground">
            Track all inventory stock movements and transactions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock In</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{totalIn}</div>
            <p className="text-xs text-muted-foreground">
              Items added to inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Out</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{totalOut}</div>
            <p className="text-xs text-muted-foreground">
              Items removed from inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Movement</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netMovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netMovement >= 0 ? '+' : ''}{netMovement}
            </div>
            <p className="text-xs text-muted-foreground">
              Net change in inventory
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items, SKU, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Movement Type</label>
              <select
                value={selectedMovementType}
                onChange={(e) => setSelectedMovementType(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="all">All Movements</option>
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reference Type</label>
              <select
                value={selectedReferenceType}
                onChange={(e) => setSelectedReferenceType(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="all">All References</option>
                <option value="purchase">Purchase</option>
                <option value="service">Service</option>
                <option value="adjustment">Adjustment</option>
                <option value="return">Return</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Stock Movement History</CardTitle>
              <CardDescription>
                {filteredMovements.length} movements found
              </CardDescription>
            </div>
            <Button variant="outline" onClick={loadMovements} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading movements...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Item</th>
                    <th className="text-center p-2">Movement</th>
                    <th className="text-center p-2">Quantity</th>
                    <th className="text-center p-2">Reference</th>
                    <th className="text-left p-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((movement) => (
                    <tr key={movement.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(movement.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(movement.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-2">
                        <div>
                          <div className="font-medium text-sm">{movement.item_name}</div>
                          <div className="text-xs text-muted-foreground">
                            SKU: {movement.item_sku} | {movement.category_name}
                          </div>
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getMovementIcon(movement.movement_type)}
                          {getMovementBadge(movement.movement_type)}
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`font-medium ${
                          movement.movement_type === 'in' ? 'text-green-600' : 
                          movement.movement_type === 'out' ? 'text-red-600' : 
                          'text-blue-600'
                        }`}>
                          {movement.movement_type === 'in' ? '+' : 
                           movement.movement_type === 'out' ? '-' : '±'}
                          {movement.quantity}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {getReferenceTypeBadge(movement.reference_type)}
                          {movement.reference_id && (
                            <span className="text-xs text-muted-foreground">
                              ID: {movement.reference_id}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {movement.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredMovements.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  No stock movements found matching your criteria.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
