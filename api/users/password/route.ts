import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/jwt"
import bcrypt from "bcryptjs"

// PATCH /api/users/password — change password for authenticated user
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
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "currentPassword and newPassword are required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // FIXED: users (plural) instead of user
    // FIXED: password_hash instead of password
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: { 
        id: true, 
        password_hash: true  // FIXED: field name
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash) // FIXED: field name
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      )
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // FIXED: users (plural) instead of user
    // FIXED: password_hash instead of password
    await prisma.users.update({
      where: { id: user.id },
      data: { 
        password_hash: hashedPassword,
        updated_at: new Date()  // Add timestamp
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    )
  }
}