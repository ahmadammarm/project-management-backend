import { Router } from 'express';
import { AddMemberToProject, CreateProject, UpdateProject } from '../controllers/ProjectController.js';

const projectRouter = Router();

projectRouter.post('/', CreateProject);
projectRouter.put('/', UpdateProject);
projectRouter.post('/:projectId/addMember', AddMemberToProject);

export default projectRouter;