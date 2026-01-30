import {inngest} from './client.js';
import prisma from '../lib/prisma.js';
import SendEmail from '../lib/nodemailer.js';

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

    const ownerId = data.created_by ?? data.createdBy;
    if (!ownerId) {
      console.warn('Organization created without owner:', data.id);
      return;
    }

    await prisma.$transaction(async tx => {
      await tx.workspace.create({
        data: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          ownerId,
          image_url: data.image_url,
        },
      });

      await tx.workspaceMember.create({
        data: {
          userId: ownerId,
          workspaceId: data.id,
          role: 'ADMIN',
        },
      });
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

    if (!data.user_id || !data.organization_id) return;

    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: data.user_id,
          workspaceId: data.organization_id,
        },
      },
      update: {
        role: data.role === 'org:admin' ? 'ADMIN' : 'MEMBER',
      },
      create: {
        userId: data.user_id,
        workspaceId: data.organization_id,
        role: data.role === 'org:admin' ? 'ADMIN' : 'MEMBER',
      },
    });
  },
);

// function to send email on task creation
const sendTaskAssignmentEmail = inngest.createFunction(
  {id: 'send-task-assignment-email'},
  {event: 'app/task.assigned'},

  async ({event, step}) => {
    const {taskId, origin} = event.data;

    const task = await prisma.task.findUnique({
      where: {id: taskId},
      include: {assignee: true, project: true},
    });

    await SendEmail({
      to: task.assignee.email,
      subject: `New Task Assignment in: ${task.project.name}`,
      body: `<p>Hi ${task.assignee.name},</p>
                   <p>You have been assigned a new task: <strong>${task.title}</strong></p>
                   <p>Due date: ${new Date(task.due_date).toLocaleDateString()}</p>
                   <p>Click <a href="${origin}">here</a> to view the task.</p>
                   <p>Best,<br/>The Team</p>`,
    });

    if (
      new Date(task.due_date).toLocaleDateString() !== new Date().toDateString()
    ) {
      await step.sleepUntil('wait-for-the-due-date', new Date(task.due_date));

      await step.run('check-if-task-is-completed', async () => {
        const task = await prisma.task.findUnique({
          where: {id: taskId},
          include: {assignee: true, project: true},
        });

        if (!task) return;

        if (task.status !== 'DONE') {
          await step.run('send-task-reminder-email', async () => {
            await SendEmail({
              to: task.assignee.email,
              subject: `Reminder: Task "${task.title}" is Due Today`,
              body: `<p>Hi ${task.assignee.name},</p>
                                   <p>This is a reminder that the task "${task.title}" is due today.</p>
                                   <p>Best,<br/>The Team</p>`,
            });
          });
        }
      });
    }
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
  sendTaskAssignmentEmail,
];
