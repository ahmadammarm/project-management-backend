export const CreateTask = async (request, response) => {

    try {

        const { userId } = await request.auth();
        const { projectId, title, description, type, status, priority, assigneeId, due_date } = request.body;

        const origin = request.get('origin');

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } }
        });

        if(!project) {
            return response.status(404).send({ message: 'Project not found' });
        } else if(project.team_lead !== userId) {
            return response.status(403).send( { message: 'Forbidden: You do not have permission to create tasks in this project' });
        } else if(assigneeId && !project.members.find((member) => member.user.id === assigneeId)) {
            return response.status(403).send({ message: 'Assignee must be a member of the project' });
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority,
                assigneeId,
                status,
                due_date: new Date(due_date),
            }
        });

        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: task.id },
            include: { assignee: true }
        });

        return response.status(201).json({ task: taskWithAssignee, message: 'Task created successfully' });


    } catch(error) {
        console.log(error || "Error to create a task");
        return response.status(500).send({ message: 'Internal Server Error' });
    }
}

export const UpdateTask = async (request, response) =>{
    try {

        const task = await prisma.task.findUnique({
            where: { id: request.params.id }
        });

        if(!task) {
            return response.status(404).send({ message: 'Task not found' });
        }

        const { userId } = await request.auth();

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } }
        });

        if(!project) {
            return response.status(404).send({ message: 'Project not found' });
        } else if(project.team_lead !== userId) {
            return response.status(403).send( { message: 'Forbidden: You do not have permission to update tasks in this project' });
        }

        const updatedTask = await prisma.task.update({
            where: { id: request.params.id },
            data: request.body
        });

        return response.status(200).json({ task: updatedTask, message: 'Task updated successfully' });


    } catch(error) {
        console.log(error || "Error to update a task");
        return response.status(500).send({ message: 'Internal Server Error' });
    }
}

export const DeleteTask = async (request, response) => {
    try {

        const { userId } = await request.auth();
        const { taskIds } = request.body;

        const tasks = await prisma.task.findMany({
            where: { id: { in: taskIds } }
        });

        if(tasks.length === 0) {
            return response.status(404).send({ message: 'No tasks found to delete' });
        }

        const project = await prisma.project.findUnique({
            where: { id: tasks[0].projectId },
            include: { members: { include: { user: true } } }
        });

        if(!project) {
            return response.status(404).send({ message: 'Project not found' });
        } else if(project.team_lead !== userId) {
            return response.status(403).send( { message: 'Forbidden: You do not have permission to delete tasks in this project' });
        }

        await prisma.task.deleteMany({
            where: { id: { in: taskIds } }
        });

        return response.status(200).json({ message: 'Tasks deleted successfully' });

    } catch(error) {
        console.log(error || "Error to delete a task");
        return response.status(500).send({ message: 'Internal Server Error' });
    }
}