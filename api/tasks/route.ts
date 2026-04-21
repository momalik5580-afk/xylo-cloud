import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Priority, TaskType, LocationType } from "@prisma/client"

// GET all tasks - returns active/running tasks for the dashboard
export async function GET() {
  try {
    const tasks = await prisma.tasks.findMany({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS", "READY", "URGENT"] }, // Fixed: valid TaskStatus values
      },
      take: 50,
      orderBy: [
        { priority: "desc" },
        { created_at: "desc" },
      ],
      include: {
        departments: true,
        users_tasks_assigned_to_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
          },
        },
      },
    })

    // Transform for frontend (keep camelCase for frontend)
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      status: task.status,
      location: task.location,
      locationType: task.location_type,
      departmentId: task.department_id,
      department: task.departments,
      assignedToId: task.assigned_to_id,
      assignedTo: task.users_tasks_assigned_to_idTousers ? {
        id: task.users_tasks_assigned_to_idTousers.id,
        firstName: task.users_tasks_assigned_to_idTousers.first_name,
        lastName: task.users_tasks_assigned_to_idTousers.last_name,
        avatar: task.users_tasks_assigned_to_idTousers.avatar,
      } : null,
      createdById: task.created_by_id,
      createdBy: null,
      isVip: task.is_vip,
      escalationLevel: task.escalation_level,
      slaBreached: task.sla_breached,
      dueAt: task.due_at,
      startedAt: task.started_at,
      completedAt: task.completed_at,
      createdAt: task.created_at,
      hotelId: task.hotel_id
    }))

    return NextResponse.json({ tasks: formattedTasks })
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

// POST create new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      type,
      priority,
      location,
      locationType,
      departmentId,
      assignedToId,
      createdById,
      slaConfigId,
      isVip,
      dueAt,
      hotelId
    } = body

    // Validate required fields
    if (!title || !departmentId || !createdById) {
      return NextResponse.json(
        { error: "Missing required fields: title, departmentId, createdById" },
        { status: 400 }
      )
    }

    const task = await prisma.tasks.create({
      data: {
        title,
        description: description || "",
        type: (type as TaskType) || "SERVICE",
        priority: (priority as Priority) || "MEDIUM",
        status: "OPEN",
        location: location || "",
        location_type: (locationType as LocationType) || "ROOM",
        department_id: departmentId,
        assigned_to_id: assignedToId || null,
        created_by_id: createdById,
        sla_config_id: slaConfigId || null,
        is_vip: isVip || false,
        escalation_level: 0,
        sla_breached: false,
        due_at: dueAt ? new Date(dueAt) : null,
        hotel_id: hotelId || null,
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        departments: true,
        users_tasks_assigned_to_idTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
          },
        },
      },
    })

    // Create notification for assigned user
    if (assignedToId) {
      await prisma.notifications.create({
        data: {
          user_id: assignedToId,
          title: "New Task Assigned",
          message: `You have been assigned to: ${title}`,
          type: "INFO",
          read: false,
          created_at: new Date()
        },
      })
    }

    // Transform for response
    const formattedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      status: task.status,
      location: task.location,
      locationType: task.location_type,
      departmentId: task.department_id,
      department: task.departments,
      assignedToId: task.assigned_to_id,
      assignedTo: task.users_tasks_assigned_to_idTousers ? {
        id: task.users_tasks_assigned_to_idTousers.id,
        firstName: task.users_tasks_assigned_to_idTousers.first_name,
        lastName: task.users_tasks_assigned_to_idTousers.last_name,
        avatar: task.users_tasks_assigned_to_idTousers.avatar,
      } : null,
      createdById: task.created_by_id,
      isVip: task.is_vip,
      escalationLevel: task.escalation_level,
      slaBreached: task.sla_breached,
      dueAt: task.due_at,
      createdAt: task.created_at,
      hotelId: task.hotel_id
    }

    return NextResponse.json({ task: formattedTask }, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}