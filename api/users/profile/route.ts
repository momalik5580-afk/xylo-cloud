import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/jwt"

// GET current user profile
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
        id:            true,
        first_name:    true,
        last_name:     true,
        email:         true,
        avatar:        true,
        phone:         true,
        created_at:    true,
        department_id: true,
        role_id:       true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const formattedUser = {
      id:         user.id,
      firstName:  user.first_name,
      lastName:   user.last_name,
      email:      user.email,
      avatar:     user.avatar,
      phone:      user.phone,
      createdAt:  user.created_at,
      department: user.department_id,
      role:       user.role_id,
    }

    return NextResponse.json({ user: formattedUser })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

// PATCH update profile info (firstName, lastName, email)
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

    if (!firstName && !lastName && !email && !phone) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    const updateData: Record<string, string | Date> = {}
    if (firstName) updateData.first_name = firstName
    if (lastName)  updateData.last_name  = lastName
    if (email)     updateData.email      = email
    if (phone)     updateData.phone      = phone
    updateData.updated_at = new Date()

    const user = await prisma.users.update({
      where: { id: payload.userId },
      data:  updateData,
      select: {
        id:         true,
        first_name: true,
        last_name:  true,
        email:      true,
        avatar:     true,
        phone:      true,
      },
    })

    const formattedUser = {
      id:        user.id,
      firstName: user.first_name,
      lastName:  user.last_name,
      email:     user.email,
      avatar:    user.avatar,
      phone:     user.phone,
    }

    return NextResponse.json({ user: formattedUser })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}