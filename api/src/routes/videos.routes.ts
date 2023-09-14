import { fastifyMultipart } from '@fastify/multipart';
import { OpenAIStream, streamToResponse } from 'ai';
import { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import fs, { createReadStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { z } from 'zod';
import { openai } from '../lib/openai';
import { prisma } from '../lib/prisma';
const pump = promisify(pipeline)

export async function videosRoutes(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: { 
      fileSize: 1_048_576 * 25, // mb 
    }
  })

  app.post('/videos', async (req, rep) => {
    const data = await req.file()

    if (!data) {
      return rep.status(400).send({ error: 'Missing file input.' })
    }

    const ext = path.extname(data.filename)

    if (ext !== '.mp3') {
      return rep.status(400).send({ error: 'Invalid input type, please upload a MP3.' })
    }

    const fileBaseName = path.basename(data.filename, ext)
    const fileUploadName = `${fileBaseName}-${randomUUID()}${ext}`
    const uploadDest = path.resolve(__dirname, '../../tmp', fileUploadName)

    await pump(data.file, fs.createWriteStream(uploadDest))

    const video = await prisma.video.create({
      data: {
        name: data.filename,
        path: uploadDest,
      }
    })

    return rep.send({ video })
  })

  app.post('/videos/:videoId/transcription', async (req, rep) => {
    const paramsSchema = z.object({
      videoId: z.string().uuid(),
    })

    const bodySchema = z.object({
      prompt: z.string(),
    })

    const { videoId } = paramsSchema.parse(req.params)
    const { prompt } = bodySchema.parse(req.body)

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId,
      }
    })

    const audioStream = createReadStream(video.path)

    const res = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'json',
      temperature: 0,
      prompt,
    })

    await prisma.video.update({
      where: {
        id: videoId
      },
      data: {
        transcription: res.text,
      }
    })

    return rep.send({ transcription: res.text })
  })

  app.post('/videos/completion', async (req, rep) => {
    const bodySchema = z.object({
      videoId: z.string(),
      prompt: z.string(),
      temperature: z.number().min(0).max(1).default(0.5)
    })

    const { videoId, prompt, temperature } = bodySchema.parse(req.body)

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId,
      }
    })

    if (!video.transcription) {
      return rep.status(400).send({ error: 'Video transcription was not generated yet.' })
    }

    const promptMessage = prompt.replace('{transcription}', video.transcription)

    const res = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      temperature,
      messages: [
        { role: 'user', content: promptMessage }
      ],
      stream: true
    })

    const stream = OpenAIStream(res)

    streamToResponse(stream, rep.raw, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    })
  })
}