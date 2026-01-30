import SendEmail from "../lib/nodemailer.js";
import dotenv from "dotenv";

dotenv.config();

export const CreateTask = async (request, response) => {
  try {
    const {userId} = await request.auth();
    const {
      projectId,
      title,
      description,
      type,
      status,
      priority,
      assigneeId,
      due_date,
    } = request.body;

    const project = await prisma.project.findUnique({
      where: {id: projectId},
      include: {members: {include: {user: true}}},
    });

    if (!project) {
      return response.status(404).send({message: 'Project not found'});
    }

    if (project.team_lead !== userId) {
      return response.status(403).send({
        message:
          'Forbidden: You do not have permission to create tasks in this project',
      });
    }

    if (
      assigneeId &&
      !project.members.find(member => member.user.id === assigneeId)
    ) {
      return response
        .status(403)
        .send({message: 'Assignee must be a member of the project'});
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        type,
        priority,
        due_date: new Date(due_date),

        project: {
          connect: {id: projectId},
        },

        assignee: {
          connect: {id: assigneeId},
        },
      },
    });

    const taskWithAssignee = await prisma.task.findUnique({
      where: {id: task.id},
      include: {
        assignee: true,
        project: true,
      },
    });

    if (taskWithAssignee.assignee?.email) {
    const appUrl = process.env.VITE_APP_URL;
    const taskUrl = `${appUrl}/taskDetails?projectId=${taskWithAssignee.project.id}&taskId=${taskWithAssignee.id}`;

    SendEmail({
      to: taskWithAssignee.assignee.email,
      subject: 'You have been assigned a task',
      body: `
        <h2>New Task Assigned</h2>
        <p>Hello ${taskWithAssignee.assignee.name},</p>
        <p>You have been assigned to <strong>${taskWithAssignee.title}</strong>
        in project <strong>${taskWithAssignee.project.name}</strong>.</p>
        <p>View task details: <a href="${taskUrl}">${taskUrl}</a></p>
      `,
    }).catch(console.error);
    }

    return response.status(201).json({
      task: taskWithAssignee,
      message: 'Task created successfully',
    });
  } catch (error) {
    console.error(error);
    return response.status(500).send({message: 'Internal Server Error'});
  }
};

export const UpdateTask = async (request, response) => {
  try {
    const task = await prisma.task.findUnique({
      where: {id: request.params.id},
    });

    if (!task) {
      return response.status(404).send({message: 'Task not found'});
    }

    const {userId} = await request.auth();

    const project = await prisma.project.findUnique({
      where: {id: task.projectId},
      include: {members: {include: {user: true}}},
    });

    if (!project) {
      return response.status(404).send({message: 'Project not found'});
    } else if (project.team_lead !== userId) {
      return response.status(403).send({
        message:
          'Forbidden: You do not have permission to update tasks in this project',
      });
    }

    const updatedTask = await prisma.task.update({
      where: {id: request.params.id},
      data: request.body,
    });

    return response
      .status(200)
      .json({task: updatedTask, message: 'Task updated successfully'});
  } catch (error) {
    console.log(error || 'Error to update a task');
    return response.status(500).send({message: 'Internal Server Error'});
  }
};

export const DeleteTask = async (request, response) => {
  try {
    const {userId} = await request.auth();
    const {taskIds} = request.body;

    const tasks = await prisma.task.findMany({
      where: {id: {in: taskIds}},
    });

    if (tasks.length === 0) {
      return response.status(404).send({message: 'No tasks found to delete'});
    }

    const project = await prisma.project.findUnique({
      where: {id: tasks[0].projectId},
      include: {members: {include: {user: true}}},
    });

    if (!project) {
      return response.status(404).send({message: 'Project not found'});
    } else if (project.team_lead !== userId) {
      return response.status(403).send({
        message:
          'Forbidden: You do not have permission to delete tasks in this project',
      });
    }

    await prisma.task.deleteMany({
      where: {id: {in: taskIds}},
    });

    return response.status(200).json({message: 'Tasks deleted successfully'});
  } catch (error) {
    console.log(error || 'Error to delete a task');
    return response.status(500).send({message: 'Internal Server Error'});
  }
};
