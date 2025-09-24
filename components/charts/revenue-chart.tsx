"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RevenueData {
  month: string
  revenue: number
  services: number
}

interface RevenueChartProps {
  data: RevenueData[]
  title?: string
  description?: string
}

export default function RevenueChart({
  data,
  title = "Revenue Chart",
  description = "Monthly revenue overview",
}: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-12 text-sm font-medium">{item.month}</div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>${item.revenue.toLocaleString()}</span>
                  <span className="text-gray-500">{item.services} services</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
