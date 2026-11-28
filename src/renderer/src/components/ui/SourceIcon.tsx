import clsx from 'clsx'
import { FolderOpen, Globe, History, Mail, MessagesSquare, Rss } from 'lucide-react'
import type { SourceId } from '@shared/sources'
import discord from '@/assets/brand/discord.svg'
import github from '@/assets/brand/github.svg'
import gmail from '@/assets/brand/gmail.svg'
import kakaotalk from '@/assets/brand/kakaotalk.svg'
import notion from '@/assets/brand/notion.svg'
import obsidian from '@/assets/brand/obsidian.svg'
import slack from '@/assets/brand/slack.svg'
import telegram from '@/assets/brand/telegram.svg'
import whatsapp from '@/assets/brand/whatsapp.svg'

const brandIcons: Partial<Record<SourceId, string>> = {
  kakaotalk,
  discord,
  slack,
  telegram,
  whatsapp,
  mail: gmail,
  notion,
  obsidian,
  github
}

const fallbackIcons: Partial<Record<SourceId, typeof Mail>> = {
  files: FolderOpen,
  rss: Rss,
  lark: MessagesSquare,
  browser: History
}

export interface SourceIconProps {
  source: SourceId | string
  size?: number
  className?: string
}

export function SourceIcon({ source, size = 14, className }: SourceIconProps): React.JSX.Element {
  const brand = brandIcons[source as SourceId]
  if (brand) {
    return (
      <img
        src={brand}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className={clsx('shrink-0 object-contain', className)}
      />
    )
  }
  const Icon = fallbackIcons[source as SourceId] ?? (source === 'mail' ? Mail : Globe)
  return <Icon aria-hidden="true" size={size} className={clsx('shrink-0 text-fg-muted', className)} />
}
