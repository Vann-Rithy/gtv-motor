# Warranty Parts Implementation

## Overview
This implementation adds warranty parts selection functionality to the service form. When a user sets a warranty start date on a service, they can now select specific warranty parts (components) and set durations for each part, which are saved to the database.

## Changes Made

### 1. Database Changes

#### New Table: `vehicle_warranty_parts`
Created `backend/create_vehicle_warranty_parts.sql` to store individual warranty parts for each vehicle.

**Table Structure:**
- `id`: Primary key
- `vehicle_id`: Foreign key to vehicles table
- `warranty_component_id`: Foreign key to warranty_components table
- `warranty_years`: Duration in years
- `warranty_kilometers`: Duration in kilometers
- `start_date`: Warranty start date
- `end_date`: Warranty end date (calculated from start_date + years)
- `km_limit`: Maximum kilometers covered
- `status`: active/expired/suspended/cancelled
- `created_at`, `updated_at`: Timestamps

### 2. Backend API Endpoints

#### a. `backend/api/vehicle_model_warranties.php`
- GET endpoint to fetch warranty components for a specific vehicle model
- Returns warranty configurations from `vehicle_model_warranties` table

#### b. `backend/api/vehicle_warranty_parts.php`
- GET endpoint to retrieve warranty parts for a specific vehicle
- POST endpoint to create warranty parts for a vehicle
- Handles batch creation of warranty parts

#### c. Updated `backend/api/services-enhanced.php`
- Added support for `warranty_parts` parameter
- When `set_warranty_start_date` is true and warranty parts are provided:
  - Creates service record
  - Sets vehicle warranty start date
  - Inserts warranty parts into `vehicle_warranty_parts` table with calculated end dates

#### d. Updated `backend/api/vehicles.php`
- Added `vehicle_model_id` to SELECT queries to support warranty parts lookup

### 3. Frontend Changes

#### a. `app/api/warranty-parts/route.ts`
New API endpoint that:
- Fetches warranty components from PHP backend
- Gets model-specific warranty configurations
- Returns warranty parts data with years and kilometers

#### b. `components/ServiceForm.tsx`
Enhanced with:
- `WarrantyComponent` interface for type safety
- `vehicle_model_id` added to `Vehicle` interface
- State management for warranty components and selected parts
- `fetchWarrantyComponents()` function to load warranty parts by vehicle model
- UI for warranty parts selection (shown when warranty start date is being set)
- Submission logic to send warranty parts data to backend

**Key Features:**
- Warranty parts are displayed in a grid with checkboxes
- Each part shows: name, warranty years, and kilometers
- All applicable parts are pre-selected by default
- Users can deselect parts they don't want to apply
- Selected parts are sent to backend when service is created

### 4. UI Flow

1. User opens service form and selects a vehicle
2. If it's the first service (no warranty_start_date):
   - Yellow banner appears with "First Service Detected" message
   - Checkbox to "Set warranty start date"
3. When user checks the warranty start date checkbox:
   - Warranty parts selection UI appears below
   - Shows all applicable warranty components (Engine, Car Paint, Transmission, etc.)
   - Each component displays its warranty duration (Years/KM)
   - Checkboxes allow selection/deselection
4. When user submits:
   - Selected warranty parts are sent to backend
   - Backend creates warranty part records in database

## Warranty Components Available

Based on the warranty table image:
- **Engine**: 10 Years / 200,000 km
- **Car Paint**: 10 Years / 200,000 km
- **Transmission (gearbox)**: 5 Years / 100,000 km
- **Electrical System**: 5 Years / 100,000 km
- **Battery Hybrid**: 8 Years / 150,000 km (applicable only to KAIN PHEV and KESSOR models)

## Database Setup Instructions

1. Run the SQL file to create the table:
   ```bash
   mysql -u username -p database_name < backend/create_vehicle_warranty_parts.sql
   ```

2. Ensure warranty components exist in database:
   - Run `backend/create_warranty_configuration_system.sql`
   - This will insert warranty components and model configurations

## API Usage

### Fetch Warranty Parts for a Vehicle Model
```
GET /api/warranty-parts?vehicle_model_id={id}
```

### Create Service with Warranty Parts
```
POST /api/services-enhanced
{
  "vehicle_id": 1,
  "service_date": "2024-01-01",
  "set_warranty_start_date": true,
  "warranty_parts": [
    {
      "warranty_component_id": 1,
      "warranty_years": 10,
      "warranty_kilometers": 200000
    },
    {
      "warranty_component_id": 2,
      "warranty_years": 10,
      "warranty_kilometers": 200000
    }
  ]
}
```

## Testing Checklist

- [ ] Create a new service for a vehicle without warranty
- [ ] Verify "Set warranty start date" checkbox appears
- [ ] Check the checkbox and verify warranty parts UI appears
- [ ] Verify all applicable warranty components are listed
- [ ] Select/deselect warranty components
- [ ] Submit the form
- [ ] Verify warranty_start_date is set on vehicle
- [ ] Verify warranty parts are created in database
- [ ] Verify warranty end dates are calculated correctly

## Notes

- Warranty parts are only applicable to hybrid vehicles (Battery Hybrid component)
- The system pre-selects all applicable components by default
- Users can customize which warranty parts they want to apply
- End dates are automatically calculated from start date + years




