import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/jwt"

// GET /api/users/me â€” returns current authenticated user
export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get("xylo-token")?.value ||
      request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)

    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        avatar: true,
        created_at: true,
        departments_departments_head_idTousers: {
          select: { name: true, code: true },
        },
        roles: {
          select: { name: true, level: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching current user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

// PATCH /api/users/me â€” update current user profile
export async function PATCH(request: NextRequest) {
  try {
    const token =
      request.cookies.get("xylo-token")?.value ||
      request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    const body = await request.json()
    const { firstName, lastName, email, phone } = body

    const updateData: Record<string, string> = {}
    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (email) updateData.email = email
    if (phone) updateData.phone = phone

    const user = await prisma.users.update({
      where: { id: payload.userId },
      data: updateData,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        avatar: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
