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
      return response.status(404).json({ error: 'Usuário não encontrado.' });
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
    return response.status(500).json({ error: 'Erro ao atualizar cookies.' });
  }
});

app.get('/user/cookies/:userId', async (request, response) => {
  const { userId } = request.params;

  try {
    const cookie = await prismaClient.cookie.findUnique({
      where: { userId: userId },
    });

    if (!cookie) {
      return response.status(404).json({ error: 'Cookies não encontrados para este usuário.' });
    }

    return response.json({ quantity: cookie.quantity });
  } catch (error) {
    return response.status(500).json({ error: 'Erro ao buscar cookies.' });
  }
});

app.listen(port, () => console.log('Server is running on port ', port));
