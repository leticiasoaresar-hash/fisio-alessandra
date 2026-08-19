import { useEffect, useRef, useState } from 'react'
import { exportBackup, getSettings, importBackup, saveSettings } from '../repo'
import { Screen, TopBar, Card, Field, TextInput, PrimaryButton, SecondaryButton } from '../components/ui'
import { DownloadIcon } from '../components/icons'
import type { BackupData } from '../types'

export function Settings() {
  const [name, setName] = useState('')
  const [credential, setCredential] = useState('')
  const [phone, setPhone] = useState('')
  const [saved, setSaved] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getSettings().then((s) => {
      if (s) {
        setName(s.name)
        setCredential(s.credential ?? '')
        setPhone(s.phone ?? '')
      }
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await saveSettings({ name: name.trim(), credential: credential.trim() || undefined, phone: phone.trim() || undefined })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleExport() {
    const data = await exportBackup()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const dateStamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `fisioapp-backup-${dateStamp}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!confirm('Importar este backup vai substituir todos os dados atuais do app. Deseja continuar?')) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as BackupData
      if (!Array.isArray(data.patients) || !Array.isArray(data.sessions)) {
        throw new Error('Arquivo inválido')
      }
      await importBackup(data)
      setImportMessage('Backup importado com sucesso!')
      getSettings().then((s) => {
        if (s) {
          setName(s.name)
          setCredential(s.credential ?? '')
          setPhone(s.phone ?? '')
        }
      })
    } catch {
      setImportMessage('Não foi possível importar este arquivo. Verifique se é um backup válido do FisioApp.')
    } finally {
      setTimeout(() => setImportMessage(''), 4000)
    }
  }

  return (
    <Screen>
      <TopBar title="Ajustes" />

      <div className="px-4 py-4 flex flex-col gap-6">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-charcoal">Seus dados (usados nos recibos)</p>
          <Field label="Nome completo">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Alessandra Souza" />
          </Field>
          <Field label="Registro profissional (CREFITO)" hint="Opcional">
            <TextInput value={credential} onChange={(e) => setCredential(e.target.value)} placeholder="Ex: CREFITO-3 000000-F" />
          </Field>
          <Field label="Seu telefone / WhatsApp" hint="Opcional">
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: (11) 99999-9999" />
          </Field>
          <PrimaryButton type="submit">{saved ? 'Salvo!' : 'Salvar dados'}</PrimaryButton>
        </form>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-charcoal">Backup dos dados</p>
          <p className="text-xs text-taupe">
            Os dados ficam salvos apenas neste aparelho. Faça backup regularmente para não correr o risco de perder
            tudo se o celular for perdido, trocado ou resetado.
          </p>
          <SecondaryButton onClick={handleExport}>
            <DownloadIcon className="w-5 h-5" />
            Exportar backup
          </SecondaryButton>
          <SecondaryButton onClick={handleImportClick}>Importar backup</SecondaryButton>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          {importMessage && <p className="text-sm text-brick text-center">{importMessage}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-charcoal">Instalar na tela inicial</p>
          <Card className="text-sm text-charcoal/80">
            No celular, abra o menu do navegador e toque em <strong>"Adicionar à tela inicial"</strong> (Android) ou{' '}
            <strong>"Adicionar à Tela de Início"</strong> pelo botão de compartilhar (iPhone). O FisioApp vai
            funcionar como um aplicativo, sem precisar de loja de aplicativos.
          </Card>
        </div>

        <Card className="bg-cloud text-xs text-charcoal/70 leading-relaxed">
          O FisioApp é uma ferramenta de apoio para organizar sessões, cobranças e comunicação com as famílias. Ele{' '}
          <strong>não substitui</strong> o controle financeiro, contábil ou fiscal oficial. Consulte um contador para
          suas obrigações legais.
        </Card>
      </div>
    </Screen>
  )
}
