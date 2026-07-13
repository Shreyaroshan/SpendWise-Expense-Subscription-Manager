import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  progress?: number;
  glowColor: 'emerald' | 'cyan' | 'amber' | 'purple';
  badge?: string;
}

const glowColors = {
  emerald: 'from-[#10B981]/20 to-transparent',
  cyan: 'from-[#22D3EE]/20 to-transparent',
  amber: 'from-[#F59E0B]/20 to-transparent',
  purple: 'from-[#8B5CF6]/20 to-transparent',
};

const progressColors = {
  emerald: 'from-[#10B981] to-[#059669]',
  cyan: 'from-[#22D3EE] to-[#0891B2]',
  amber: 'from-[#F59E0B] to-[#D97706]',
  purple: 'from-[#8B5CF6] to-[#7C3AED]',
};

export default function StatCard({ label, value, icon: Icon, trend, progress, glowColor, badge }: StatCardProps) {
  return (
    <div className="relative bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6 overflow-hidden hover:-translate-y-1 hover:border-[rgba(255,255,255,0.15)] transition-all">
      {/* Glow blob */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-radial ${glowColors[glowColor]} blur-2xl`}></div>
      
      <div className="relative">
        {/* Label and Icon */}
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs text-[#94A3B8] uppercase tracking-wide" style={{ fontFamily: "'Sora', sans-serif" }}>
            {label}
          </span>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${glowColors[glowColor]}`}>
            <Icon className="w-4 h-4 text-[#E2E8F0]" />
          </div>
        </div>

        {/* Value */}
        <div className="mb-3">
          <div className="text-3xl font-medium text-[#E2E8F0] mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
            {value}
          </div>
          
          {/* Trend or Badge */}
          {trend && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              trend.isPositive ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#F43F5E]/10 text-[#F43F5E]'
            }`}>
              {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span style={{ fontFamily: "'DM Mono', monospace" }}>{trend.value}</span>
            </div>
          )}
          
          {badge && (
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#22D3EE]/10 text-[#22D3EE]">
              {badge}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="w-full h-1.5 bg-[#0B1120] rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${progressColors[glowColor]} transition-all duration-500`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
