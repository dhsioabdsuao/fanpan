import type { ElementType } from '@/types/bazi'
import type { ElementForceReport, FlowLink, LinkStatus } from './types'

const GENERATING_CHAIN: [ElementType, ElementType][] = [
  ['金', '水'],
  ['水', '木'],
  ['木', '火'],
  ['火', '土'],
  ['土', '金'],
]

export function computeFlowLinks(forceReport: ElementForceReport): FlowLink[] {
  const avg = forceReport.average
  const links: FlowLink[] = []

  for (const [from, to] of GENERATING_CHAIN) {
    const fromForce = forceReport.forces[from].force
    const toForce = forceReport.forces[to].force

    const status = classifyLink(fromForce, toForce, avg)

    links.push({ from, to, fromForce, toForce, status })
  }

  return links
}

function classifyLink(fromForce: number, toForce: number, average: number): LinkStatus {
  const threshold = 0.4 * average
  const weakUpper = 0.5 * average

  if (fromForce < threshold || toForce < threshold) return 'blocked'

  const fromWeak = fromForce >= threshold && fromForce < weakUpper
  const toWeak = toForce >= threshold && toForce < weakUpper

  if (fromWeak || toWeak) return 'weak'

  return 'flowing'
}
