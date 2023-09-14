import { api } from '@/lib/axios';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type Prompt = {
  id: string
  title: string
  template: string
}

interface PromptSelectProps {
  onPromptSelected: (template: string) => void
}

export function PromptSelect({ onPromptSelected }: PromptSelectProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([])

  useEffect(() => {
    api.get<Prompt[]>('/prompts').then(res => {
      setPrompts(res.data)
    })
  }, [])

  function handlePromptSelected(promptId: string) {
    const selectedPrompt = prompts.find(prompt => prompt.id === promptId)

    if (!selectedPrompt) return

    onPromptSelected(selectedPrompt.template)
  }

  return (
    <Select onValueChange={handlePromptSelected}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um prompt..." />
      </SelectTrigger>

      <SelectContent>
        {prompts.map(prompt => (
          <SelectItem key={prompt.id} value={prompt.id}>
            {prompt.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}