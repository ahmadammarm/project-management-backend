import { Router } from 'express';
import { AddMemberToProject, CreateProject, UpdateProject } from '../controllers/ProjectController.js';

const projectRouter = Router();

projectRouter.post('/', CreateProject);
projectRouter.put('/:projectId', UpdateProject);
projectRouter.post('/:projectId/addMember', AddMemberToProject);

export default projectRouter;