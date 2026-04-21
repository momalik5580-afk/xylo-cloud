import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all staff users (for reassignment)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get("departmentId")
    const role = searchParams.get("role")

    // FIXED: users (plural) instead of user
    const users = await prisma.users.findMany({
      where: {
        is_active: true,  // FIXED: snake_case
        ...(departmentId && { department_id: departmentId }), // FIXED: snake_case
        ...(role && {
          role: {
            name: role,
          },
        }),
      },
      select: {
        id: true,
        first_name: true,  // FIXED: snake_case
        last_name: true,   // FIXED: snake_case
        email: true,
        avatar: true,
        department_id: true,  // FIXED: snake_case
        departments_departments_head_idTousers: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        roles: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
      orderBy: { first_name: "asc" },  // FIXED: snake_case
    })

    // Transform for frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      avatar: user.avatar,
      departmentId: user.department_id,
      department: user.departments_departments_head_idTousers,
      role: user.roles
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}