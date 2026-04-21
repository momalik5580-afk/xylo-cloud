import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Priority, TaskStatus } from "@prisma/client"

// GET single task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.tasks.findUnique({
      where: { id: params.id },
      include: {
        departments: true, // FIXED: relation name
        users_tasks_assigned_to_idTousers: {  // FIXED: relation name
          select: {
            id: true,
            first_name: true, 
            last_name: true,  
            email: true,
            avatar: true,
          },
        },
        users_tasks_created_by_idTousers: {  // FIXED: relation name
          select: {
            id: true,
            first_name: true,  
            last_name: true,   
          },
        },
        sla_configs: true,  // FIXED: relation name
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Transform for frontend
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
      department: task.departments, // FIXED: mapping to frontend structure
      assignedToId: task.assigned_to_id,
      assignedTo: task.users_tasks_assigned_to_idTousers ? {
        id: task.users_tasks_assigned_to_idTousers.id,
        firstName: task.users_tasks_assigned_to_idTousers.first_name,
        lastName: task.users_tasks_assigned_to_idTousers.last_name,
        email: task.users_tasks_assigned_to_idTousers.email,
        avatar: task.users_tasks_assigned_to_idTousers.avatar,
      } : null,
      createdById: task.created_by_id,
      createdBy: task.users_tasks_created_by_idTousers ? {
        id: task.users_tasks_created_by_idTousers.id,
        firstName: task.users_tasks_created_by_idTousers.first_name,
        lastName: task.users_tasks_created_by_idTousers.last_name,
      } : null,
      slaConfigId: task.sla_config_id,
      slaConfig: task.sla_configs, // FIXED: mapping to frontend structure
      isVip: task.is_vip,
      escalationLevel: task.escalation_level,
      slaBreached: task.sla_breached,
      dueAt: task.due_at,
      startedAt: task.started_at,
      completedAt: task.completed_at,
      closedAt: task.closed_at,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      hotelId: task.hotel_id
    }

    return NextResponse.json({ task: formattedTask })
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    )
  }
}

// PATCH update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, priority, assignedToId, title, description, location, locationType, completedAt } = body

    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    }

    if (status) updateData.status = status as TaskStatus
    if (priority) updateData.priority = priority as Priority
    if (assignedToId !== undefined) updateData.assigned_to_id = assignedToId 
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (location !== undefined) updateData.location = location
    if (locationType) updateData.location_type = locationType 
    if (completedAt) updateData.completed_at = new Date(completedAt) 

    // If status is CLOSED, set closed_at
    if (status === "CLOSED") {
      updateData.closed_at = new Date()
    }

    const task = await prisma.tasks.update({
      where: { id: params.id },
      data: updateData,
      include: {
        departments: true, // FIXED: relation name
        users_tasks_assigned_to_idTousers: {  // FIXED: relation name
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    // Create notification for status change
    if (status) {
      await prisma.notifications.create({
        data: {
          user_id: task.assigned_to_id || task.created_by_id,
          title: "Task Updated",
          message: `Task "${task.title}" status changed to ${status}`,
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
      department: task.departments, // FIXED: mapping to frontend structure
      assignedToId: task.assigned_to_id,
      assignedTo: task.users_tasks_assigned_to_idTousers ? {
        id: task.users_tasks_assigned_to_idTousers.id,
        firstName: task.users_tasks_assigned_to_idTousers.first_name,
        lastName: task.users_tasks_assigned_to_idTousers.last_name,
        email: task.users_tasks_assigned_to_idTousers.email,
        avatar: task.users_tasks_assigned_to_idTousers.avatar,
      } : null,
      createdById: task.created_by_id,
      isVip: task.is_vip,
      escalationLevel: task.escalation_level,
      slaBreached: task.sla_breached,
      dueAt: task.due_at,
      startedAt: task.started_at,
      completedAt: task.completed_at,
      closedAt: task.closed_at,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      hotelId: task.hotel_id
    }

    return NextResponse.json({ task: formattedTask })
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    )
  }
}

// DELETE task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.tasks.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    )
  }
}