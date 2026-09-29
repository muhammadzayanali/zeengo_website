import { Link } from 'react-router-dom'
import { EmptyBlock, SectionHeader } from '@/components/ui/Primitives'
import { ServiceTile } from '@/components/cards/Cards'
import { MoneyInMoscowPage } from '@/components/money/MoneyConverter'
import { PlacesPage } from './PlacesPage'

export function ActsPage() {
  return (
    <div>
      <h1 className="text-[30px] font-bold tracking-[-0.4px]">Things to do</h1>
      <p className="mt-2 max-w-2xl text-sm text-sgraph">
        Experiences and attractions from Discovery places.
      </p>
      <div className="mt-6">
        <PlacesPage title="Experiences" homeRail="moscowNow" />
      </div>
    </div>
  )
}

export function PlanPage() {
  return (
    <div>
      <h1 className="text-[30px] font-bold tracking-[-0.4px]">Your plan</h1>
      <p className="mt-2 text-sm text-sgraph">
        Build days the way the prototype “Plan / My trip” flow does — picks,
        transport, desk handoff.
      </p>
      <SectionHeader title="Trip template" />
      <Link
        to="/around"
        className="mb-4 block rounded-[18px] border border-bord bg-mint/40 px-4 py-3 text-sm font-semibold text-forest"
      >
        Browse places to start your Moscow days →
      </Link>
      <EmptyBlock
        title="Your bag is empty"
        body="Save places from Home or Places, then message ZEEN to lock the itinerary."
      />
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <ServiceTile to="/around" title="Add places" subtitle="Around you" />
        <ServiceTile to="/acts" title="Add activities" subtitle="Things to do" />
        <ServiceTile to="/stays" title="Add stay" subtitle="Hotels" />
        <ServiceTile to="/train" title="Trains" subtitle="Intercity" dark />
      </div>
    </div>
  )
}

export function MoneyPage() {
  return <MoneyInMoscowPage />
}

export function SimpleHub({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <div>
      <h1 className="text-[30px] font-bold tracking-[-0.4px]">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-sgraph">{body}</p>
      <Link
        to="/account"
        className="mt-6 inline-flex min-h-12 items-center rounded-[16px] bg-emer px-5 font-semibold text-white"
      >
        Open account with ZN
      </Link>
    </div>
  )
}
