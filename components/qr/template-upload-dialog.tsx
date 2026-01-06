"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload } from "lucide-react"
import { uploadQRTemplate } from "@/lib/qr/templates"
import { useToast } from "@/hooks/use-toast"

export function TemplateUploadDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("template", file)
      formData.append("name", name)
      formData.append("setAsDefault", String(setAsDefault))

      await uploadQRTemplate(formData)

      toast({
        title: "Success",
        description: "QR template uploaded successfully",
      })

      setFile(null)
      setName("")
      setSetAsDefault(false)
      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload QR Template
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload QR Code Template</DialogTitle>
          <DialogDescription>
            Upload a custom template image to overlay your QR codes. Recommended: PNG with transparent center area for
            QR code.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="templateFile">Template Image</Label>
            <Input
              id="templateFile"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) {
                  setFile(selectedFile)
                  if (!name) {
                    setName(selectedFile.name.replace(/\.[^/.]+$/, ""))
                  }
                }
              }}
            />
            <p className="text-xs text-muted-foreground">PNG or JPG, max 2MB</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              placeholder="My Custom Template"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="setDefault"
              checked={setAsDefault}
              onCheckedChange={(checked) => setSetAsDefault(!!checked)}
            />
            <Label htmlFor="setDefault" className="cursor-pointer text-sm font-normal">
              Set as default template
            </Label>
          </div>
          {file && (
            <div className="rounded-md border p-3">
              <p className="text-sm">
                <span className="font-medium">Selected:</span> {file.name}
              </p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={loading || !file}>
            {loading ? "Uploading..." : "Upload Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
