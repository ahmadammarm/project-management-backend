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