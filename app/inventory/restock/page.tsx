"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  PackageCheck, 
  Plus, 
  Minus, 
  Trash2, 
  AlertTriangle,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface RestockItem {
  id: number
  name: string
  sku: string
  category_name: string
  current_stock: number
  min_stock: number
  max_stock: number
  unit_price: number
  supplier: string
  stock_status: 'low' | 'normal' | 'high' | 'out_of_stock'
  suggested_quantity?: number
}

interface RestockFormItem {
  item_id: number
  item_name: string
  item_sku: string
  current_stock: number
  quantity: number
  unit_price: number
}

export default function RestockPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [items, setItems] = useState<RestockItem[]>([])
  const [selectedItems, setSelectedItems] = useState<RestockFormItem[]>([])
  const [supplier, setSupplier] = useState("")
  const [notes, setNotes] = useState("")
  const [showLowStock, setShowLowStock] = useState(false)
  const [showOutOfStock, setShowOutOfStock] = useState(false)

  // Load restock suggestions
  const loadRestockSuggestions = async () => {
    try {
      setLoading(true)
      const params: any = {}
      
      // Only apply filters if they are enabled
      if (showLowStock && !showOutOfStock) {
        params.low_stock = true
      } else if (showOutOfStock && !showLowStock) {
        params.out_of_stock = true
      } else if (showLowStock && showOutOfStock) {
        // If both are enabled, show both
        params.low_stock = true
        params.out_of_stock = true
      }

      const response = await apiClient.getRestockSuggestions(params)
      const itemsWithSuggestions = (response.data || []).map((item: RestockItem) => ({
        ...item,
        suggested_quantity: calculateSuggestedQuantity(item)
      }))
      setItems(itemsWithSuggestions)
    } catch (error) {
      console.error("Failed to load restock suggestions:", error)
      toast.error("Failed to load restock suggestions")
    } finally {
      setLoading(false)
    }
  }

  // Calculate suggested restock quantity
  const calculateSuggestedQuantity = (item: RestockItem) => {
    if (item.current_stock === 0) {
      // Out of stock - suggest 80% of max stock
      return Math.ceil(item.max_stock * 0.8)
    } else if (item.current_stock <= item.min_stock) {
      // Low stock - suggest enough to reach 80% of max stock
      return Math.ceil(item.max_stock * 0.8) - item.current_stock
    }
    return 0
  }

  // Add item to restock list
  const addToRestock = (item: RestockItem) => {
    const suggestedQty = item.suggested_quantity || 1
    const newItem: RestockFormItem = {
      item_id: item.id,
      item_name: item.name,
      item_sku: item.sku,
      current_stock: item.current_stock,
      quantity: suggestedQty,
      unit_price: item.unit_price
    }
    setSelectedItems(prev => [...prev, newItem])
  }

  // Remove item from restock list
  const removeFromRestock = (itemId: number) => {
    setSelectedItems(prev => prev.filter(item => item.item_id !== itemId))
  }

  // Update quantity for an item
  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity < 0) return
    setSelectedItems(prev => 
      prev.map(item => 
        item.item_id === itemId ? { ...item, quantity } : item
      )
    )
  }

  // Add all low stock items
  const addAllLowStock = () => {
    const lowStockItems = items.filter(item => 
      item.current_stock <= item.min_stock && 
      !selectedItems.some(selected => selected.item_id === item.id)
    )
    
    const newItems: RestockFormItem[] = lowStockItems.map(item => ({
      item_id: item.id,
      item_name: item.name,
      item_sku: item.sku,
      current_stock: item.current_stock,
      quantity: item.suggested_quantity || 1,
      unit_price: item.unit_price
    }))
    
    setSelectedItems(prev => [...prev, ...newItems])
  }

  // Submit restock
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to restock")
      return
    }

    try {
      setSubmitting(true)
      
      const restockData = {
        items: selectedItems.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity
        })),
        supplier,
        notes
      }

      const response = await apiClient.restockItems(restockData)
      
      toast.success(`Successfully restocked ${response.data.items_restocked} items`)
      router.push("/inventory")
    } catch (error) {
      console.error("Failed to restock items:", error)
      toast.error("Failed to process restock")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    loadRestockSuggestions()
  }, [showLowStock, showOutOfStock])

  const totalValue = selectedItems.reduce((sum, item) => sum + (item.quantity * Number(item.unit_price)), 0)
  const totalItems = selectedItems.length

  const getStatusBadge = (item: RestockItem) => {
    if (item.current_stock === 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Out of Stock
      </Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
        <TrendingDown className="h-3 w-3" />
        Low Stock
      </Badge>
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restock Inventory</h1>
          <p className="text-muted-foreground">
            Add stock to inventory items and track restocking activities
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Restock Suggestions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5" />
                Restock Suggestions
              </CardTitle>
              <CardDescription>
                Select items that need restocking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                                 <Button
                   variant={showLowStock ? "default" : "outline"}
                   size="sm"
                   onClick={() => {
                     setShowLowStock(!showLowStock)
                     if (showOutOfStock) setShowOutOfStock(false)
                   }}
                 >
                   Low Stock Only
                 </Button>
                 <Button
                   variant={showOutOfStock ? "default" : "outline"}
                   size="sm"
                   onClick={() => {
                     setShowOutOfStock(!showOutOfStock)
                     if (showLowStock) setShowLowStock(false)
                   }}
                 >
                   Out of Stock Only
                 </Button>
                                 <Button
                   variant={showLowStock && showOutOfStock ? "default" : "outline"}
                   size="sm"
                   onClick={() => {
                     setShowLowStock(true)
                     setShowOutOfStock(true)
                   }}
                 >
                   Show All
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={addAllLowStock}
                 >
                   Add All Low Stock
                 </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadRestockSuggestions}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading suggestions...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{item.name}</h3>
                          {getStatusBadge(item)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>SKU: {item.sku} | Category: {item.category_name}</div>
                          <div>Current Stock: {item.current_stock} | Min: {item.min_stock} | Max: {item.max_stock}</div>
                                                     <div>Unit Price: ${(Number(item.unit_price) || 0).toFixed(2)} | Supplier: {item.supplier}</div>
                        </div>
                        {item.suggested_quantity && item.suggested_quantity > 0 && (
                          <div className="text-sm text-blue-600 mt-1">
                            Suggested quantity: {item.suggested_quantity}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedItems.some(selected => selected.item_id === item.id) ? (
                          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Added
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => addToRestock(item)}
                            disabled={!item.suggested_quantity || item.suggested_quantity <= 0}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                                     {items.length === 0 && (
                     <div className="text-center py-8 text-muted-foreground">
                       {!showLowStock && !showOutOfStock ? (
                         <div>
                           <p>Please select a filter to see restock suggestions:</p>
                           <p className="text-sm mt-2">• Low Stock Only - Items below minimum stock level</p>
                           <p className="text-sm">• Out of Stock Only - Items with zero stock</p>
                           <p className="text-sm">• Show All - Both low stock and out of stock items</p>
                         </div>
                       ) : (
                         "No items need restocking based on current filters."
                       )}
                     </div>
                   )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Restock Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Restock Summary</CardTitle>
              <CardDescription>
                Review and submit restock order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Enter supplier name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Description</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional description about this restock..."
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Items to restock:</span>
                    <span className="font-medium">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total value:</span>
                    <span className="font-medium">${totalValue.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting || totalItems === 0}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <PackageCheck className="h-4 w-4 mr-2" />
                      Submit Restock ({totalItems} items)
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Items</CardTitle>
                <CardDescription>
                  Items to be restocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div key={item.item_id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.item_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Current: {item.current_stock} | SKU: {item.item_sku}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromRestock(item.item_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
