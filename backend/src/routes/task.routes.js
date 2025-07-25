import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { createTask, getTasks, updateTask, deleteTask } from "../controllers/task.controller.js";
import { validateTaskCreation, validateTaskUpdate } from "../middlewares/validation.js";

const router = Router();

router.post("/tasks", isAuthenticated, validateTaskCreation, createTask);
router.get("/tasks/get-tasks", isAuthenticated, getTasks);
router.put("/tasks/updat-tasks/:id", isAuthenticated, validateTaskUpdate, updateTask);
router.delete("/tasks/delete-tasks/:id", isAuthenticated, deleteTask);

export default router;
