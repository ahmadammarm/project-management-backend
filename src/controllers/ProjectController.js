import prisma from '../lib/prisma.js';

export const CreateProject = async (req, res) => {
  try {
    const {userId} = await req.auth();
    const {
      workspaceId,
      name,
      description,
      status,
      start_date,
      end_date,
      team_members = [],
      team_lead,
      progress = 0,
      priority = 'MEDIUM',
    } = req.body;

    if (!workspaceId) {
      return res.status(400).json({message: 'workspaceId is required'});
    }

    if (!name) {
      return res.status(400).json({message: 'Project name is required'});
    }

    const workspace = await prisma.workspace.findUnique({
      where: {id: workspaceId},
      include: {
        members: {include: {user: true}},
      },
    });

    if (!workspace) {
      return res.status(404).json({message: 'Workspace not found'});
    }

    const isAdmin = workspace.members.some(
      m => m.userId === userId && m.role === 'ADMIN',
    );

    if (!isAdmin) {
      return res.status(403).json({message: 'Forbidden'});
    }

    let teamLeadId = null;

    if (team_lead) {
      const teamLead = await prisma.user.findUnique({
        where: {email: team_lead},
        select: {id: true},
      });

      if (!teamLead) {
        return res.status(404).json({message: 'Team lead not found'});
      }

      teamLeadId = teamLead.id;
    }

    const newProject = await prisma.project.create({
      data: {
        workspaceId,
        name,
        description,
        status,
        priority,
        progress,
        team_lead: teamLeadId,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      },
    });

    if (team_members.length > 0) {
      const membersToAdd = workspace.members
        .filter(m => team_members.includes(m.user.email))
        .map(m => ({
          projectId: newProject.id,
          userId: m.user.id,
        }));

      if (membersToAdd.length > 0) {
        await prisma.projectMember.createMany({
          data: membersToAdd,
          skipDuplicates: true,
        });
      }
    }

    const projectWithMembers = await prisma.project.findUnique({
      where: {id: newProject.id},
      include: {
        members: {include: {user: true}},
        owner: true,
      },
    });

    return res.status(201).json({
      project: projectWithMembers,
      message: 'Project created successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: 'Internal Server Error'});
  }
};

export const UpdateProject = async (req, res) => {
  try {
    const {userId} = await req.auth();
    const {
      id,
      workspaceId,
      name,
      description,
      status,
      start_date,
      end_date,
      progress,
      priority,
    } = req.body;

    if (!id || !workspaceId) {
      return res.status(400).json({message: 'id and workspaceId are required'});
    }

    const workspace = await prisma.workspace.findUnique({
      where: {id: workspaceId},
      include: {members: true},
    });

    if (!workspace) {
      return res.status(404).json({message: 'Workspace not found'});
    }

    const isAdmin = workspace.members.some(
      m => m.userId === userId && m.role === 'ADMIN',
    );

    const project = await prisma.project.findUnique({where: {id}});

    if (!project) {
      return res.status(404).json({message: 'Project not found'});
    }

    if (!isAdmin && project.team_lead !== userId) {
      return res.status(403).json({message: 'Forbidden'});
    }

    const updatedProject = await prisma.project.update({
      where: {id},
      data: {
        name,
        description,
        status,
        priority,
        progress,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      },
    });

    return res.status(200).json({
      project: updatedProject,
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: 'Internal Server Error'});
  }
};
export const AddMemberToProject = async (req, res) => {
  try {
    const {userId} = await req.auth();
    const {projectId} = req.params;
    const {email} = req.body;

    if (!projectId || !email) {
      return res
        .status(400)
        .json({message: 'projectId and email are required'});
    }

    const project = await prisma.project.findUnique({
      where: {id: projectId},
      include: {
        members: {include: {user: true}},
        workspace: true,
      },
    });

    if (!project) {
      return res.status(404).json({message: 'Project not found'});
    }

    if (project.team_lead !== userId) {
      return res.status(403).json({message: 'Forbidden'});
    }

    const alreadyMember = project.members.some(m => m.user.email === email);

    if (alreadyMember) {
      return res.status(409).json({message: 'User already in project'});
    }

    const user = await prisma.user.findUnique({where: {email}});

    if (!user) {
      return res.status(404).json({message: 'User not found'});
    }

    const member = await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId,
      },
    });

    return res.status(201).json({
      member,
      message: 'Member added successfully',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: 'Internal Server Error'});
  }
};
