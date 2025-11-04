import {prisma} from '../lib/prisma.js';

export const GetUserWorkspaces = async (request, response) => {
  try {
    const {userId} = request.auth;
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {include: {user: true}},
        projects: {
          include: {
            tasks: {
              include: {assignees: true, comments: {include: {user: true}}},
              members: {include: {user: true}},
            },
          },
        },
        owner: true,
      },
    });

    return response.status(200).json(workspaces);
  } catch (error) {
    console.error('Error fetching user workspaces:', error);
    return response.status(500).json({error: 'Internal Server Error'});
  }
};

export const AddMemberToWorkspace = async (request, response) => {
  try {
    const {userId} = request.auth;

    const {email, role, workspaceId, message} = request.body;

    const user = await prisma.user.findUnique({
      where: {email: email},
    });

    if (!user) {
      return response.status(404).json({error: 'User not found'});
    }

    if (!workspaceId || !role) {
      return response.status(400).json({error: 'Missing workspaceId or role'});
    }

    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return response.status(400).json({error: 'Invalid role specified'});
    }

    const workspace = await prisma.workspace.findUnique({
      where: {id: workspaceId},
      include: {members: true},
    });

    if (!workspace) {
      return response.status(404).json({error: 'Workspace not found'});
    }

    if(!workspace.members.find((member) => member.userId === userId && member.role === 'ADMIN')) {
      return response.status(403).json({error: 'Only admins can add members to the workspace'});
    }

    const existingMember = workspace.members.find(
      (member) => member.userId === user.id
    );

    if (existingMember) {
      return response.status(400).json({error: 'User is already a member of the workspace'});
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId: workspaceId,
        userId: user.id,
        role: role,
        addedBy: userId,
        message: message || null,
      },
    });

    return response.status(201).json({newMember, message: 'Member added successfully'});

  } catch (error) {
    console.error('Error adding member to workspace:', error);
    return response.status(500).json({error: 'Internal Server Error'});
  }
};
