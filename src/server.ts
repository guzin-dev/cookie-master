import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

import { prismaClient } from './database';

const app = express();
app.use(express.json());

const port = process.env.PORT ?? 4000;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

const authMiddleware = (req: any, res: any, next: any) => {
  const authCode = req.headers['authorization'];

  if (authCode === process.env.AUTH_TOKEN) {
    next();
  } else {
    return res.status(403).json({ error: 'Access Denied.' });
  }
};

app.use(authMiddleware);

app.post('/users/create/user', async (request, response) => {
  console.log('REQUEST BODY', request.body);
  const { userId, name, displayName, description, hasVerifiedBadge } = request.body;
  try {
    const user = await prismaClient.user.create({
      data: {
        userId,
        name,
        displayName,
        description,
        hasVerifiedBadge,
        cookies: 0,
      },
    });
    return response.status(201).json(user);
  } catch (error) {
    console.error('Error while creating user:', error);
    return response.status(500).json({ error: 'Error while creating user.' });
  }
});

app.get('/users/:userId', async (request, response) => {
  const userId = parseInt(request.params.userId);
  try {
    const user = await prismaClient.user.findUnique({
      where: { userId },
    });
    if (!user) {
      return response.status(404).json({ error: 'User not found.' });
    }
    return response.json(user);
  } catch (error) {
    console.error('Error while trying to search user:', error);
    return response.status(500).json({ error: 'Error while trying to search user.' });
  }
});

app.post('/users/cookies/:userId', async (request, response) => {
  const { userId } = request.params;
  const { quantity } = request.body;

  try {
    const user = await prismaClient.user.findUnique({
      where: { userId: parseInt(userId) },
    });

    if (!user) {
      return response.status(404).json({ error: 'User not found.' });
    }

    const updatedUser = await prismaClient.user.update({
      where: { userId: parseInt(userId) },
      data: { cookies: quantity },
    });

    return response.json(updatedUser);
  } catch (error) {
    console.error('Error while tying to update user cookies:', error);
    return response.status(500).json({ error: 'Error while tying to update user cookies.' });
  }
});

app.get('/users/cookies/top-cookies', async (request, response) => {
  try {
    const topUsers = await prismaClient.user.findMany({
      take: 10,
      orderBy: { cookies: 'desc' },
    });
    return response.json(topUsers);
  } catch (error) {
    console.error('Error while trying to get top cookies:', error);
    return response.status(500).json({ error: 'Error while trying to get top cookies.' });
  }
});

app.get('/users/name/:name', async (request, response) => {
  const { name } = request.params;
  try {
    const user = await prismaClient.user.findFirst({
      where: {
        OR: [{ name: name }, { displayName: name }],
      },
    });
    if (!user) {
      return response.status(404).json({ error: 'User not found.' });
    }
    return response.json(user);
  } catch (error) {
    console.error('Error while trying to find user by name:', error);
    return response.status(500).json({ error: 'Error while trying to search user.' });
  }
});

app.listen(port, () => console.log('Server is running on port ', port));
