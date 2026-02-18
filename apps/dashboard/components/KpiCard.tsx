interface KpiCardProps {
  title: string
  value: string | number
  icon?: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export default function KpiCard({ title, value, icon, subtitle, trend, trendValue }: KpiCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          {icon && (
            <div className="flex-shrink-0">
              <div className="text-2xl">{icon}</div>
            </div>
          )}
          <div className={`${icon ? 'ml-5' : ''} w-0 flex-1`}>
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {trend && trendValue && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend === 'up' ? 'text-green-600' : 
                    trend === 'down' ? 'text-red-600' : 
                    'text-gray-500'
                  }`}>
                    {trend === 'up' && '↑'}
                    {trend === 'down' && '↓'}
                    {trendValue}
                  </div>
                )}
              </dd>
              {subtitle && (
                <dd className="mt-1 text-xs text-gray-500">{subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
