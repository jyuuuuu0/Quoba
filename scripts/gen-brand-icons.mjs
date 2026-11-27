// Generates brand icons for supported sources from open icon sets.
// Multicolor logos come from Iconify "logos"; KakaoTalk comes from Simple Icons.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import * as simpleIcons from 'simple-icons'

const require = createRequire(import.meta.url)
const logos = JSON.parse(readFileSync(require.resolve('@iconify-json/logos/icons.json'), 'utf8'))
const outDir = join(import.meta.dirname, '../src/renderer/src/assets/brand')
mkdirSync(outDir, { recursive: true })

function fromIconify(name, transform = (body) => body) {
  const icon = logos.icons[name]
  if (!icon) throw new Error(`Missing Iconify logo: ${name}`)
  const width = icon.width ?? logos.width
  const height = icon.height ?? logos.height
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${transform(icon.body)}</svg>\n`
}

function fromSimpleIcons(icon, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="${icon.path}"/></svg>\n`
}

const icons = {
  gmail: fromIconify('google-gmail'),
  discord: fromIconify('discord-icon'),
  slack: fromIconify('slack-icon'),
  telegram: fromIconify('telegram'),
  whatsapp: fromIconify('whatsapp-icon'),
  notion: fromIconify('notion-icon'),
  obsidian: fromIconify('obsidian-icon'),
  // The GitHub mark is near-black; draw it light so it reads on the dark UI.
  github: fromIconify('github-icon', (body) =>
    body.replaceAll(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="#ECECEE"')
  ),
  kakaotalk: fromSimpleIcons(simpleIcons.siKakaotalk, '#FFCD00')
}

for (const [name, svg] of Object.entries(icons)) writeFileSync(join(outDir, `${name}.svg`), svg)
console.log(`Wrote ${Object.keys(icons).length} brand icons to ${outDir}`)
