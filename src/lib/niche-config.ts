export const NICHES = {
  ia_tech: {
    label: 'IA & Tecnologia',
    emoji: '🤖',
    description: 'Ferramentas de IA, automações, tutoriais de tecnologia',
    rpm_br: { min: 15, max: 45 },
    rpm_en: { min: 12, max: 35 },
    template_style: 'clean',
    posting_times: ['08:00', '19:00'],
  },
  financas: {
    label: 'Finanças & Investimentos',
    emoji: '💰',
    description: 'SELIC, CDI, ações, educação financeira brasileira',
    rpm_br: { min: 25, max: 80 },
    rpm_en: { min: 20, max: 60 },
    template_style: 'financial',
    posting_times: ['07:00', '18:00'],
  },
  curiosidades: {
    label: 'Curiosidades & Fatos Virais',
    emoji: '🧠',
    description: 'Fatos surpreendentes, ciência, história, psicologia',
    rpm_br: { min: 8, max: 18 },
    rpm_en: { min: 6, max: 15 },
    template_style: 'viral',
    posting_times: ['09:00', '20:00'],
  },
  horror: {
    label: 'Horror & Mistério',
    emoji: '👻',
    description: 'True crime, casos reais, paranormal, mistérios',
    rpm_br: { min: 5, max: 14 },
    rpm_en: { min: 8, max: 22 },
    template_style: 'horror',
    posting_times: ['21:00', '22:00'],
  },
  motivacional: {
    label: 'Motivacional & Superação',
    emoji: '⚡',
    description: 'Histórias de superação, biografias, mindset',
    rpm_br: { min: 6, max: 15 },
    rpm_en: { min: 10, max: 28 },
    template_style: 'epic',
    posting_times: ['06:00', '12:00'],
  },
} as const

export type NicheKey = keyof typeof NICHES

export const LANGUAGES = {
  'pt-BR': { label: 'Português (BR)', flag: '🇧🇷' },
  'en-US': { label: 'English (US)', flag: '🇺🇸' },
} as const
