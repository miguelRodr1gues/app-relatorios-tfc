import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function BarChart() {
  const data = [
    { month: 'Jan', value: 18, id: 'jan' },
    { month: 'Fev', value: 24, id: 'fev' },
    { month: 'Mar', value: 21, id: 'mar' },
    { month: 'Abr', value: 32, id: 'abr' },
    { month: 'Mai', value: 28, id: 'mai' },
    { month: 'Jun', value: 38, id: 'jun' },
    { month: 'Jul', value: 35, id: 'jul' },
    { month: 'Ago', value: 42, id: 'ago' },
    { month: 'Set', value: 36, id: 'set' },
    { month: 'Out', value: 48, id: 'out' },
    { month: 'Nov', value: 44, id: 'nov' },
    { month: 'Dez', value: 52, id: 'dez' },
  ];

  return (
    <div className="bg-white dark:bg-[#2a2a2a] rounded-[20px] shadow-sm border border-[#f3f4f6] dark:border-[#3a3a3a] p-6 hover:shadow-md transition-all animate-[fadeUp_0.4s_ease_both]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[17px] font-semibold text-[#1f2937] dark:text-white">Análise de Relatórios</h3>
        <div className="flex gap-2">
          <button className="text-[12px] font-medium text-[#9ca3af] dark:text-[#6b7280] px-3 py-1.5 rounded-full border border-[#e5e7eb] dark:border-[#3a3a3a] hover:bg-[#f9fafb] dark:hover:bg-[#3a3a3a] transition-all">
            Semanal
          </button>
          <button className="text-[12px] font-semibold text-[#2d6a4f] px-3 py-1.5 rounded-full border border-[#2d6a4f] bg-[#f0fdf4] dark:bg-[#1b4332] dark:text-[#86efac] transition-all">
            Mensal
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px]" style={{ minHeight: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} id="reports-chart" margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: 'Poppins' }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: 'Poppins' }}
              axisLine={false}
              tickLine={false}
              stroke="#f3f4f6"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#fff',
                padding: '8px 12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
              formatter={(value: any) => [`${value} relatórios`, '']}
              cursor={{ fill: 'rgba(45, 106, 79, 0.1)', radius: 8 }}
            />
            <Bar dataKey="value" radius={[10, 10, 0, 0]} isAnimationActive={false}>
              {data.map((entry, index) => (
                <Cell
                  key={`bar-cell-${entry.id}`}
                  fill={
                    index === data.length - 1
                      ? '#2d6a4f'
                      : index === data.length - 2
                      ? '#52b788'
                      : '#d1fae5'
                  }
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}