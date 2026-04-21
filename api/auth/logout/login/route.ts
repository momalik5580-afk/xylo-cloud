import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateToken } from "@/lib/jwt"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        roles: true,
        departments_users_department_idTodepartments: true,
        hotels: true,
      }
    })

    if (!user || !user.is_active) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.roles?.name || 'STAFF',
      hotel_id: user.hotel_id ?? undefined,
    })

    const response = NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id,
        email: user.email, 
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.roles?.name || 'STAFF',
        departmentId: user.department_id,
        avatar: user.avatar
      },
      token
    })
    
    response.cookies.set("xylo-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login Error:", error)
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}