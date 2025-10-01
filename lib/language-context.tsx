"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'en' | 'km'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, fallback?: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation data
const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.customers': 'Customers',
    'nav.services': 'Services',
    'nav.bookings': 'Bookings',
    'nav.inventory': 'Inventory',
    'nav.warranty': 'Warranty',
    'nav.alerts': 'Alerts',
    'nav.followups': 'Follow-ups',
    'nav.reports': 'Reports',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',

    // Service Management
    'services.title': 'Service Management',
    'services.new': 'New Service',
    'services.search': 'Search by customer, invoice, or vehicle...',
    'services.status.all': 'All Status',
    'services.status.completed': 'Completed',
    'services.status.in_progress': 'In Progress',
    'services.status.pending': 'Pending',
    'services.payment.paid': 'Paid',
    'services.payment.pending': 'Pending',
    'services.payment.cancelled': 'Cancelled',
    'services.customer': 'Customer',
    'services.vehicle': 'Vehicle',
    'services.date': 'Date',
    'services.type': 'Service Type',
    'services.amount': 'Amount',
    'services.payment': 'Payment',
    'services.technician': 'Technician',
    'services.notes': 'Notes',
    'services.view_details': 'View Details',
    'services.invoice': 'Invoice',
    'services.payment_change': 'Payment',
    'services.no_services': 'No services found',
    'services.loading': 'Loading services...',

    // Customer Management
    'customers.add': '+ Add Customer',
    'customers.search_placeholder': 'Search customers by name, phone, or plate number...',
    'customers.loading': 'Loading customers...',
    'customers.no_customers': 'No customers found',
    'customers.total': 'total customers',
    'customers.page': 'Page',
    'customers.of': 'of',
    'customers.customer_overview': 'Customer Overview',
    'customers.contact_info': 'Contact Information',
    'customers.vehicles': 'Vehicles',
    'customers.recent_services': 'Recent Service History',
    'customers.active_alerts': 'Active Alerts',
    'customers.name': 'Customer Name',
    'customers.phone': 'Phone Number',
    'customers.email': 'Email Address',
    'customers.address': 'Customer Address',

    // Booking Management
    'bookings.new': 'New Booking',
    'bookings.search_placeholder': 'Search bookings by customer or vehicle...',
    'bookings.loading': 'Loading bookings...',
    'bookings.no_bookings': 'No bookings found',
    'bookings.total': 'total bookings',
    'bookings.confirmed': 'Confirmed',
    'bookings.in_progress': 'In Progress',
    'bookings.completed': 'Completed',
    'bookings.cancelled': 'Cancelled',
    'bookings.no_show': 'No Show',

    // Inventory Management
    'inventory.add_item': '+ Add Item',
    'inventory.search_placeholder': 'Search items by name or category...',
    'inventory.loading': 'Loading inventory...',
    'inventory.no_items': 'No items found',
    'inventory.total': 'total items',
    'inventory.low_stock': 'Low Stock',
    'inventory.out_of_stock': 'Out of Stock',
    'inventory.in_stock': 'In Stock',

    // Invoice
    'invoice.title': 'Invoice',
    'invoice.back': '← Back to Service',
    'invoice.customer_name': 'Customer Name',
    'invoice.address': 'Address',
    'invoice.phone': 'Phone',
    'invoice.invoice_number': 'Invoice',
    'invoice.date': 'Date',
    'invoice.description': 'Description of Goods/Services',
    'invoice.quantity': 'Quantity',
    'invoice.unit_price': 'Unit Price',
    'invoice.amount': 'Amount',
    'invoice.subtotal': 'Subtotal',
    'invoice.vat': 'VAT 10%',
    'invoice.total': 'Total (including VAT 10% in USD)',
    'invoice.notes': 'Note',
    'invoice.plate_number': 'Plate No',
    'invoice.model': 'Model',
    'invoice.vin': 'VIN No',
    'invoice.kilometers': 'Kilometers',
    'invoice.customer_signature': "Customer's Signature & Name",
    'invoice.seller_signature': "Seller's Signature & Name",
    'invoice.no_items': 'No service items found',
    'invoice.download_pdf': 'Download PDF',
    'invoice.print': 'Print',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.view': 'View',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.clear': 'Clear',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.success': 'Success',
    'common.failed': 'Failed',
    'common.required': 'Required',
    'common.optional': 'Optional',

    // Support
    'support.title': 'Support',
    'support.contact': 'Contact our team:',
    'support.telegram': 'Telegram: @CG_RITHY',
    'support.website': 'Website: cghub.dev',

    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.subtitle': "Here's what's happening with your business today.",
    'dashboard.refresh': 'Refresh',
    'dashboard.refreshing': 'Refreshing...',
    'dashboard.total_revenue': 'Total Revenue',
    'dashboard.total_customers': 'Total Customers',
    'dashboard.active_services': 'Active Services',
    'dashboard.pending_bookings': 'Pending Bookings',
    'dashboard.recent_services': 'Recent Services',
    'dashboard.recent_alerts': 'Recent Alerts',
    'dashboard.quick_actions': 'Quick Actions',
    'dashboard.no_services': 'No recent services',
    'dashboard.no_alerts': 'No active alerts',
    'dashboard.view_all_services': 'View All Services',
    'dashboard.view_all_alerts': 'View All Alerts',
    'dashboard.new_service': 'New Service',
    'dashboard.new_booking': 'New Booking',
    'dashboard.new_customer': 'New Customer',
    'dashboard.add_inventory': 'Add Inventory',
    'dashboard.error_loading': 'Error Loading Dashboard',
    'dashboard.try_again': 'Try Again',
    'dashboard.from_last_month': 'from last month',
    'dashboard.new_this_month': 'new this month',
    'dashboard.completed_today': 'completed today',
    'dashboard.scheduled_today': 'scheduled today',
    'dashboard.latest_activities': 'Latest service activities in your system',
    'dashboard.important_notifications': 'Important notifications and alerts',
    'dashboard.common_tasks': 'Common tasks and shortcuts',

    // Company
    'company.name': 'GTV Motor',
    'company.tagline': 'After Sales Management System',
    'company.brand': 'First-ever Cambodian-Owned Brand',
  },
  km: {
    // Navigation
    'nav.dashboard': 'ផ្ទាំងគ្រប់គ្រង',
    'nav.customers': 'អតិថិជន',
    'nav.services': 'សេវាកម្ម',
    'nav.bookings': 'ការកក់',
    'nav.inventory': 'ស្តុកទំនិញ',
    'nav.warranty': 'ធានាការ',
    'nav.alerts': 'ការជូនដំណឹង',
    'nav.followups': 'ការតាមដាន',
    'nav.reports': 'របាយការណ៍',
    'nav.analytics': 'ការវិភាគ',
    'nav.settings': 'ការកំណត់',
    'nav.logout': 'ចេញ',

    // Service Management
    'services.title': 'ការគ្រប់គ្រងសេវាកម្ម',
    'services.new': 'សេវាកម្មថ្មី',
    'services.search': 'ស្វែងរកតាមអតិថិជន វិក្កយបត្រ ឬយានយន្ត...',
    'services.status.all': 'ស្ថានភាពទាំងអស់',
    'services.status.completed': 'បានបញ្ចប់',
    'services.status.in_progress': 'កំពុងដំណើរការ',
    'services.status.pending': 'រង់ចាំ',
    'services.payment.paid': 'បានបង់',
    'services.payment.pending': 'រង់ចាំ',
    'services.payment.cancelled': 'បានលុបចោល',
    'services.customer': 'អតិថិជន',
    'services.vehicle': 'យានយន្ត',
    'services.date': 'កាលបរិច្ឆេទ',
    'services.type': 'ប្រភេទសេវាកម្ម',
    'services.amount': 'ចំនួនទឹកប្រាក់',
    'services.payment': 'ការបង់ប្រាក់',
    'services.technician': 'អ្នកបច្ចេកទេស',
    'services.notes': 'កំណត់សម្គាល់',
    'services.view_details': 'មើលលម្អិត',
    'services.invoice': 'វិក្កយបត្រ',
    'services.payment_change': 'បង់ប្រាក់',
    'services.no_services': 'រកមិនឃើញសេវាកម្ម',
    'services.loading': 'កំពុងផ្ទុកសេវាកម្ម...',
    'services.total': 'សេវាកម្មសរុប',
    'services.filter_status': 'តម្រងតាមស្ថានភាព',

    // Customer Management
    'customers.add': '+ បន្ថែមអតិថិជន',
    'customers.search_placeholder': 'ស្វែងរកអតិថិជនតាមឈ្មោះ ទូរស័ព្ទ ឬស្លាកលេខ...',
    'customers.loading': 'កំពុងផ្ទុកអតិថិជន...',
    'customers.no_customers': 'រកមិនឃើញអតិថិជន',
    'customers.total': 'អតិថិជនសរុប',
    'customers.page': 'ទំព័រ',
    'customers.of': 'នៃ',
    'customers.customer_overview': 'ទិដ្ឋភាពអតិថិជន',
    'customers.contact_info': 'ព័ត៌មានទំនាក់ទំនង',
    'customers.vehicles': 'យានយន្ត',
    'customers.recent_services': 'ប្រវត្តិសេវាកម្មថ្មីៗ',
    'customers.active_alerts': 'ការជូនដំណឹងសកម្ម',
    'customers.name': 'ឈ្មោះអតិថិជន',
    'customers.phone': 'លេខទូរស័ព្ទ',
    'customers.email': 'អ៊ីមែល',
    'customers.address': 'អាសយដ្ឋាន',

    // Booking Management
    'bookings.new': 'ការកក់ថ្មី',
    'bookings.search_placeholder': 'ស្វែងរកការកក់តាមអតិថិជន ឬយានយន្ត...',
    'bookings.loading': 'កំពុងផ្ទុកការកក់...',
    'bookings.no_bookings': 'រកមិនឃើញការកក់',
    'bookings.total': 'ការកក់សរុប',
    'bookings.confirmed': 'បានបញ្ជាក់',
    'bookings.in_progress': 'កំពុងដំណើរការ',
    'bookings.completed': 'បានបញ្ចប់',
    'bookings.cancelled': 'បានលុបចោល',
    'bookings.no_show': 'មិនបានមក',

    // Inventory Management
    'inventory.add_item': '+ បន្ថែមទំនិញ',
    'inventory.search_placeholder': 'ស្វែងរកទំនិញតាមឈ្មោះ ឬប្រភេទ...',
    'inventory.loading': 'កំពុងផ្ទុកទំនិញ...',
    'inventory.no_items': 'រកមិនឃើញទំនិញ',
    'inventory.total': 'ទំនិញសរុប',
    'inventory.low_stock': 'ស្តុកទាប',
    'inventory.out_of_stock': 'អស់ស្តុក',
    'inventory.in_stock': 'មានស្តុក',

    // Invoice
    'invoice.title': 'វិក្កយបត្រ',
    'invoice.back': '← ត្រលប់ទៅសេវាកម្ម',
    'invoice.customer_name': 'ឈ្មោះអតិថិជន',
    'invoice.address': 'អាសយដ្ឋាន',
    'invoice.phone': 'លេខទូរស័ព្ទ',
    'invoice.invoice_number': 'លេខវិក្កយបត្រ',
    'invoice.date': 'កាលបរិច្ឆេទ',
    'invoice.description': 'បរិយាយមុខទំនិញ/សេវា',
    'invoice.quantity': 'បរិមាណ',
    'invoice.unit_price': 'តម្លៃឯកតា',
    'invoice.amount': 'ថ្លៃទំនិញ/សេវា',
    'invoice.subtotal': 'សរុបរង',
    'invoice.vat': 'ពន្ធលើតម្លៃបន្ថែម ១០%',
    'invoice.total': 'សរុប (រួមបញ្ចូលពន្ធលើតម្លៃបន្ថែម ១០% ជាដុល្លារ)',
    'invoice.notes': 'កំណត់សម្គាល់',
    'invoice.plate_number': 'ស្លាកលេខ',
    'invoice.model': 'ម៉ាករថយន្ត',
    'invoice.vin': 'លេខតួរថយន្ត',
    'invoice.kilometers': 'គីឡូម៉ែត្រ',
    'invoice.customer_signature': 'ហត្ថលេខា និងឈ្មោះអ្នកទិញ',
    'invoice.seller_signature': 'ហត្ថលេខា និងឈ្មោះអ្នកលក់',
    'invoice.no_items': 'រកមិនឃើញធាតុសេវាកម្ម',
    'invoice.download_pdf': 'ទាញយក PDF',
    'invoice.print': 'បោះពុម្ព',

    // Common
    'common.loading': 'កំពុងផ្ទុក...',
    'common.error': 'កំហុស',
    'common.save': 'រក្សាទុក',
    'common.cancel': 'បោះបង់',
    'common.edit': 'កែសម្រួល',
    'common.delete': 'លុប',
    'common.view': 'មើល',
    'common.add': 'បន្ថែម',
    'common.search': 'ស្វែងរក',
    'common.filter': 'តម្រង',
    'common.clear': 'សម្អាត',
    'common.yes': 'បាទ',
    'common.no': 'ទេ',
    'common.close': 'បិទ',
    'common.confirm': 'បញ្ជាក់',
    'common.success': 'ជោគជ័យ',
    'common.failed': 'បរាជ័យ',
    'common.required': 'ចាំបាច់',
    'common.optional': 'ជម្រើស',
    'common.page': 'ទំព័រ',
    'common.of': 'នៃ',
    'common.profile': 'ប្រវត្តិរូប',
    'common.service_not_found': 'រកមិនឃើញសេវាកម្ម',
    'common.confirm_logout': 'តើអ្នកប្រាកដថាចង់ចេញពីគណនីមែនទេ?',
    'common.logout_description': 'អ្នកនឹងត្រូវបានចេញពីគណនីហើយត្រលប់ទៅទំព័រចូល។',

    // Support
    'support.title': 'ជំនួយ',
    'support.contact': 'ទាក់ទងក្រុមការងាររបស់យើង:',
    'support.telegram': 'Telegram: @CG_RITHY',
    'support.website': 'គេហទំព័រ: cghub.dev',

    // Dashboard
    'dashboard.welcome': 'សូមស្វាគមន៍',
    'dashboard.subtitle': 'នេះគឺជាអ្វីដែលកំពុងកើតឡើងជាមួយអាជីវកម្មរបស់អ្នកថ្ងៃនេះ។',
    'dashboard.refresh': 'ផ្ទុកឡើងវិញ',
    'dashboard.refreshing': 'កំពុងផ្ទុកឡើងវិញ...',
    'dashboard.total_revenue': 'ចំណូលសរុប',
    'dashboard.total_customers': 'អតិថិជនសរុប',
    'dashboard.active_services': 'សេវាកម្មសកម្ម',
    'dashboard.pending_bookings': 'ការកក់រង់ចាំ',
    'dashboard.recent_services': 'សេវាកម្មថ្មីៗ',
    'dashboard.recent_alerts': 'ការជូនដំណឹងថ្មីៗ',
    'dashboard.quick_actions': 'សកម្មភាពរហាត់',
    'dashboard.no_services': 'គ្មានសេវាកម្មថ្មីៗ',
    'dashboard.no_alerts': 'គ្មានការជូនដំណឹងសកម្ម',
    'dashboard.view_all_services': 'មើលសេវាកម្មទាំងអស់',
    'dashboard.view_all_alerts': 'មើលការជូនដំណឹងទាំងអស់',
    'dashboard.new_service': 'សេវាកម្មថ្មី',
    'dashboard.new_booking': 'ការកក់ថ្មី',
    'dashboard.new_customer': 'អតិថិជនថ្មី',
    'dashboard.add_inventory': 'បន្ថែមស្តុកទំនិញ',
    'dashboard.error_loading': 'កំហុសក្នុងការផ្ទុកផ្ទាំងគ្រប់គ្រង',
    'dashboard.try_again': 'ព្យាយាមម្តងទៀត',
    'dashboard.from_last_month': 'ពីខែមុន',
    'dashboard.new_this_month': 'ថ្មីក្នុងខែនេះ',
    'dashboard.completed_today': 'បានបញ្ចប់ថ្ងៃនេះ',
    'dashboard.scheduled_today': 'បានកាន់កាប់ថ្ងៃនេះ',
    'dashboard.latest_activities': 'សកម្មភាពសេវាកម្មចុងក្រោយក្នុងប្រព័ន្ធរបស់អ្នក',
    'dashboard.important_notifications': 'ការជូនដំណឹង និងការជូនដំណឹងសំខាន់',
    'dashboard.common_tasks': 'ភារកិច្ច និងផ្លូវកាត់ធម្មតា',

    // Company
    'company.name': 'GTV Motor',
    'company.tagline': 'ប្រព័ន្ធគ្រប់គ្រងក្រោយលក់',
    'company.brand': 'ម៉ាកដំបូងគេដែលជាកម្មសិទ្ធិខ្មែរ',
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  // Load saved language preference
  useEffect(() => {
    setMounted(true)
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'km')) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Save language preference
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    if (mounted) {
      localStorage.setItem('language', lang)
    }
  }

  // Translation function
  const t = (key: string, fallback?: string): string => {
    // First try direct key access (flat structure)
    let value = (translations[language] as any)?.[key]

    // If not found, try nested access (for backward compatibility)
    if (!value) {
      const keys = key.split('.')
      let nestedValue: any = translations[language]

      for (const k of keys) {
        nestedValue = nestedValue?.[k]
      }
      value = nestedValue
    }

    return value || fallback || key
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
