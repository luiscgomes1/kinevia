import { type ReactElement } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HelpTooltipProps {
  content: React.ReactNode
  children: ReactElement
}

export function HelpTooltip({ content, children }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>

      <TooltipContent>
        {content}
      </TooltipContent>
    </Tooltip>
  )
}