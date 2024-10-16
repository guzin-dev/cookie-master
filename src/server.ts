import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

import { prismaClient } from './database';

const app = express();
app.use(express.json());

const port = process.env.PORT ?? 4000;
const AUTH_CODE = process.env.AUTH_CODE;

const authMiddleware = (req: any, res: any, next: any) => {
  const authCode = req.headers['authorization'];

  console.log(authCode);
  console.log(AUTH_CODE);

  if (authCode === process.env.AUTH_CODE) {
    console.log('TEste');
    next();
  } else {
    return res.status(403).json({ error: 'Acesso negado. Código de autorização inválido.' });
  }
};

app.use(authMiddleware);

app.post('/users/create/user', async (request, response) => {
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
    console.error('Erro ao criar usuário:', error);
    return response.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});

app.get('/users/:userId', async (request, response) => {
  const userId = parseInt(request.params.userId);
  try {
    const user = await prismaClient.user.findUnique({
      where: { userId },
    });
    if (!user) {
      return response.status(404).json({ error: 'Usuário não encontrado.' });
    }
    return response.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return response.status(500).json({ error: 'Erro ao buscar usuário.' });
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
      return response.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const updatedUser = await prismaClient.user.update({
      where: { userId: parseInt(userId) },
      data: { cookies: quantity },
    });

    return response.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar os cookies do usuário:', error);
    return response.status(500).json({ error: 'Erro ao atualizar os cookies.' });
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
    console.error('Erro ao buscar top usuários:', error);
    return response.status(500).json({ error: 'Erro ao buscar top usuários.' });
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
      return response.status(404).json({ error: 'Usuário não encontrado.' });
    }
    return response.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário pelo nome:', error);
    return response.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
});

app.listen(port, () => console.log('Server is running on port ', port));
