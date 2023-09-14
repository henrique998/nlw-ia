import 'dotenv/config'

import { fastifyCors } from '@fastify/cors'
import { fastify } from 'fastify'
import { promptsRoutes } from './routes/prompts.routes'
import { transcriptionsRoutes } from './routes/transcriptions.routes'
import { videosRoutes } from './routes/videos.routes'

const app = fastify()

app.register(fastifyCors, {
  origin: '*',
})
app.register(promptsRoutes)
app.register(videosRoutes)
app.register(transcriptionsRoutes)

app.listen({
  port: 3333,
}).then(() => console.log('Server is running at https://localhost:3333'))