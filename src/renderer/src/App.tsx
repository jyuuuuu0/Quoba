import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AppShell } from '@/components/layout/AppShell'
import { AppShortcuts } from '@/components/layout/AppShortcuts'
import { Panel } from '@/components/layout/Panel'
import { Spinner } from '@/components/ui/Spinner'
import { screens } from '@/screens'
import { useEngine } from '@/stores/engine'
import { useNavigation, type Route } from '@/stores/navigation'
import { useSettings } from '@/stores/settings'

function EmptyScreen({ route }: { route: Route }): React.JSX.Element {
  const { t } = useTranslation()
  return <Panel title={t(`nav.${route}`)}>{null}</Panel>
}

export function App(): React.JSX.Element {
  const { t } = useTranslation()
  const route = useNavigation((state) => state.route)
  const settings = useSettings((state) => state.settings)
  const loadSettings = useSettings((state) => state.load)
  const loadEngine = useEngine((state) => state.load)

  useEffect(() => {
    void loadSettings()
    void loadEngine()
  }, [loadSettings, loadEngine])

  if (!settings) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner label={t('common.loading')} />
      </div>
    )
  }

  const Screen = screens[route]
  return (
    <AppShell>
      <AppShortcuts />
      {Screen ? <Screen /> : <EmptyScreen route={route} />}
    </AppShell>
  )
}
