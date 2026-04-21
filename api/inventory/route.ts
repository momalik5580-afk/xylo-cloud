import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // FIXED: inventory_items instead of inventoryItem
    const inventoryAlerts = await prisma.inventory_items.findMany({
      where: {
        alert_status: { in: ["LOW_STOCK", "CRITICAL", "OUT_OF_STOCK"] }, // FIXED: snake_case
      },
      include: { 
        departments: true 
      },
      take: 5,
    })

    // Transform snake_case to camelCase for frontend
    const formattedAlerts = inventoryAlerts.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      departmentId: item.department_id,
      department: item.departments,
      unit: item.unit,
      quantity: item.quantity,
      minimumQuantity: item.minimum_quantity,
      alertStatus: item.alert_status,
      lastRestockedAt: item.last_restocked_at,
      isActive: item.is_active
    }))

    return NextResponse.json({ inventoryAlerts: formattedAlerts })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
}

// Optional: Add POST endpoint to create inventory items
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const item = await prisma.inventory_items.create({
      data: {
        name: body.name,
        sku: body.sku,
        category: body.category,
        department_id: body.departmentId,
        unit: body.unit || 'unit',
        quantity: body.quantity || 0,
        minimum_quantity: body.minimumQuantity || 0,
        alert_status: body.alertStatus || 'OK',
        is_active: true,
        last_restocked_at: new Date()
      },
      include: { departments: true }
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error("Error creating inventory item:", error)
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 })
  }
}