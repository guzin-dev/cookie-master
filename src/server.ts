import express from 'express';
import { prismaClient } from './database';

const app = express();
app.use(express.json());

const port = process.env.PORT ?? 4000;

app.post('/users/create', async (request, response) => {
  const { description, hasVerifiedBadge, userId, name, displayName } = request.body;

  try {
    const user = await prismaClient.user.create({
      data: {
        description,
        hasVerifiedBadge,
        userId,
        name,
        displayName,
      },
    });

    return response.json(user);
  } catch (error) {
    return response.status(500).json({ error: 'An error ocurred when trying to create this user.' });
  }
});

app.get('/users/:userId', async (request, response) => {
  const { userId } = request.params;

  try {
    const user = await prismaClient.user.findUnique({
      where: {
        userId: parseInt(userId),
      },
    });

    if (!user) {
      return response.status(404).json({ error: 'User not found.' });
    }

    return response.json(user);
  } catch (error) {
    return response.status(500).json({ error: 'An error ocurred when trying to get this user.' });
  }
});

app.post('/user/cookies/:userId', async (request, response) => {
  const { userId } = request.params;
  const { quantity } = request.body;

  try {
    const user = await prismaClient.user.findUnique({
      where: { userId: parseInt(userId) },
    });

    if (!user) {
      return response.status(404).json({ error: 'User not found.' });
    }

    const cookie = await prismaClient.cookie.upsert({
      where: { userId: user.id },
      update: { quantity: { increment: quantity } },
      create: {
        userId: user.id,
        quantity,
      },
    });

    return response.json(cookie);
  } catch (error) {
    return response.status(500).json({ error: 'An error ocurred when trying to update user cookies.' });
  }
});

app.get('/user/cookies/:userId', async (request, response) => {
  const { userId } = request.params;

  try {
    const cookie = await prismaClient.cookie.findUnique({
      where: { userId: userId },
    });

    if (!cookie) {
      return response.status(404).json({ error: 'Cookies not found for this user.' });
    }

    return response.json({ quantity: cookie.quantity });
  } catch (error) {
    return response.status(500).json({ error: 'An error ocurred when trying to get cookies for this user.' });
  }
});

app.get('/users/top-cookies', async (request, response) => {
  try {
    const topUsers = await prismaClient.cookie.findMany({
      orderBy: {
        quantity: 'desc',
      },
      take: 10,
      include: {
        user: true,
      },
    });

    const topUsersData = topUsers.map((cookie) => ({
      userId: cookie.user.userId,
      name: cookie.user.name,
      displayName: cookie.user.displayName,
      description: cookie.user.description,
      hasVerifiedBadge: cookie.user.hasVerifiedBadge,
      cookies: cookie.quantity,
    }));

    return response.json(topUsersData);
  } catch (error) {
    return response.status(500).json({ error: 'An error ocurred when trying to get top cookies users.' });
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
    return response.status(500).json({ error: 'An error ocurred when trying get user by name.' });
  }
});

app.listen(port, () => console.log('Server is running on port ', port));
