import { Router } from "express";
import { AddComment, GetTaskComments } from "../controllers/CommentController.js";

const commentRouter = Router();

commentRouter.post('/', AddComment);
commentRouter.get('/:taskId', GetTaskComments);

export default commentRouter;