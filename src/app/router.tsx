import { Route, Routes } from 'react-router-dom'
import { HomeRoute } from './routes/home'
import { CustomDuelRoute } from './routes/duel-custom'
import { SharedDuelRoute } from './routes/duel-shared'
import { CuratedDuelRoute } from './routes/duel-modes'
import { PlayRoute } from './routes/play'
import { ResultsRoute } from './routes/results'
import { NotFoundRoute } from './routes/not-found'

/** The route table. `rulesOpen` gates keyboard controls in the play route. */
export function AppRoutes({ rulesOpen }: { rulesOpen: boolean }) {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/duel/custom" element={<CustomDuelRoute />} />
      {/* Two segments — distinct from the one-segment /duel/custom and
          /duel/:matchupId, so it never shadows them. */}
      <Route path="/duel/:idA/:idB" element={<SharedDuelRoute />} />
      <Route path="/duel/:matchupId" element={<CuratedDuelRoute />} />
      <Route path="/jouer/:matchup/:mode" element={<PlayRoute rulesOpen={rulesOpen} />} />
      <Route path="/resultats" element={<ResultsRoute />} />
      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  )
}
