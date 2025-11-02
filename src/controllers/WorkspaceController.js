import {prisma} from '../lib/prisma';

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
