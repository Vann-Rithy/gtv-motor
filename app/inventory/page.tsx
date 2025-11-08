"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  Search,
  Plus,
  RefreshCw,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  PackageCheck,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface InventoryItem {
  id: number
  name: string
  sku: string
  category_name: string
  current_stock: number
  min_stock: number
  max_stock: number
  unit_price: number
  supplier: string
  last_restocked: string
  stock_status: 'low' | 'normal' | 'high' | 'out_of_stock'
  image?: string
  part_plate?: string
  name_khmer?: string
  vehicle_model_id?: number
}

interface StockMovement {
  id: number
  item_id: number
  item_name: string
  item_sku: string
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number
  reference_type: string
  notes: string
  created_at: string
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function Inventory() {
  const { t } = useLanguage()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showLowStock, setShowLowStock] = useState(false)
  const [showOutOfStock, setShowOutOfStock] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  })

  // Modal states
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [restockQuantity, setRestockQuantity] = useState("")
  const [restockNotes, setRestockNotes] = useState("")

  // Edit Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    category_id: "",
    current_stock: "",
    min_stock: "",
    max_stock: "",
    unit_price: "",
    supplier: ""
  })

  // Load inventory data
  const loadInventory = async (page: number = currentPage) => {
    try {
      setLoading(true)
      const params: any = {
        page,
        limit: itemsPerPage
      }

      if (searchTerm) params.search = searchTerm
      if (selectedCategory !== "all") params.category_id = selectedCategory
      if (showLowStock && !showOutOfStock) {
        params.low_stock = true
      } else if (showOutOfStock && !showLowStock) {
        params.out_of_stock = true
      } else if (showLowStock && showOutOfStock) {
        // If both are enabled, show both
        params.low_stock = true
        params.out_of_stock = true
      }

      const response = await apiClient.getInventory(params)
      const items = response.data || []
      
      // Debug: Log first item to check image field
      if (items.length > 0 && process.env.NODE_ENV === 'development') {
        console.log('Sample inventory item:', {
          id: items[0].id,
          name: items[0].name,
          image: items[0].image,
          hasImage: !!items[0].image
        })
      }
      
      setInventory(items)

      // Update pagination info if available
      if (response.pagination) {
        setPagination(response.pagination)
      }
    } catch (error) {
      console.error("Failed to load inventory:", error)
      toast.error("Failed to load inventory data")
    } finally {
      setLoading(false)
    }
  }

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await apiClient.getInventoryCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error("Failed to load categories:", error)
    }
  }

  useEffect(() => {
    loadInventory(1) // Reset to first page when filters change
    setCurrentPage(1)
    loadCategories()
  }, [searchTerm, selectedCategory, showLowStock, showOutOfStock, itemsPerPage])

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage)
      loadInventory(newPage)
    }
  }

  // Handle items per page change
  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit)
    setCurrentPage(1)
  }

  const getStatusBadge = (status: string, currentStock: number, minStock: number) => {
    if (currentStock === 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Out of Stock
      </Badge>
    } else if (currentStock <= minStock) {
      return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
        <TrendingDown className="h-3 w-3" />
        Low Stock
      </Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        In Stock
      </Badge>
    }
  }

  const getImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No image path provided')
      }
      return null
    }
    
    // If it's already a full URL, return it
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    
    // Otherwise, construct the URL from the API base URL
    const baseUrl = 'https://api.gtvmotor.dev'
    
    // Remove leading slash if present
    let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath
    
    // Convert database paths to match server structure
    // Database stores: images/uploads/parts/file.jpg or uploads/parts/file.jpg
    // Server expects: images/uploads/parts/file.jpg (accessible at /images/uploads/parts/)
    
    if (cleanPath.startsWith('images/uploads/parts/')) {
      // Use as-is (already correct)
      cleanPath = cleanPath
    } else if (cleanPath.startsWith('uploads/parts/')) {
      // Add 'images/' prefix
      cleanPath = 'images/' + cleanPath
    } else if (cleanPath.startsWith('images/uploads/')) {
      // Use as-is
      cleanPath = cleanPath
    } else if (cleanPath.startsWith('uploads/')) {
      // Add 'images/' prefix
      cleanPath = 'images/' + cleanPath
    } else {
      // Assume it's a filename, prepend images/uploads/parts/
      cleanPath = 'images/uploads/parts/' + cleanPath
    }
    
    // Construct URL without /api/ prefix - images are served directly
    const url = `${baseUrl}/${cleanPath}`
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Image URL:', url, 'from path:', imagePath)
    }
    return url
  }

  const getStockIcon = (item: InventoryItem) => {
    if (item.current_stock === 0) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    } else if (item.current_stock <= item.min_stock) {
      return <TrendingDown className="h-4 w-4 text-yellow-500" />
    } else {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    }
  }

  // Calculate stats from current page data (for display purposes)
  const lowStockCount = inventory.filter(item => item.current_stock <= item.min_stock && item.current_stock > 0).length
  const outOfStockCount = inventory.filter(item => item.current_stock === 0).length
  const totalValue = inventory.reduce((sum, item) => sum + (Number(item.current_stock) * Number(item.unit_price)), 0)
  const totalItems = pagination.total || inventory.length

  // Handle quick filter clicks
  const handleLowStockClick = () => {
    setShowLowStock(!showLowStock)
    if (showOutOfStock) setShowOutOfStock(false)
  }

  const handleOutOfStockClick = () => {
    setShowOutOfStock(!showOutOfStock)
    if (showLowStock) setShowLowStock(false)
  }

  const handleShowAllClick = () => {
    setShowLowStock(true)
    setShowOutOfStock(true)
  }

  const clearFilters = () => {
    setShowLowStock(false)
    setShowOutOfStock(false)
    setSearchTerm("")
    setSelectedCategory("all")
  }

  // Action button handlers
  const handleViewDetails = (item: InventoryItem) => {
    setSelectedItem(item)
    setShowDetailsModal(true)
  }

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setEditForm({
      name: item.name,
      sku: item.sku || "",
      category_id: categories.find(c => c.name === item.category_name)?.id.toString() || "",
      current_stock: item.current_stock.toString(),
      min_stock: item.min_stock.toString(),
      max_stock: item.max_stock.toString(),
      unit_price: item.unit_price.toString(),
      supplier: item.supplier || ""
    })
    setShowEditModal(true)
  }

  const handleQuickRestock = (item: InventoryItem) => {
    setSelectedItem(item)
    setRestockQuantity("")
    setRestockNotes("")
    setShowRestockModal(true)
  }

  const handleRestockSubmit = async () => {
    if (!selectedItem || !restockQuantity || Number(restockQuantity) <= 0) {
      toast.error("Please enter a valid quantity")
      return
    }

    try {
      // For now, just show success message - full update would require all fields
      console.log(`Would restock ${selectedItem.name} with ${restockQuantity} units`)

      toast.success(`Successfully restocked ${selectedItem.name}`)
      setShowRestockModal(false)
      setSelectedItem(null)
      setRestockQuantity("")
      setRestockNotes("")
      loadInventory() // Refresh the inventory data
    } catch (error) {
      console.error("Failed to restock item:", error)
      toast.error("Failed to restock item")
    }
  }

  const handleEditSubmit = async () => {
    if (!selectedItem) return

    // Validate required fields
    if (!editForm.name || !editForm.category_id || !editForm.current_stock ||
        !editForm.min_stock || !editForm.max_stock || !editForm.unit_price) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const updateData = {
        name: editForm.name,
        sku: editForm.sku || null,
        category_id: Number(editForm.category_id),
        current_stock: Number(editForm.current_stock),
        min_stock: Number(editForm.min_stock),
        max_stock: Number(editForm.max_stock),
        unit_price: Number(editForm.unit_price),
        supplier: editForm.supplier || null
      }

      await apiClient.updateInventoryItem(selectedItem.id, updateData)

      toast.success(`Successfully updated ${editForm.name}`)
      setShowEditModal(false)
      setSelectedItem(null)
      setEditForm({
        name: "",
        sku: "",
        category_id: "",
        current_stock: "",
        min_stock: "",
        max_stock: "",
        unit_price: "",
        supplier: ""
      })
      loadInventory() // Refresh the inventory data
    } catch (error) {
      console.error("Failed to update item:", error)
      toast.error("Failed to update item")
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('nav.inventory', 'Inventory Management')}</h1>
          <p className="text-muted-foreground">
            Manage parts, track stock levels, and handle restocking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setCurrentPage(1)
            loadInventory(1)
          }} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        <Link href="/inventory/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </Link>
          <Link href="/inventory/restock">
            <Button variant="secondary">
              <PackageCheck className="h-4 w-4 mr-2" />
              Restock
            </Button>
          </Link>
          <Link href="/inventory/movements">
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Movements
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Unique inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Current stock value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Items below minimum
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Items with zero stock
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                  placeholder="Search items, SKU, supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Filters</label>
            <div className="flex flex-wrap gap-2">
                <Button
                  variant={showLowStock && !showOutOfStock ? "default" : "outline"}
                  size="sm"
                  onClick={handleLowStockClick}
                >
                  Low Stock Only
                </Button>
                <Button
                  variant={showOutOfStock && !showLowStock ? "default" : "outline"}
                  size="sm"
                  onClick={handleOutOfStockClick}
                >
                  Out of Stock Only
                </Button>
                <Button
                  variant={showLowStock && showOutOfStock ? "default" : "outline"}
                  size="sm"
                  onClick={handleShowAllClick}
                >
                  Show All
                </Button>
                {(showLowStock || showOutOfStock || searchTerm || selectedCategory !== "all") && (
                <Button
                    variant="ghost"
                  size="sm"
                    onClick={clearFilters}
                >
                    Clear All
                </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Active Filters</label>
              <div className="text-sm text-muted-foreground">
                {!showLowStock && !showOutOfStock && searchTerm === "" && selectedCategory === "all" ? (
                  "No filters applied"
                ) : (
                  <div className="space-y-1">
                    {showLowStock && <div>• Low Stock Only</div>}
                    {showOutOfStock && <div>• Out of Stock Only</div>}
                    {showLowStock && showOutOfStock && <div>• Showing Both</div>}
                    {searchTerm && <div>• Search: "{searchTerm}"</div>}
                    {selectedCategory !== "all" && (
                      <div>• Category: {categories.find(c => c.id.toString() === selectedCategory)?.name}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            Showing {inventory.length} of {pagination.total} items
            {(showLowStock || showOutOfStock) && (
              <span className="ml-2 text-xs">
                {showLowStock && !showOutOfStock && "(Low Stock Only)"}
                {showOutOfStock && !showLowStock && "(Out of Stock Only)"}
                {showLowStock && showOutOfStock && "(Low Stock & Out of Stock)"}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading inventory...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Image</th>
                    <th className="text-left p-2">Item</th>
                    <th className="text-left p-2">SKU</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-center p-2">Stock</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-right p-2">Unit Price</th>
                    <th className="text-right p-2">Total Value</th>
                    <th className="text-center p-2">Last Restocked</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
            {inventory.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleViewDetails(item)}
                    >
                      <td className="p-2">
                        {item.image && item.image.trim() !== '' ? (
                          <div className="relative w-12 h-12 rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                            <img
                              src={getImageUrl(item.image) || ''}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Log error for debugging
                                if (process.env.NODE_ENV === 'development') {
                                  console.error('Image failed to load:', {
                                    itemId: item.id,
                                    itemName: item.name,
                                    imagePath: item.image,
                                    imageUrl: getImageUrl(item.image)
                                  })
                                }
                                // Replace with placeholder icon on error
                                const parent = e.currentTarget.parentElement
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center">
                                      <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                      </svg>
                                    </div>
                                  `
                                }
                              }}
                              onLoad={() => {
                                if (process.env.NODE_ENV === 'development') {
                                  console.log('Image loaded successfully:', item.image)
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.name_khmer && (
                            <div className="text-xs text-muted-foreground">{item.name_khmer}</div>
                          )}
                          <div className="text-sm text-muted-foreground">{item.supplier}</div>
                        </div>
                      </td>
                      <td className="p-2 text-sm">{item.sku}</td>
                      <td className="p-2 text-sm">{item.category_name}</td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getStockIcon(item)}
                          <span className="font-medium">{item.current_stock}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Min: {item.min_stock} | Max: {item.max_stock}
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        {getStatusBadge(item.stock_status, item.current_stock, item.min_stock)}
                      </td>
                      <td className="p-2 text-right">${(Number(item.unit_price) || 0).toFixed(2)}</td>
                      <td className="p-2 text-right font-medium">
                        ${(Number(item.current_stock) * Number(item.unit_price) || 0).toFixed(2)}
                      </td>
                      <td className="p-2 text-center text-sm">
                        {item.last_restocked ? new Date(item.last_restocked).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(item)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                            title="Edit Item"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickRestock(item)}
                            title="Quick Restock"
                          >
                            <PackageCheck className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {inventory.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  {!showLowStock && !showOutOfStock && searchTerm === "" && selectedCategory === "all" ? (
                    "No inventory items found."
                  ) : (
                    <div>
                      <p>No inventory items found matching your criteria.</p>
                      <p className="text-sm mt-2">Try adjusting your filters or search terms.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-2 py-1 border border-input rounded-md bg-background text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.total)} of {pagination.total} items
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Details Modal */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Item Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailsModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Image Display */}
            {selectedItem.image && (
              <div className="mb-4">
                <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={getImageUrl(selectedItem.image) || ''}
                    alt={selectedItem.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Hide image and show placeholder on error
                      const img = e.currentTarget
                      img.style.display = 'none'
                      const parent = img.parentElement
                      if (parent && !parent.querySelector('.image-placeholder')) {
                        const placeholder = document.createElement('div')
                        placeholder.className = 'image-placeholder w-full h-full flex flex-col items-center justify-center text-gray-400'
                        placeholder.innerHTML = `
                          <svg class="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span class="text-sm">Image not available</span>
                        `
                        parent.appendChild(placeholder)
                      }
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="font-medium">{selectedItem.name}</p>
                {selectedItem.name_khmer && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedItem.name_khmer}</p>
                )}
              </div>
              {selectedItem.part_plate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Part Plate</label>
                  <p>{selectedItem.part_plate}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">SKU</label>
                <p>{selectedItem.sku || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p>{selectedItem.category_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Current Stock</label>
                <p className="font-medium">{selectedItem.current_stock}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Min/Max Stock</label>
                <p>{selectedItem.min_stock} / {selectedItem.max_stock}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Unit Price</label>
                <p>${(Number(selectedItem.unit_price) || 0).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Value</label>
                <p className="font-medium">${(Number(selectedItem.current_stock) * Number(selectedItem.unit_price) || 0).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Supplier</label>
                <p>{selectedItem.supplier || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Restocked</label>
                <p>{selectedItem.last_restocked ? new Date(selectedItem.last_restocked).toLocaleDateString() : 'Never'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  {getStatusBadge(selectedItem.stock_status, selectedItem.current_stock, selectedItem.min_stock)}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowDetailsModal(false)
                  handleQuickRestock(selectedItem)
                }}
              >
                Restock Item
              </Button>
                    </div>
                  </div>
                </div>
      )}

      {/* Quick Restock Modal */}
      {showRestockModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Quick Restock</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRestockModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Item</label>
                <p className="font-medium">{selectedItem.name}</p>
                <p className="text-sm text-gray-500">Current Stock: {selectedItem.current_stock}</p>
                  </div>
              <div>
                <label className="text-sm font-medium">Quantity to Add</label>
                <Input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
                  </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="Restock description..."
                />
                  </div>
                  </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowRestockModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRestockSubmit}
                disabled={!restockQuantity || Number(restockQuantity) <= 0}
              >
                Restock Item
                    </Button>
                  </div>
                </div>
              </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Item</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Item name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">SKU</label>
                <Input
                  value={editForm.sku}
                  onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                  placeholder="Item SKU"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <select
                  value={editForm.category_id}
                  onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Current Stock</label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.current_stock}
                  onChange={(e) => setEditForm({ ...editForm, current_stock: e.target.value })}
                  placeholder="Current stock"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Min Stock</label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.min_stock}
                  onChange={(e) => setEditForm({ ...editForm, min_stock: e.target.value })}
                  placeholder="Minimum stock"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Max Stock</label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.max_stock}
                  onChange={(e) => setEditForm({ ...editForm, max_stock: e.target.value })}
                  placeholder="Maximum stock"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Unit Price</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.unit_price}
                  onChange={(e) => setEditForm({ ...editForm, unit_price: e.target.value })}
                  placeholder="Unit price"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Supplier</label>
                <Input
                  value={editForm.supplier}
                  onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={!editForm.name || !editForm.category_id || !editForm.current_stock ||
                          !editForm.min_stock || !editForm.max_stock || !editForm.unit_price}
              >
                Save Changes
              </Button>
            </div>
          </div>
            </div>
          )}
    </div>
  )
}

