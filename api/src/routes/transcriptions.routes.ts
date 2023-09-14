import { FastifyInstance } from 'fastify';


export async function transcriptionsRoutes(app: FastifyInstance) {
  // app.post('/videos/:videoId/transcription', async (req, rep) => {
  //   const paramsSchema = z.object({
  //     videoId: z.string().uuid(),
  //   })

  //   const bodySchema = z.object({
  //     prompt: z.string(),
  //   })

  //   const { videoId } = paramsSchema.parse(req.params)
  //   const { prompt } = bodySchema.parse(req.body)

  //   const video = await prisma.video.findUniqueOrThrow({
  //     where: {
  //       id: videoId,
  //     }
  //   })

  //   const audioStream = createReadStream(video.path)

  //   const res = await openai.audio.transcriptions.create({
  //     file: audioStream,
  //     model: 'whisper-1',
  //     language: 'pt',
  //     response_format: 'json',
  //     temperature: 0,
  //     prompt,
  //   })

  //   await prisma.video.update({
  //     where: {
  //       id: videoId
  //     },
  //     data: {
  //       transcription: res.text,
  //     }
  //   })

  //   return rep.send({ transcription: res.text })
  // })
}