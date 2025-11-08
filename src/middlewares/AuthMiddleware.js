export const AuthMiddleware = async (request, response, next) => {
    try {

        const { userId } = await request.auth();

        if(!userId) {
            return response.status(401).send({ message: 'Unauthorized' });
        }

        return next();

    } catch(error) {
        console.error('Authentication error:', error);
        return response.status(500).send({ message: 'Internal Server Error' });
    }
}