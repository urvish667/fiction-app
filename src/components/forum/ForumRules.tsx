import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ForumRulesProps {
  rules: string[]
  asDialog?: boolean
}

const ForumRulesContent = ({ rules }: { rules: string[] }) => (
  <div className="space-y-4">
    <ul className="space-y-2 text-sm">
      {rules.map((rule, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className="text-muted-foreground mt-0.5">•</span>
          <span>{rule}</span>
        </li>
      ))}
    </ul>
  </div>
)

export default function ForumRules({ rules, asDialog = false }: ForumRulesProps) {
  if (asDialog) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Forum Rules
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forum Rules</DialogTitle>
          </DialogHeader>
          <ForumRulesContent rules={rules} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircle className="h-5 w-5" />
          Forum Rules
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ForumRulesContent rules={rules} />
      </CardContent>
    </Card>
  )
}
