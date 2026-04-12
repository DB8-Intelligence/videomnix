import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Zap, Film, TrendingUp, MonitorPlay, Brain, Clock,
  CheckCircle2, ArrowRight, Sparkles,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    title: 'IA gera o roteiro',
    description: 'Claude analisa tendências e cria roteiros otimizados para retenção.',
  },
  {
    icon: Film,
    title: 'Vídeo automático',
    description: 'Narração ElevenLabs + vídeo stock + legendas. Tudo sem aparecer na câmera.',
  },
  {
    icon: MonitorPlay,
    title: 'Upload direto',
    description: 'Publica no YouTube com título, descrição, tags e thumbnail — tudo automático.',
  },
  {
    icon: TrendingUp,
    title: 'Analytics integrado',
    description: 'Acompanhe views, RPM e receita de todos os canais num só lugar.',
  },
  {
    icon: Clock,
    title: 'Agendamento inteligente',
    description: 'Define horários de pico por nicho para maximizar impressões.',
  },
  {
    icon: Zap,
    title: 'Shorts automáticos',
    description: 'Gera até 3 Shorts por vídeo longo para multiplicar alcance.',
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: 'R$97',
    period: '/mês',
    description: 'Para quem está começando',
    features: ['2 canais', '30 vídeos/mês', 'Todos os nichos', 'Upload YouTube', 'Analytics básico'],
    cta: 'Começar agora',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 'R$197',
    period: '/mês',
    description: 'Para criadores sérios',
    features: ['5 canais', '100 vídeos/mês', 'Todos os nichos', 'Upload YouTube', 'Analytics avançado', 'Shorts automáticos', 'Suporte prioritário'],
    cta: 'Escolher Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'R$497',
    period: '/mês',
    description: 'Para agências e escala',
    features: ['Canais ilimitados', 'Vídeos ilimitados', 'Todos os nichos', 'Upload YouTube', 'Analytics avançado', 'Shorts automáticos', 'API access', 'Suporte dedicado'],
    cta: 'Falar com vendas',
    highlighted: false,
  },
]

const NICHES = [
  { emoji: '🤖', label: 'IA & Tech', rpm: 'R$15-45' },
  { emoji: '💰', label: 'Finanças', rpm: 'R$25-80' },
  { emoji: '🧠', label: 'Curiosidades', rpm: 'R$8-18' },
  { emoji: '👻', label: 'Horror', rpm: 'R$5-14' },
  { emoji: '⚡', label: 'Motivacional', rpm: 'R$6-15' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              V
            </div>
            <span className="text-lg font-bold">Videomnix</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/cadastro">Criar conta grátis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          <Sparkles className="mr-1 h-3 w-3" />
          Automação com IA — sem aparecer na câmera
        </Badge>
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Crie canais YouTube lucrativos{' '}
          <span className="text-primary">no piloto automático</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          O Videomnix usa IA para gerar roteiros, narração, vídeos e thumbnails —
          depois publica direto no YouTube. Tudo sem você gravar um segundo sequer.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/cadastro">
              Começar grátis por 14 dias
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#precos">Ver planos</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Sem cartão de crédito · Cancele quando quiser
        </p>
      </section>

      {/* Nichos */}
      <section className="border-y bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
            NICHOS COM MAIOR RPM NO YOUTUBE BRASIL
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {NICHES.map((n) => (
              <div key={n.label} className="flex items-center gap-2 rounded-full border bg-background px-4 py-2">
                <span className="text-xl">{n.emoji}</span>
                <span className="font-medium">{n.label}</span>
                <Badge variant="secondary" className="text-xs">{n.rpm}</Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Pipeline completo de produção</h2>
          <p className="mt-2 text-muted-foreground">
            Da ideia ao vídeo publicado em minutos, não em horas.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="pt-6">
                <f.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section className="border-y bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold">Como funciona</h2>
          <div className="mt-12 grid gap-0 sm:grid-cols-4">
            {[
              { step: '1', label: 'Escolha o nicho', desc: 'IA, finanças, horror...' },
              { step: '2', label: 'IA gera tudo', desc: 'Roteiro + voz + vídeo' },
              { step: '3', label: 'Revise e aprove', desc: 'Ou deixe no automático' },
              { step: '4', label: 'Publicado!', desc: 'YouTube + Shorts' },
            ].map((s, i) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {s.step}
                </div>
                {i < 3 && <div className="hidden h-0.5 w-full bg-border sm:block" />}
                <h3 className="mt-4 font-semibold">{s.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Planos</h2>
          <p className="mt-2 text-muted-foreground">
            Comece grátis. Escale quando quiser.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.name} className={plan.highlighted ? 'border-primary ring-2 ring-primary/20' : ''}>
              <CardHeader>
                {plan.highlighted && (
                  <Badge className="mb-2 w-fit">Mais popular</Badge>
                )}
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  asChild
                >
                  <Link href="/cadastro">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold">
            Pronto para automatizar seu canal?
          </h2>
          <p className="mt-4 text-muted-foreground">
            14 dias grátis. Sem cartão de crédito. Cancele quando quiser.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/cadastro">
              Criar conta grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-xs">
              V
            </div>
            <span className="text-sm font-medium">Videomnix</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} DB8 Intelligence. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
