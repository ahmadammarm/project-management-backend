import express from 'express';
import { AddMemberToWorkspace, GetUserWorkspaces } from '../controllers/WorkspaceController.js';

const workspaceRouter = express.Router();

workspaceRouter.get('/', GetUserWorkspaces);
workspaceRouter.post('/add-member', AddMemberToWorkspace);

export default workspaceRouter;