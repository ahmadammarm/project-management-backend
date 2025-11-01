import {Inngest} from 'inngest';
import prisma from './prisma';

export const inngest = new Inngest({
  id: 'project-management-backend',
  name: 'Project Management Backend',
});

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

const syncUserDeletieion = inngest.createFunction(
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

export const functions = [syncUserCreation, syncUserDeletieion];
