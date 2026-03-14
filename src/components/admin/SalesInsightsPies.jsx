import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import Card from '@components/Card'

const CATEGORY_COLORS = ['#2563eb', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16']
const LOCATION_COLORS = ['#1d4ed8', '#059669', '#dc2626', '#7c3aed', '#ea580c', '#0891b2']
const MIX_COLORS = ['#f43f5e', '#94a3b8']

const currency = (value) => `$${(Number(value) || 0).toFixed(2)}`

function ChartCard({ title, subtitle, data, colors, dataKey = 'value', nameKey = 'name', formatter }) {
  const hasData = data.some((item) => Number(item[dataKey]) > 0)

  return (
    <Card className="border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>

      {!hasData ? (
        <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
          No hay datos para este grafico
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey={nameKey}
                innerRadius={52}
                outerRadius={88}
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell key={`${entry[nameKey]}-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatter ? formatter(value) : value}
                contentStyle={{ borderRadius: 12, borderColor: '#cbd5e1' }}
              />
              <Legend verticalAlign="bottom" height={42} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

export default function SalesInsightsPies({ categoryData, locationBreakdown, summary }) {
  const topCategoriesByRevenue = categoryData
    .slice(0, 6)
    .map((category) => ({
      name: category.category || 'Sin categoria',
      value: Number(category.total_revenue) || 0,
    }))

  const topCategoriesByUnits = categoryData
    .slice(0, 6)
    .map((category) => ({
      name: category.category || 'Sin categoria',
      value: Number(category.total_units) || 0,
    }))

  const revenueByLocation = locationBreakdown.map((location) => ({
    name: location.location_name,
    value: Number(location.total_revenue) || 0,
  }))

  const perfumeRevenue = Number(summary.perfumeRevenue) || 0
  const otherRevenue = Math.max(0, (Number(summary.totalRevenue) || 0) - perfumeRevenue)
  const salesMix = [
    { name: 'Perfumes', value: perfumeRevenue },
    { name: 'Otras categorias', value: otherRevenue },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ChartCard
        title="Ingresos por categoria"
        subtitle="Distribucion del dinero vendido por categoria"
        data={topCategoriesByRevenue}
        colors={CATEGORY_COLORS}
        formatter={currency}
      />
      <ChartCard
        title="Unidades por categoria"
        subtitle="Participacion por volumen de productos vendidos"
        data={topCategoriesByUnits}
        colors={CATEGORY_COLORS}
      />
      <ChartCard
        title="Ingresos por ubicacion"
        subtitle="Como se reparte la facturacion entre sucursales"
        data={revenueByLocation}
        colors={LOCATION_COLORS}
        formatter={currency}
      />
      <ChartCard
        title="Perfumes vs otras categorias"
        subtitle="Peso de perfumes dentro del total vendido"
        data={salesMix}
        colors={MIX_COLORS}
        formatter={currency}
      />
    </div>
  )
}
