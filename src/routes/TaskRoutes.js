import { Router } from "express";
import { CreateTask, DeleteTask, UpdateTask } from "../controllers/TaskController.js";

const taskRouter = Router();

taskRouter.post("/", CreateTask);
taskRouter.put("/:id", UpdateTask);
taskRouter.post("/delete", DeleteTask);

export default taskRouter;