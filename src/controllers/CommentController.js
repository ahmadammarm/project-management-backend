import prisma from "../lib/prisma.js";

export const AddComment = async (request, response) => {
    try {

        const { userId } = await request.auth();
        const { content, taskId } = request.body;

        const task = await prisma.task.findUnique({
            where: {
                id: taskId
            }
        });

        const project = await prisma.project.findUnique({
            where: {
                id: task.projectId
            },
            include: {
                members: { include: { user: true } }
            }
        });

        if(!project) {
            return response.status(404).json({ message: "Project not found" });
        }

        const member = project.members.find((member) => member.userId === userId);

        if(!member) {
            return response.status(403).json({ message: "You are not a member of this project" });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                taskId,
                userId
            },
            include: {
                user: true
            }
        });

        return response.status(201).json({comment});

    } catch(error) {
        console.log(error || "Error to add a comment");
        return response.status(500).json({ message: error.code || error.message })
    }
}

export const GetTaskComments = async (request, response) => {
    try {

        const { taskId } = request.params;

        const comments = await prisma.comment.findMany({
            where: {
                taskId
            },
            include: {
                user: true
            }
        });

        return response.status(200).json({comments});

    } catch(error) {
        console.log(error || "Error to get task comments");
        return response.status(500).json({ message: error.code || error.message })
    }
}