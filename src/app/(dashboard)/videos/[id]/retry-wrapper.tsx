'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCw, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface RetryButtonWrapperProps {
  contentId: string
}

export function RetryButtonWrapper({ contentId }: RetryButtonWrapperProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRetry = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('content_queue')
      .update({ status: 'pending', retry_count: 0, error_log: null })
      .eq('id', contentId)
    router.refresh()
    setLoading(false)
  }

  return (
    <Button variant="outline" onClick={handleRetry} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RotateCw className="mr-2 h-4 w-4" />
      )}
      Tentar novamente
    </Button>
  )
}
