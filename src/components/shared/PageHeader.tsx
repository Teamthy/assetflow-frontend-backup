import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string   // alias for subtitle
  breadcrumb?: BreadcrumbItem[]
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, description, breadcrumb, actions }: PageHeaderProps) {
  const sub = subtitle ?? description
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1 mb-2" aria-label="Breadcrumb">
            {breadcrumb.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                {item.href ? (
                  <Link href={item.href} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-sm text-slate-600 font-medium">{item.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {sub && <p className="text-slate-500 mt-1">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
