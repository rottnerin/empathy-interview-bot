import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function cn(...inputs: (string | undefined)[]) {
  return twMerge(clsx(inputs))
}

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const { className, variant = 'primary', ...rest } = props
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none'
  const variants = {
    primary: 'bg-foreground text-background hover:opacity-90',
    secondary: 'bg-secondary text-foreground hover:opacity-90',
    ghost: 'hover:bg-accent',
  }
  return <button className={cn(base, variants[variant], className)} {...rest} />
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return <input className={cn('flex h-10 w-full rounded-md bg-background border px-3 py-2 text-sm', className)} {...rest} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props
  return <textarea className={cn('flex w-full rounded-md bg-background border px-3 py-2 text-sm min-h-[120px]', className)} {...rest} />
}
