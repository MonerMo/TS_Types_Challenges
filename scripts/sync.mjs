// Downloads the latest type-challenges questions and adds any you don't have yet
// to challenges/<difficulty>/. Existing files are never touched, so your answers are safe.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const upstreamDir = path.join(root, '.upstream')
const challengesDir = path.join(root, 'challenges')
const upstreamUrl = 'https://github.com/type-challenges/type-challenges.git'

// Numeric prefixes keep the folders in difficulty order in the file explorer.
const difficultyFolders = {
  warm: '0-warm',
  easy: '1-easy',
  medium: '2-medium',
  hard: '3-hard',
  extreme: '4-extreme',
}

function git(...args) {
  execFileSync('git', args, { stdio: 'inherit' })
}

function fetchUpstream() {
  if (fs.existsSync(path.join(upstreamDir, '.git'))) {
    git('-C', upstreamDir, 'fetch', '--quiet', '--depth', '1', 'origin', 'main')
    git('-C', upstreamDir, 'reset', '--quiet', '--hard', 'FETCH_HEAD')
  }
  else {
    git('clone', '--quiet', '--depth', '1', upstreamUrl, upstreamDir)
  }
}

// Challenge numbers already present locally, whatever folder/name they ended up under.
function existingNumbers() {
  const numbers = new Set()
  if (!fs.existsSync(challengesDir))
    return numbers
  for (const folder of fs.readdirSync(challengesDir)) {
    const dir = path.join(challengesDir, folder)
    if (!fs.statSync(dir).isDirectory())
      continue
    for (const file of fs.readdirSync(dir)) {
      const match = file.match(/^(\d+)-/)
      if (match)
        numbers.add(Number(match[1]))
    }
  }
  return numbers
}

const commentBlock = text => `/*\n${
  text
    .replaceAll('*/', '*\\/')
    .trim()
    .split('\n')
    .map(line => line.trim() ? `  ${line}`.trimEnd() : '')
    .join('\n')
}\n*/\n`

const divider = text => `\n/* _____________ ${text} _____________ */\n`

function toCode({ no, info, readme, template, tests }) {
  const tags = (Array.isArray(info.tags) ? info.tags : String(info.tags ?? '').split(','))
    .map(tag => tag.trim())
    .filter(Boolean)
  const author = info.author?.github
    ? `${info.author.name} (@${info.author.github})`
    : info.author?.name ?? 'unknown'
  const body = readme
    .replace(/<!--info-header-start-->[\s\S]*?<!--info-header-end-->/, '')
    .replace(/<!--info-footer-start-->[\s\S]*?<!--info-footer-end-->/, '')
    .trim()

  return `${commentBlock(
    `${no} - ${info.title}\n`
    + '-------\n'
    + `by ${author} ${[info.difficulty, ...tags].map(tag => `#${tag}`).join(' ')}\n\n`
    + '### Question\n\n'
    + `${body}\n\n`
    + `> View on GitHub: https://tsch.js.org/${no}`,
  )}${divider('Your Code Here')}\n${template.trim()}\n${divider('Test Cases')}${tests.trim()}\n${divider('Further Steps')}${commentBlock(
    `> Share your solutions: https://tsch.js.org/${no}/answer\n`
    + `> View solutions: https://tsch.js.org/${no}/solutions\n`
    + '> More Challenges: https://tsch.js.org',
  )}`
}

function sync() {
  fetchUpstream()

  const questionsDir = path.join(upstreamDir, 'questions')
  const have = existingNumbers()
  let added = 0

  for (const folder of fs.readdirSync(questionsDir).sort()) {
    const match = folder.match(/^(\d+)-(\w+)-(.+)$/)
    if (!match)
      continue
    const [, paddedNo, difficulty, slug] = match
    const no = Number(paddedNo)
    if (have.has(no))
      continue

    const dir = path.join(questionsDir, folder)
    const read = name => fs.existsSync(path.join(dir, name))
      ? fs.readFileSync(path.join(dir, name), 'utf8').replaceAll('\r\n', '\n')
      : ''
    const info = YAML.parse(read('info.yml'))

    const target = path.join(challengesDir, difficultyFolders[difficulty] ?? difficulty, `${paddedNo}-${slug}.ts`)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, toCode({
      no,
      info: { ...info, difficulty },
      readme: read('README.md'),
      template: read('template.ts'),
      tests: read('test-cases.ts'),
    }))
    console.log(`  + ${path.relative(root, target)}`)
    added++
  }

  console.log(`\n${added} new challenge(s) added, ${have.size} already present.`)
}

sync()
