import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeftIcon } from './icons'

export function Screen({ children }: { children: ReactNode }) {
  return <div className="flex flex-col flex-1 pb-24">{children}</div>
}

export function TopBar({
  title,
  backTo,
  action,
}: {
  title: string
  backTo?: string
  action?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-cloud px-4 py-3 flex items-center gap-2">
      {backTo ? (
        <Link
          to={backTo}
          className="p-2 -ml-2 rounded-full active:bg-cloud text-charcoal shrink-0"
          aria-label="Voltar"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </Link>
      ) : null}
      <h1 className="text-lg font-semibold text-charcoal flex-1 truncate">{title}</h1>
      {action}
    </header>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-charcoal">{label}</span>
      {children}
      {hint ? <span className="text-xs text-taupe">{hint}</span> : null}
    </label>
  )
}

const inputClasses =
  'w-full rounded-xl border border-taupe/50 bg-white px-4 py-3 text-base text-charcoal placeholder:text-taupe focus:outline-none focus:ring-2 focus:ring-brick focus:border-brick'

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClasses} ${props.className ?? ''}`} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClasses} resize-none ${props.className ?? ''}`} />
}

export function Select(props: InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const { children, ...rest } = props
  return (
    // eslint-disable-next-line jsx-a11y/no-onchange
    <select {...(rest as any)} className={`${inputClasses} ${props.className ?? ''}`}>
      {children}
    </select>
  )
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full rounded-xl bg-brick text-white text-base font-semibold py-3.5 px-4 active:bg-brick-dark disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center justify-center gap-2 ${props.className ?? ''}`}
    />
  )
}

export function SecondaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full rounded-xl bg-cloud text-charcoal text-base font-semibold py-3.5 px-4 active:bg-taupe/30 disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center justify-center gap-2 ${props.className ?? ''}`}
    />
  )
}

export function OutlineButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full rounded-xl border-2 border-brick text-brick text-base font-semibold py-3 px-4 active:bg-brick/5 disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center justify-center gap-2 ${props.className ?? ''}`}
    />
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-cloud bg-white p-4 shadow-sm ${className ?? ''}`}>{children}</div>
}

export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 px-6 py-16">
      <p className="text-base font-semibold text-charcoal">{title}</p>
      {subtitle ? <p className="text-sm text-taupe">{subtitle}</p> : null}
      {action}
    </div>
  )
}

export function LabelText(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={`text-sm font-medium text-charcoal ${props.className ?? ''}`} />
}
