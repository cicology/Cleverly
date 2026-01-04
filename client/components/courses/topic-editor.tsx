"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Sparkles } from "lucide-react"

interface TopicEditorProps {
  topics: string[]
  onTopicsChange: (topics: string[]) => void
}

export function TopicEditor({ topics, onTopicsChange }: TopicEditorProps) {
  const [newTopic, setNewTopic] = useState("")

  const addTopic = () => {
    if (newTopic.trim()) {
      onTopicsChange([...topics, newTopic.trim()])
      setNewTopic("")
    }
  }

  const removeTopic = (index: number) => {
    onTopicsChange(topics.filter((_, i) => i !== index))
  }

  const regenerateTopics = () => {
    console.log("[v0] Regenerating topics with AI")
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add a topic..."
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTopic()}
        />
        <Button onClick={addTopic} className="gap-2">
          <Plus className="size-4" />
          Add
        </Button>
        <Button variant="outline" onClick={regenerateTopics} className="gap-2 bg-transparent">
          <Sparkles className="size-4" />
          Regenerate
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {topics.map((topic, index) => (
          <Badge key={index} variant="secondary" className="pl-3 pr-2 py-1.5 text-sm gap-2">
            {topic}
            <button onClick={() => removeTopic(index)} className="hover:text-destructive transition-colors">
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>

      {topics.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No topics yet. Add topics manually or let AI extract them from your materials.
        </p>
      )}
    </div>
  )
}
