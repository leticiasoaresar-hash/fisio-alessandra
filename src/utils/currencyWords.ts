const UNITS = [
  'zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove',
]
const TENS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const HUNDREDS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

// Converte um número de 0 a 999 para texto por extenso.
function triadToWords(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cem'

  const h = Math.floor(n / 100)
  const rest = n % 100
  const parts: string[] = []

  if (h > 0) parts.push(HUNDREDS[h])

  if (rest > 0) {
    if (rest < 20) {
      parts.push(UNITS[rest])
    } else {
      const t = Math.floor(rest / 10)
      const u = rest % 10
      parts.push(u > 0 ? `${TENS[t]} e ${UNITS[u]}` : TENS[t])
    }
  }

  return parts.join(' e ')
}

const SCALES = ['', ' mil', ' milhão', ' bilhão']
const SCALES_PLURAL = ['', ' mil', ' milhões', ' bilhões']

function integerToWords(value: number): string {
  if (value === 0) return 'zero'

  const triads: number[] = []
  let remaining = Math.floor(value)
  while (remaining > 0) {
    triads.push(remaining % 1000)
    remaining = Math.floor(remaining / 1000)
  }

  const groups: string[] = []
  for (let i = triads.length - 1; i >= 0; i--) {
    const triad = triads[i]
    if (triad === 0) continue
    const omitUm = triad === 1 && i === 1 // "mil", não "um mil" — mas "um milhão", "um bilhão"
    const scaleWord = triad === 1 && i > 0 ? SCALES[i] : SCALES_PLURAL[i]
    const triadWords = omitUm ? '' : triadToWords(triad)
    groups.push(`${triadWords}${scaleWord}`.trim())
  }

  if (groups.length === 1) return groups[0]

  // "e" antes do último grupo quando ele é menor que 100 (ou centena "redonda")
  const last = triads[0]
  const connector = last > 0 && (last < 100 || last % 100 === 0) ? ' e ' : ', '
  return groups.slice(0, -1).join(', ') + connector + groups[groups.length - 1]
}

/**
 * Converte um valor monetário (em reais) para texto por extenso em português,
 * no formato usado em recibos: "oitocentos e oito reais" ou
 * "cento e vinte e três reais e quarenta e cinco centavos".
 */
export function currencyToWordsBRL(value: number): string {
  const rounded = Math.round(Math.abs(value) * 100) / 100
  const integerPart = Math.floor(rounded)
  const cents = Math.round((rounded - integerPart) * 100)

  const realWord = integerPart === 1 ? 'real' : 'reais'
  const centWord = cents === 1 ? 'centavo' : 'centavos'

  if (integerPart === 0 && cents === 0) return 'zero reais'
  if (integerPart === 0) return `${integerToWords(cents)} ${centWord}`

  const integerWords = `${integerToWords(integerPart)} ${realWord}`
  if (cents === 0) return integerWords

  return `${integerWords} e ${integerToWords(cents)} ${centWord}`
}
