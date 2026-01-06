import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

interface ErrorScreenProps {
  title?: string
  message?: string
}

export function ErrorScreen({
  title = "Invalid QR Code",
  message = "This QR code is not valid. Please ask staff for assistance.",
}: ErrorScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-base">{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Please scan the QR code on your table or contact a staff member for help.
        </CardContent>
      </Card>
    </div>
  )
}
