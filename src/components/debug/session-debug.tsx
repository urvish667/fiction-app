'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function SessionDebug() {
  const { data: session, status, update } = useSession()
  const [isVisible, setIsVisible] = useState(false)

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsVisible(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          Debug Session
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            Session Debug
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
              Close
            </Button>
          </CardTitle>
          <CardDescription>
            Status: <span className={status === 'authenticated' ? 'text-green-500' : 'text-red-500'}>
              {status}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="max-h-60 overflow-auto text-xs">
            <pre>{JSON.stringify(session, null, 2)}</pre>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button size="sm" onClick={() => update()}>
            Refresh Session
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
