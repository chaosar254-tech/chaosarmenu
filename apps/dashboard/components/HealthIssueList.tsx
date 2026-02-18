'use client'

import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export interface HealthIssue {
  id: string
  type: 'missing_photo' | 'missing_allergens' | 'missing_ingredients' | 'missing_upsell' | 'missing_ar'
  message: string
  itemId?: string
  itemName?: string
  severity: 'warning' | 'error'
}

interface HealthIssueListProps {
  issues: HealthIssue[]
}

export default function HealthIssueList({ issues }: HealthIssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="text-2xl">✅</div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">Menü Sağlığı</h3>
            <p className="text-sm text-gray-500">Tüm ürünler tamamlanmış görünüyor!</p>
          </div>
        </div>
      </div>
    )
  }

  const issueLabels: Record<HealthIssue['type'], string> = {
    missing_photo: 'Fotoğraf eksik',
    missing_allergens: 'Alerjen bilgisi eksik',
    missing_ingredients: 'İçindekiler eksik',
    missing_upsell: 'Yanında iyi gider önerisi yok',
    missing_ar: 'AR modeli eksik',
  }

  const issueIcons: Record<HealthIssue['type'], string> = {
    missing_photo: '📷',
    missing_allergens: '⚠️',
    missing_ingredients: '📝',
    missing_upsell: '💰',
    missing_ar: '📱',
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Menü Sağlığı</h3>
        </div>
        {issues.length > 0 && (
          <Link
            href="/dashboard/analytics?tab=weak-items"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Tümünü Gör
          </Link>
        )}
      </div>
      <div className="space-y-2">
        {issues.slice(0, 5).map((issue) => (
          <div
            key={issue.id}
            className="flex items-start p-3 rounded-md border border-yellow-200 bg-yellow-50"
          >
            <span className="text-lg mr-2">{issueIcons[issue.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {issueLabels[issue.type]}
              </p>
              {issue.itemName && (
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {issue.itemName}
                </p>
              )}
            </div>
          </div>
        ))}
        {issues.length > 5 && (
          <p className="text-xs text-gray-500 text-center pt-2">
            +{issues.length - 5} daha fazla sorun
          </p>
        )}
      </div>
    </div>
  )
}

