"use server"

import { revalidatePath } from "next/cache"

import { shouldUseDemoData } from "@/lib/env"
import { getCurrentProfile } from "@/services/auth"
import {
  BoardMutationError,
  createBoardItem,
  moveBoardItem,
} from "@/services/board"
import type { BoardStatus } from "@/lib/data/product-seed"
import type { Priority } from "@/types/qa"

export interface BoardActionResult {
  status: "success" | "error"
  message?: string
}

function mapError(error: unknown): BoardActionResult {
  if (error instanceof BoardMutationError)
    return { status: "error", message: error.message }
  console.error("board action failed", error)
  return {
    status: "error",
    message: "Unable to update the QA board right now.",
  }
}

export async function moveBoardItemAction(
  id: string,
  status: BoardStatus
): Promise<BoardActionResult> {
  if (shouldUseDemoData())
    return { status: "error", message: "Demo mode uses local board state." }
  if (!(await getCurrentProfile()))
    return { status: "error", message: "You must be signed in." }
  try {
    await moveBoardItem(id, status)
    revalidatePath("/work")
    return { status: "success" }
  } catch (error) {
    return mapError(error)
  }
}

export async function createBoardItemAction(input: {
  title: string
  feature: string
  application: string
  priority: Priority
  assignee: string
  due: string
  scenarios: number
}): Promise<BoardActionResult> {
  if (shouldUseDemoData())
    return { status: "error", message: "Demo mode uses local board state." }
  if (!(await getCurrentProfile()))
    return { status: "error", message: "You must be signed in." }
  try {
    await createBoardItem(input)
    revalidatePath("/work")
    return { status: "success", message: "Work item added." }
  } catch (error) {
    return mapError(error)
  }
}
