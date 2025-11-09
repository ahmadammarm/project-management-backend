import prisma from "../lib/prisma";

export const CreateProject = async (request, response) => {
    try {
        const { userId } = await request.auth();
        const { workspaceId, name, description, status, start_date, end_date, team_members, 
            team_lead, progress, priority
        } = request.body;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true }}}
        });

        if(!workspace) {
            return response.status(404).send({ message: 'Workspace not found' });
        }

        if(!workspace.members.some((member) => member.userId === userId && member.role === 'ADMIN')) {
            return response.status(403).send( { message: 'Forbidden: You do not have permission to create a project in this workspace' });
        }

        const teamLead = await prisma.user.findUnique({
            where: { email: team_lead },
            select: { id: true }
        });

        const newProject = await prisma.project.create({
            data: {
                workspaceId,
                name,
                description,
                status,
                priority,
                progress,
                team_lead: teamLead.id,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
            }
        });

        // add team members to project if they in the workspace
        if(team_members?.length > 0) {
            const membersToAdd = [];
            workspace.members.forEach((member) => {
                if(team_members.includes(member.user.email)) {
                    membersToAdd.push(member.user.id);
                }
            });

            await prisma.projectMember.createMany({
                data: membersToAdd.map((memberId) => ({
                    projectId: newProject.id,
                    userId: memberId
                }))
            });
        }

        const projectWithMembers = await prisma.project.findUnique({
            where: { id: newProject.id },
            include: { 
                members: { include: { user: true } }, 
                tasks: { 
                    include: { 
                        assignee: true, 
                        comments: { 
                            include: { 
                                user: true 
                            } 
                        } 
                    } 
                },
                owner: true
            }
        });

        return response.status(201).json({ project: projectWithMembers, message: 'Project created successfully' });


    } catch(error) {
        console.log(error || "Error to create a product")
        return response.status(500).send({ message: 'Internal Server Error' });
    }
}

export const UpdateProject = async (request, response) => {

    try {
        const { userId } = await request.auth();
        const { workspaceId, name, description, status, start_date, end_date,
             progress, priority
        } = request.body;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: { include: { user: true } } }
        });

        if(!workspace) {
            return response.status(404).send({ message: 'Workspace not found' });
        }

        if(!workspace.members.some((member) => member.userId === userId && member.role === 'ADMIN')) {
            
            const project = await prisma.project.findUnique({
                where: { id }
            });

            if(!project) {
                return response.status(404).send({ message: 'Project not found' });
            } else if(project.team_lead !== userId) {
                return response.status(403).send( { message: 'Forbidden: You do not have permission to update this project' });
            }
        }

        const project = await prisma.project.update({
            where: { id },
            data: {
                workspaceId,
                name,
                description,
                status,
                priority,
                progress,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
            }
        });

        return response.status(200).json({ project, message: 'Project updated successfully' });

    } catch(error) {
        console.log(error || "Error to update a product")
        return response.status(500).send({ message: 'Internal Server Error' });
    }
}

export const AddMemberToProject = async (request, response) => {
    try {
        
    } catch(error) {
        console.log(error || "Error to add member to a project")
        return response.status(500).send({ message: 'Internal Server Error' });
    }
}



