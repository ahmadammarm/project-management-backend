import prisma from '../lib/prisma.js';

export const GetUserWorkspaces = async (req, res) => {
  try {
    const auth = req.auth();
    if (!auth?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = auth;

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        owner: true,
        members: {
          include: { user: true },
        },
        projects: {
          include: {
            members: {
              include: { user: true },
            },
            tasks: {
              include: {
                assignee: true,
                comments: {
                  include: { user: true },
                },
              },
            },
          },
        },
      },
    });

    return res.status(200).json({ workspaces });
  } catch (error) {
    console.error('Error fetching user workspaces:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


export const AddMemberToWorkspace = async (req, res) => {
  try {
    const auth = req.auth();
    if (!auth?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = auth;
    const { email, role, workspaceId, message } = req.body;

    if (!email || !role || !workspaceId) {
      return res.status(400).json({
        error: 'email, role, and workspaceId are required',
      });
    }

    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // 🔐 Authorization check
    const isAdmin = workspace.members.some(
      member => member.userId === userId && member.role === 'ADMIN',
    );

    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: 'Only admins can add members to the workspace' });
    }

    const existingMember = workspace.members.find(
      member => member.userId === user.id,
    );

    if (existingMember) {
      return res
        .status(400)
        .json({ error: 'User is already a member of the workspace' });
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role,
        addedBy: userId,
        message: message || null,
      },
    });

    return res.status(201).json({
      newMember,
      message: 'Member added successfully',
    });
  } catch (error) {
    console.error('Error adding member to workspace:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
