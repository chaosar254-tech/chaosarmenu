import HealthIssueList, { HealthIssue } from './HealthIssueList'

interface DashboardHealthIssuesProps {
  issues: HealthIssue[]
  hasItems: boolean
}

export default function DashboardHealthIssues({ 
  issues,
  hasItems
}: DashboardHealthIssuesProps) {
  if (!hasItems) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-sm text-gray-500">Henüz ürün eklenmemiş.</p>
      </div>
    )
  }

  return <HealthIssueList issues={issues} />
}

