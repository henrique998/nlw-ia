import { api } from '@/lib/axios';
import { getFFmpeg } from '@/lib/ffmepg';
import { fetchFile } from '@ffmpeg/util';
import { FileVideo, Upload } from 'lucide-react';
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';

type Status = 'wating' | 'converting' | 'uploading' | 'generating' | 'error' | 'success'

const statusMessages = {
  converting: 'Convertendo...',
  uploading: 'Carregando...',
  generating: 'Transcrevendo...',
  error: 'Erro!',
  success: 'Sucesso!'
}

interface VideoInputFormProps {
  onVideoUploaded: (videoId: string) => void
}

export function VideoInputForm({ onVideoUploaded }: VideoInputFormProps) {
  const [video, setVideo] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('wating')

  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const { files } = e.currentTarget

    if (!files) {
      return
    }

    const selectedFile = files[0]

    setVideo(selectedFile)
  }

  async function convertVideoToAudio(videoFile: File) {
    console.log('convert started!')

    const ffmpeg = await getFFmpeg()

    await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))

    ffmpeg.on('progress', ({ progress }) => {
      console.log('Convert progress: ' + Math.round(progress * 100))
    })

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3'
    ])

    const data = await ffmpeg.readFile('output.mp3')

    const audioFileBlob = new Blob([data], { type: 'audio/mpeg' })
    const audioFile = new File([audioFileBlob], 'audio.mp3', { 
      type: 'audio/mpeg' 
    })

    console.log('convert finished!')

    return audioFile
  }

  async function handleUploadVideo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const prompt = promptInputRef.current?.value

    if (!video) {
      return
    }

    setStatus('converting')

    const audio = await convertVideoToAudio(video)

    const data = new FormData()

    data.append('file', audio)

    setStatus('uploading')

    const res = await api.post('/videos', data)

    const videoId = res.data.video.id
    
    setStatus('generating')

    try {
      await api.post(`/videos/${videoId}/transcription`, {
        prompt
      })
  
      setStatus('success')

      onVideoUploaded(videoId)
    } catch (error) {
      setStatus('error')
    }
  }

  const previewUrl = useMemo(() => {
    if (!video) return null

    return URL.createObjectURL(video)
  }, [video])

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <label 
        htmlFor="video"
        className="relative border overflow-hidden flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5 transition-colors"
      >
        {previewUrl ? (
          <video src={previewUrl} controls={false} className="pointer-events-none absolute inset-0" />
        ) : (
          <>
            <FileVideo className="w-4 h-4" />
            Selecione um video
          </>
        )}
      </label>

      <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleFileSelected} />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>

        <Textarea 
          id="transcription_prompt" 
          ref={promptInputRef}
          disabled={status !== 'wating'}
          placeholder="Inclua palavras-chave mencionadas no vídeo separadas por vírgula (,)" 
          className="h-20 resize-none leading-relaxed" 
        />
      </div>

      <Button 
        type="submit"
        data-success={status === 'success'}
        disabled={status !== 'wating'} 
        className="w-full data-[success=true]:bg-emerald-500 data-[success=true]:text-white data-[success=false]:bg-red-500 data-[success=false]:text-white"
      >
        {status === 'wating' ? (
          <>
            Carregar vídeo
            <Upload className="w-4 h-4 ml-2" />
          </>
        ) : statusMessages[status]}
      </Button>
    </form>
  )
}