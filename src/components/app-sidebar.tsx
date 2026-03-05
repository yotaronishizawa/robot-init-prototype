import { BottleWine, Rocket, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

// Inlined from tx-retail/packages/ui/src/components/tx-logo.tsx
function TxLogo({ width = 32 }: { width?: number }) {
  const origWidth = 392;
  const origHeight = 274;
  const height = Math.round(width * (origHeight / origWidth));
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${origWidth} ${origHeight}`}
      width={width}
      height={height}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M 61.00 80.00 L 48.00 80.00 L 38.00 90.00 L 39.00 182.00 L 51.00 182.00 L 62.00 172.00 Z" />
      <path d="M 84.00 44.00 L 74.00 54.00 L 74.00 171.00 L 98.00 172.00 L 98.00 44.00 Z" />
      <path d="M 111.00 34.00 L 111.00 172.00 L 121.00 182.00 L 133.00 182.00 L 134.00 43.00 L 125.00 34.00 Z" />
      <path d="M 148.00 70.00 L 147.00 195.00 L 156.00 204.00 L 171.00 204.00 L 171.00 80.00 L 161.00 70.00 Z" />
      <path d="M 207.00 61.00 L 193.00 61.00 L 183.00 71.00 L 184.00 128.00 L 197.00 128.00 L 207.00 118.00 Z" />
      <path d="M 207.00 147.00 L 193.00 147.00 L 183.00 158.00 L 184.00 214.00 L 198.00 214.00 L 207.00 204.00 Z" />
      <path d="M 221.00 70.00 L 220.00 195.00 L 229.00 204.00 L 243.00 204.00 L 244.00 82.00 L 234.00 70.00 Z" />
      <path d="M 257.00 93.00 L 256.00 231.00 L 267.00 241.00 L 279.00 241.00 L 280.00 103.00 L 270.00 93.00 Z" />
      <path d="M 293.00 103.00 L 292.00 230.00 L 307.00 231.00 L 316.00 221.00 L 316.00 103.00 Z" />
      <path d="M 352.00 93.00 L 339.00 93.00 L 329.00 103.00 L 329.00 195.00 L 343.00 195.00 L 352.00 186.00 Z" />
    </svg>
  );
}

const NAV_ITEMS = [
  { title: 'Drinks',     icon: BottleWine, active: false },
  { title: 'Deployment', icon: Rocket,     active: true  },
  { title: 'Settings',   icon: Settings,   active: false },
] as const;

export function AppSidebar() {
  return (
    <aside className="w-12 shrink-0 flex flex-col items-center border-r border-zinc-200 bg-background py-3 gap-3">
      {/* Logo */}
      <div className="flex items-center justify-center">
        <TxLogo width={30} />
      </div>

      {/* Divider */}
      <div className="w-7 h-px bg-zinc-200" />

      {/* Nav icons */}
      <nav className="flex flex-col items-center gap-0.5">
        {NAV_ITEMS.map(({ title, icon: Icon, active }) => (
          <Tooltip key={title}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors
                  ${active
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700'
                  }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{title}</TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </aside>
  );
}
