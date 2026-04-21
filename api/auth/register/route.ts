import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body // Extracting the plain password from PowerShell

    // 1. Turn "Admin123" into a secure hash for the "password_hash" column
    const hashedPassword = await bcrypt.hash(password, 10)

    // 2. Optional: Delete old user to avoid "Unique constraint" errors during testing
    await prisma.users.deleteMany({
      where: { email: email }
    })

    // 3. Create the user with the EXACT field names from your schema.prisma
    const user = await prisma.users.create({
      data: {
        email: email,             // Stores "gm@xylo.com"
        password_hash: hashedPassword, // Stores the secure hashed string
        first_name: "General",
        last_name: "Manager",
        is_active: true,
        is_vip: false,            // Added because your schema has this field
        // If these IDs are required by your DB constraints, uncomment and use real IDs:
        // hotel_id: "your-hotel-uuid", 
        // role_id: "your-role-uuid",
      }
    })

    return NextResponse.json({ success: true, message: "GM User created successfully!" })
  } catch (error: any) {
    console.error("❌ DATABASE REJECTED THIS:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}