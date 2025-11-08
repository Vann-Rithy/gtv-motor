import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleModelId = searchParams.get('vehicle_model_id')
    const vehicleId = searchParams.get('vehicle_id')

    // If neither vehicleModelId nor vehicleId is provided, return default components
    if (!vehicleModelId && !vehicleId) {
      // Return default warranty components instead of error
      const defaultComponents = [
        { id: 1, name: 'Engine', description: 'Engine warranty coverage', category: 'Engine', warranty_years: 10, warranty_kilometers: 200000, is_applicable: 1 },
        { id: 2, name: 'Car Paint', description: 'Paint and body warranty coverage', category: 'Body', warranty_years: 10, warranty_kilometers: 200000, is_applicable: 1 },
        { id: 3, name: 'Transmission (gearbox)', description: 'Transmission and gearbox warranty coverage', category: 'Transmission', warranty_years: 5, warranty_kilometers: 100000, is_applicable: 1 },
        { id: 4, name: 'Electrical System', description: 'Electrical components warranty coverage', category: 'Electrical', warranty_years: 5, warranty_kilometers: 100000, is_applicable: 1 },
        { id: 5, name: 'Battery Hybrid', description: 'Hybrid battery warranty coverage', category: 'Battery', warranty_years: 8, warranty_kilometers: 150000, is_applicable: 0 }
      ]
      return NextResponse.json({
        success: true,
        data: defaultComponents
      })
    }

    let components = []
    
    // Get warranty components from database
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.gtvmotor.dev'
    
    try {
      // Get warranty components from PHP backend
      const componentsResponse = await fetch(`${baseUrl}/api/warranty-configuration.php?action=components`)
      const componentsData = await componentsResponse.json()
      
      if (componentsData.success && componentsData.data) {
        components = componentsData.data
        
        // If we have a vehicle_model_id, get model-specific warranties
        if (vehicleModelId) {
          const modelWarrantiesResponse = await fetch(`${baseUrl}/api/vehicle_model_warranties.php?model_id=${vehicleModelId}`)
          
          if (modelWarrantiesResponse.ok) {
            const modelWarrantiesData = await modelWarrantiesResponse.json()
            
            if (modelWarrantiesData.success && modelWarrantiesData.data) {
              // Match components with model warranties
              components = components.map((component: any) => {
                const modelWarranty = modelWarrantiesData.data.find(
                  (mw: any) => mw.warranty_component_id === component.id
                )
                
                return {
                  ...component,
                  warranty_years: modelWarranty?.warranty_years || component.warranty_years || 0,
                  warranty_kilometers: modelWarranty?.warranty_kilometers || component.warranty_kilometers || 0,
                  is_applicable: modelWarranty?.is_applicable ?? (component.is_applicable ?? 1)
                }
              })
            }
          }
        }
        
        // If we have a vehicle_id, get existing warranty parts for this vehicle
        if (vehicleId) {
          const vehicleWarrantiesResponse = await fetch(`${baseUrl}/api/vehicle_warranty_parts.php?vehicle_id=${vehicleId}`)
          
          if (vehicleWarrantiesResponse.ok) {
            const vehicleWarrantiesData = await vehicleWarrantiesResponse.json()
            
            if (vehicleWarrantiesData.success && vehicleWarrantiesData.data) {
              // Check which components are already active
              const activeComponentIds = vehicleWarrantiesData.data
                .filter((vw: any) => vw.status === 'active')
                .map((vw: any) => vw.warranty_component_id)
              
              components = components.map((component: any) => ({
                ...component,
                is_active: activeComponentIds.includes(component.id)
              }))
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching from backend:', error)
      
      // Fallback to hardcoded warranty data
      components = [
        { id: 1, name: 'Engine', description: 'Engine warranty coverage', category: 'Engine', warranty_years: 10, warranty_kilometers: 200000, is_applicable: 1 },
        { id: 2, name: 'Car Paint', description: 'Paint and body warranty coverage', category: 'Body', warranty_years: 10, warranty_kilometers: 200000, is_applicable: 1 },
        { id: 3, name: 'Transmission (gearbox)', description: 'Transmission and gearbox warranty coverage', category: 'Transmission', warranty_years: 5, warranty_kilometers: 100000, is_applicable: 1 },
        { id: 4, name: 'Electrical System', description: 'Electrical components warranty coverage', category: 'Electrical', warranty_years: 5, warranty_kilometers: 100000, is_applicable: 1 },
        { id: 5, name: 'Battery Hybrid', description: 'Hybrid battery warranty coverage', category: 'Battery', warranty_years: 8, warranty_kilometers: 150000, is_applicable: 0 }
      ]
    }

    return NextResponse.json({
      success: true,
      data: components
    })

  } catch (error) {
    console.error('Error in warranty-parts API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch warranty parts' },
      { status: 500 }
    )
  }
}

