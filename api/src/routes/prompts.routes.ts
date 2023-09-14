import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export async function promptsRoutes(app: FastifyInstance) {
  app.get('/prompts', async (req, rep) => {
    const prompts = await prisma.prompt.findMany()
  
    return rep.send(prompts)
  })
}