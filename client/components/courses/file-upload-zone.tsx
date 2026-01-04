"use client"

import type React from "react"

import { useCallback } from "react"
import { Upload, File, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadZoneProps {
  files: File[]
  onFilesChange: (files: File[]) => void
}

export function FileUploadZone({ files, onFilesChange }: FileUploadZoneProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const droppedFiles = Array.from(e.dataTransfer.files)
      onFilesChange([...files, ...droppedFiles])
    },
    [files, onFilesChange],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      onFilesChange([...files, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
      >
        <Upload className="size-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">Drag and drop files here</p>
        <p className="text-sm text-muted-foreground mb-4">or</p>
        <label htmlFor="file-upload">
          <Button type="button" variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
            Browse Files
          </Button>
        </label>
        <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileInput} />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files ({files.length})</p>
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <File className="size-5 text-muted-foreground" />
              <span className="flex-1 text-sm">{file.name}</span>
              <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
              <Button variant="ghost" size="icon-sm" onClick={() => removeFile(index)}>
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
