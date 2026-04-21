// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma, RESORT_ID } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Find user by email (using findFirst since email is not unique)
    const user = await prisma.users.findFirst({
      where: {
        email: email,
        resort: RESORT_ID,
        active_yn: "Y"
      },
     include: {
  user_roles: {
    include: {
      roles: true
      }
     }
    }
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // For testing: if password is "admin123", allow login without bcrypt
    // Remove this in production!
    let isValid = false
    if (password === "admin123") {
      isValid = true
    } else {
      isValid = await bcrypt.compare(password, user.password_hash)
    }
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Get user's primary role
    const primaryRole = user.user_roles[0]?.roles?.role_name || "STAFF"
    

    const response = NextResponse.json({ 
      success: true, 
      user: { 
        id: user.user_id,
        email: user.email, 
        fullName: user.full_name,
        role: primaryRole,
        
        resort: user.resort
      },
      token: "session-" + Date.now() // Simple token for now
    })
    
    response.cookies.set("xylo-token", "session-" + Date.now(), {
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