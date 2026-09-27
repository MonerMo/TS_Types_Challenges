// Type-checks every challenge and records which ones are solved in README.md.
//
//   npm run check              check everything and refresh the progress table
//   npm run check -- 4 pick    also print the errors of the matching challenges
//   npm run check -- --quiet   one-line summary only (used by the pre-commit hook)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readmePath = path.join(root, 'README.md')
const START = '<!-- progress:start -->'
const END = '<!-- progress:end -->'

const difficulties = [
  ['warm', 'Warm-up'],
  ['easy', 'Easy'],
  ['medium', 'Medium'],
  ['hard', 'Hard'],
  ['extreme', 'Extreme'],
]

const args = process.argv.slice(2)
const quiet = args.includes('--quiet')
const filters = args.filter(arg => !arg.startsWith('--')).map(arg => arg.toLowerCase())

const { config } = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile)
const { options, fileNames } = ts.parseJsonConfigFileContent(config, ts.sys, root)
const program = ts.createProgram(fileNames, options)

const formatHost = {
  getCanonicalFileName: fileName => fileName,
  getCurrentDirectory: () => root,
  getNewLine: () => '\n',
}

const challenges = fileNames.map((fileName) => {
  const relative = path.relative(root, fileName).replaceAll('\\', '/')
  const [, folder, file] = relative.split('/')
  const slug = file.replace(/\.ts$/, '')
  const no = Number(slug.match(/^\d+/)?.[0])
  const sourceFile = program.getSourceFile(fileName)
  const title = sourceFile.text.match(/^\s*\d+ - (.+)$/m)?.[1].trim() ?? slug
  const errors = [
    ...program.getSyntacticDiagnostics(sourceFile),
    ...program.getSemanticDiagnostics(sourceFile),
  ].filter(d => d.category === ts.DiagnosticCategory.Error)

  return {
    no,
    slug,
    title,
    relative,
    difficulty: folder.replace(/^\d+-/, ''),
    solved: errors.length === 0,
    errors,
  }
}).sort((a, b) => a.no - b.no)

const globalErrors = [...program.getOptionsDiagnostics(), ...program.getGlobalDiagnostics()]
if (globalErrors.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(globalErrors, formatHost))
  process.exit(1)
}

function bar(done, total, width = 10) {
  const filled = total ? Math.round((done / total) * width) : 0
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

const percent = (done, total) => `${total ? Math.floor((done / total) * 100) : 0}%`
const escapeMd = text => text.replace(/[[\]<>|]/g, char => `\\${char}`)

function progressMarkdown() {
  const lines = [
    '| Difficulty | Solved | Progress |',
    '| --- | --- | --- |',
  ]
  const sections = []

  for (const [key, label] of difficulties) {
    const group = challenges.filter(c => c.difficulty === key)
    if (!group.length)
      continue
    const done = group.filter(c => c.solved).length
    lines.push(`| ${label} | ${done} / ${group.length} | \`${bar(done, group.length)}\` ${percent(done, group.length)} |`)
    sections.push(
      `<details><summary><b>${label}</b> — ${done} / ${group.length}</summary>`,
      '',
      ...group.map(c => `- [${c.solved ? 'x' : ' '}] ${c.no} · [${escapeMd(c.title)}](${c.relative})`),
      '',
      '</details>',
      '',
    )
  }

  const done = challenges.filter(c => c.solved).length
  lines.push(`| **Total** | **${done} / ${challenges.length}** | \`${bar(done, challenges.length)}\` ${percent(done, challenges.length)} |`)

  return [...lines, '', ...sections].join('\n').trim()
}

function updateReadme() {
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : `# TS Challenges\n\n${START}\n${END}\n`
  const block = `${START}\n${progressMarkdown()}\n${END}`
  const updated = readme.includes(START) && readme.includes(END)
    ? readme.replace(new RegExp(`${START}[\\s\\S]*${END}`), () => block)
    : `${readme.trimEnd()}\n\n${block}\n`
  if (updated !== readme)
    fs.writeFileSync(readmePath, updated)
}

updateReadme()

const done = challenges.filter(c => c.solved).length
if (quiet) {
  console.log(`Progress: ${done} / ${challenges.length} solved`)
  process.exit(0)
}

for (const [key, label] of difficulties) {
  const group = challenges.filter(c => c.difficulty === key)
  if (group.length) {
    const solved = group.filter(c => c.solved).length
    console.log(`${label.padEnd(8)} ${bar(solved, group.length, 20)} ${solved} / ${group.length}`)
  }
}
console.log(`${'Total'.padEnd(8)} ${bar(done, challenges.length, 20)} ${done} / ${challenges.length}\n`)

if (filters.length) {
  const matches = challenges.filter(c => filters.some(f => /^\d+$/.test(f) ? c.no === Number(f) : c.slug.includes(f)))
  if (!matches.length)
    console.log(`No challenge matches: ${filters.join(', ')}`)
  for (const c of matches) {
    console.log(`${c.solved ? '✅' : '❌'} ${c.no} - ${c.title}  (${c.relative})`)
    if (!c.solved)
      console.log(ts.formatDiagnosticsWithColorAndContext(c.errors, formatHost))
  }
}
