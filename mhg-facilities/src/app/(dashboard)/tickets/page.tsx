import { Suspense } from 'react'
import { PageLoader } from '@/components/ui/loaders'
import { TicketsPageContent } from './tickets-page-content'

export default function TicketsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TicketsPageContent />
    </Suspense>
  )
}
