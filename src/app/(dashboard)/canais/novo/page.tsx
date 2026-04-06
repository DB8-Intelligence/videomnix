import { ChannelWizard } from '@/components/channels/ChannelWizard'

export default function NovoCanal() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Criar Novo Canal</h1>
      <ChannelWizard />
    </div>
  )
}
