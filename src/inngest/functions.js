import {inngest} from './client.js';
import prisma from '../lib/prisma.js';

// user management functions
const syncUserCreation = inngest.createFunction(
  {id: 'sync-user-from-clerk'},
  {event: 'clerk/user.created'},
  async ({event}) => {
    const {data} = event;
    await prisma.user.create({
      data: {
        id: data.id,
        email: data?.email_addresses[0]?.email_address,
        name: data?.first_name + ' ' + data?.last_name,
        image: data?._image_url,
      },
    });
  },
);

const syncUserDeletion = inngest.createFunction(
  {id: 'sync-user-deletion-from-clerk'},
  {event: 'clerk/user.deleted'},
  async ({event}) => {
    const {data} = event;
    await prisma.user.delete({
      where: {
        id: data.id,
      },
    });
  },
);

const syncUserUpdate = inngest.createFunction(
  {id: 'sync-user-update-from-clerk'},
  {event: 'clerk/user.updated'},
  async ({event}) => {
    const {data} = event;
    await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        email: data?.email_addresses[0]?.email_address,
        name: data?.first_name + ' ' + data?.last_name,
        image: data?._image_url,
      },
    });
  },
);

// workspace management functions
const syncWorkspaceCreation = inngest.createFunction(
  {id: 'sync-workspace-from-clerk'},
  {event: 'clerk/organization.created'},
  async ({event}) => {
    const {data} = event;
    await prisma.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url,
      },
    });

    // add the creator as an admin member
    await prisma.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: 'ADMIN',
      },
    });
  },
);

const syncWorkspaceUpdate = inngest.createFunction(
  {id: 'sync-workspace-update-from-clerk'},
  {event: 'clerk/organization.updated'},
  async ({event}) => {
    const {data} = event;
    await prisma.workspace.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url,
      },
    });
  },
);

const syncWorkspaceDeletion = inngest.createFunction(
  {id: 'sync-workspace-deletion-from-clerk'},
  {event: 'clerk/organization.deleted'},
  async ({event}) => {
    const {data} = event;
    await prisma.workspace.delete({
      where: {
        id: data.id,
      },
    });
  },
);

const syncSaveMemberToWorkspace = inngest.createFunction(
  {id: 'sync-workspace-member-from-clerk'},
  {event: 'clerk/organizationInvitation.accepted'},
  async ({event}) => {
    const {data} = event;
    await prisma.workspaceMember.create({
      data: {
        userId: data.user_id,
        workspaceId: data.organization_id,
        role: String(data.role_name).toUpperCase(),
      },
    });
  },
);

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdate,
  syncWorkspaceCreation,
  syncWorkspaceUpdate,
  syncWorkspaceDeletion,
  syncSaveMemberToWorkspace,
];
