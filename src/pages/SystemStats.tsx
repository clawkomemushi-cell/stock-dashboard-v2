import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { LoadingSpinner, ErrorDisplay } from '../components/ui/LoadingSpinner'
import type { FileHealth, PerformanceHistory } from '../types'

interface Props {
  data: PerformanceHistory | null
  loading: boolean
  error: string | null
  healthMap: Record<string, FileHealth>
}

function KpiBox({ label, value, sub, color = 'text-text-primary' }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="card p-4">
      <p className="label mb-1.5">{label}</p>
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  )
}

const verdictColor = (v: string) =>
  v === 'correct' ? '#22c55e' : v === 'incorrect' ? '#ef4444' : '#f59e0b'

export function SystemStats({ data, loading, error }: Props) {
  if (loading) return <LoadingSpinner message="載入系統績效..." />
  if (error)   return <ErrorDisplay message={error} />
  if (!data)   return <ErrorDisplay message="找不到績效資料" />

  const { summary, bias_analysis, monthly_stats, records } = data

  const chartData = [...records].reverse().slice(-15).map((r, i) => ({
    name: r.date.slice(5),
    score: r.thesis_score,
    confidence: Math.round(r.confidence * 100),
    pnl: r.paper_trade_pnl,
    verdict: r.direction_verdict,
    index: i,
  }))

  const calibrationData = records.map((r) => ({
    confidence: Math.round(r.confidence * 100),
    correct: r.direction_verdict === 'correct' ? 100 : 0,
  }))

  const biasData = [
    { name: '多頭偏誤', value: Math.round(bias_analysis.bull_bias_rate * 100) },
    { name: '空頭偏誤', value: Math.round(bias_analysis.bear_bias_rate * 100) },
    { name: '過度自信', value: Math.round(bias_analysis.overconfidence_rate * 100) },
    { name: '盤中翻轉', value: Math.round(bias_analysis.morning_vs_intraday_flip_rate * 100) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">系統績效</h1>
        <p className="text-sm text-text-muted mt-0.5">
          共 {data.total_records} 筆記錄 · 更新 {data.generated_at_label}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiBox label="整體勝率"   value={`${Math.round(summary.overall_win_rate * 100)}%`}   color={summary.overall_win_rate >= 0.6 ? 'text-bull' : 'text-bear'} />
        <KpiBox label="方向準確率" value={`${Math.round(summary.direction_accuracy * 100)}%`} color={summary.direction_accuracy >= 0.65 ? 'text-bull' : 'text-bear'} />
        <KpiBox label="平均準確分" value={summary.avg_thesis_score.toFixed(1)} color={summary.avg_thesis_score >= 65 ? 'text-bull' : 'text-bear'} sub="/ 100 分" />
        <KpiBox label="平均信心度" value={`${Math.round(summary.avg_confidence * 100)}%`} />
        <KpiBox label="累積損益"   value={`${summary.total_paper_pnl >= 0 ? '+' : ''}${(summary.total_paper_pnl / 1000).toFixed(0)}K`} color={summary.total_paper_pnl >= 0 ? 'text-bull' : 'text-bear'} sub="紙上交易" />
        <KpiBox label="紙上勝率"   value={`${Math.round(summary.paper_win_rate * 100)}%`}     color={summary.paper_win_rate >= 0.6 ? 'text-bull' : 'text-bear'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <p className="section-title mb-4">論點準確分趨勢（近 15 日）</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2d3748', borderRadius: '6px' }} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#6366f1' }} />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2}
                dot={(props) => {
                  const d = chartData[props.index]
                  return <circle key={props.index} cx={props.cx} cy={props.cy} r={4} fill={verdictColor(d?.verdict ?? '')} stroke="none" />
                }}
              />
              <Line type="monotone" dataKey="confidence" stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 2" dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-text-muted"><span className="w-3 h-0.5 bg-accent inline-block" /> 準確分</span>
            <span className="flex items-center gap-1.5 text-xs text-text-muted"><span className="w-3 h-0.5 bg-warning inline-block" /> 信心度</span>
            <span className="text-xs text-bull">● 正確</span>
            <span className="text-xs text-bear">● 錯誤</span>
            <span className="text-xs text-warning">● 部分</span>
          </div>
        </div>

        <div className="card p-5">
          <p className="section-title mb-4">偏誤分析</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={biasData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" horizontal={false} />
              <XAxis type="number" domain={[0, 50]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={70} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2d3748', borderRadius: '6px' }} formatter={(v) => [`${v}%`, '發生率']} itemStyle={{ color: '#f59e0b' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {biasData.map((entry, i) => (
                  <Cell key={i} fill={entry.value > 30 ? '#ef4444' : entry.value > 20 ? '#f59e0b' : '#22c55e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-border"><p className="section-title">月份績效</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-base/50">
                <th className="px-4 py-2.5 text-left label">月份</th>
                <th className="px-4 py-2.5 text-right label">勝率</th>
                <th className="px-4 py-2.5 text-right label">平均分</th>
                <th className="px-4 py-2.5 text-right label">損益</th>
                <th className="px-4 py-2.5 text-right label">交易天數</th>
              </tr>
            </thead>
            <tbody>
              {monthly_stats.map((m) => (
                <tr key={m.month} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3 font-mono text-text-primary">{m.month}</td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${m.win_rate >= 0.6 ? 'text-bull' : 'text-bear'}`}>{Math.round(m.win_rate * 100)}%</td>
                  <td className={`px-4 py-3 text-right font-mono ${m.avg_score >= 65 ? 'text-bull' : 'text-bear'}`}>{m.avg_score.toFixed(1)}</td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${m.total_pnl >= 0 ? 'text-bull' : 'text-bear'}`}>{m.total_pnl >= 0 ? '+' : ''}{(m.total_pnl / 1000).toFixed(1)}K</td>
                  <td className="px-4 py-3 text-right text-text-secondary">{m.trade_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5">
        <p className="section-title mb-1">信心度校準圖</p>
        <p className="text-xs text-text-muted mb-4">理想狀態：高信心度應對應高準確率，點集中在對角線附近</p>
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="confidence" name="信心度" type="number" domain={[40, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
            <YAxis dataKey="correct" name="結果" type="number" domain={[-20, 120]} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => v === 100 ? '正確' : v === 0 ? '錯誤' : ''} />
            <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2d3748', borderRadius: '6px' }} formatter={(v, name) => [name === 'correct' ? (v === 100 ? '正確' : '錯誤') : `${v}%`, name === 'correct' ? '預測結果' : '信心度']} />
            <Scatter data={calibrationData} fill="#6366f1" opacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
