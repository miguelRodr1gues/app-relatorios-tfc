import { ALERTS } from '../data/mockData';

export default function AlertsCard() {
  return (
    <div className="bg-white rounded-[14px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border-[1.5px] border-[#e8ecf0] animate-[fadeUp_0.4s_ease_both]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="text-sm font-bold text-[#1a2e1a]">Alertas & Avisos</div>
        <div className="bg-[#e63946] text-white text-[9.5px] font-bold px-2 py-0.5 rounded-full">
          3
        </div>
      </div>

      {/* Alerts */}
      <div className="px-5 pb-4">
        {ALERTS.map((alert, index) => (
          <div
            key={`alert-${index}-${alert.time}`}
            className="flex gap-2.5 items-start py-3 border-b border-[#f0f4f1] cursor-pointer last:border-b-0"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
              style={{ backgroundColor: alert.color }}
            ></div>
            <div className="flex-1">
              <div className="text-xs font-medium text-[#1a2e1a] leading-snug">
                {alert.message}
              </div>
              <div className="text-[10.5px] text-[#8fa899] mt-0.5">{alert.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}