import type { VercelRequest, VercelResponse } from '@vercel/node'

const ANTHROPIC_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-5'
const MAX_INPUT_CHARS = 4000

interface RequestBody {
  patientName?: string
  monthLabel?: string
  notes?: string
  extra?: string
  therapistName?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({
      error: 'A chave da API da Claude ainda não foi configurada neste servidor (variável ANTHROPIC_API_KEY).',
    })
    return
  }

  const body = (req.body ?? {}) as RequestBody
  const patientName = (body.patientName ?? '').trim().slice(0, 200)
  const monthLabel = (body.monthLabel ?? '').trim().slice(0, 60)
  const notes = (body.notes ?? '').trim().slice(0, MAX_INPUT_CHARS)
  const extra = (body.extra ?? '').trim().slice(0, MAX_INPUT_CHARS)
  const therapistName = (body.therapistName ?? '').trim().slice(0, 200)

  if (!patientName || (!notes && !extra)) {
    res.status(400).json({ error: 'Informe o nome do paciente e ao menos uma anotação sobre o mês.' })
    return
  }

  const rawNotes = [notes, extra].filter(Boolean).join('\n\n')

  const prompt = `Você ajuda uma fisioterapeuta que atende pacientes idosos em domicílio a se comunicar com a família de cada paciente.

Transforme as anotações soltas dela abaixo em uma mensagem para ser enviada por WhatsApp à família de ${patientName}, contando como foi a evolução no mês de ${monthLabel}.

Anotações da fisioterapeuta (podem estar desorganizadas, em tópicos ou frases soltas):
"""
${rawNotes}
"""

Regras para a mensagem:
- Tom acolhedor, humano e claro, sem jargão técnico excessivo (a família não é da área da saúde).
- Comece cumprimentando a família e mencionando o nome do paciente.
- Organize as informações de forma legível (pode usar parágrafos curtos).
- Baseie-se apenas nas anotações fornecidas; não invente informações, resultados ou diagnósticos que não foram mencionados.
- Termine de forma positiva e, se fizer sentido pelas anotações, com uma orientação prática para a família.
- Assine como "${therapistName || 'a fisioterapeuta'}" ao final, de forma simples.
- Não use markdown, apenas texto simples pronto para copiar e colar no WhatsApp.
- Escreva em português do Brasil.

Responda apenas com o texto final da mensagem, sem comentários adicionais.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Erro na API da Claude:', response.status, errText)
      res.status(502).json({ error: 'Não foi possível gerar a mensagem agora. Tente novamente em instantes.' })
      return
    }

    const data = await response.json()
    const message = data?.content?.[0]?.text?.trim()

    if (!message) {
      res.status(502).json({ error: 'A resposta da IA veio vazia. Tente novamente.' })
      return
    }

    res.status(200).json({ message })
  } catch (err) {
    console.error('Falha ao chamar a API da Claude:', err)
    res.status(500).json({ error: 'Erro inesperado ao gerar a mensagem.' })
  }
}
