import type { TemplateId } from '../core/types';

export function TemplateIcon({
  templateId,
  active,
}: {
  templateId: TemplateId;
  active: boolean;
}) {
  const stroke = active ? 'var(--accent-amber)' : 'currentColor';

  switch (templateId) {
    case '35mm-sprocket':
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <rect x="4" y="8" width="32" height="24" rx="2" stroke={stroke} strokeWidth="1.8" />
          <rect x="6" y="14" width="28" height="12" rx="1" fill={stroke} fillOpacity="0.22" stroke={stroke} strokeWidth="1.2" />
          {[5.2, 9.2, 13.2, 17.2, 21.2, 25.2, 29.2, 33.2].map((x) => (
            <g key={x}>
              <rect x={x} y="9.8" width="1.6" height="2.4" rx="0.4" fill={stroke} />
              <rect x={x} y="27.8" width="1.6" height="2.4" rx="0.4" fill={stroke} />
            </g>
          ))}
        </svg>
      );
    case 'film-rebate':
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <rect x="5" y="7" width="30" height="26" rx="1.5" stroke={stroke} strokeWidth="2.2" />
          <rect x="9" y="12" width="22" height="16" rx="2" fill={stroke} fillOpacity="0.2" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );
    case 'minimal-matte':
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <rect x="6" y="6" width="28" height="28" rx="1" stroke={stroke} strokeWidth="1.2" strokeOpacity="0.45" />
          <rect x="11" y="10" width="18" height="15" fill={stroke} fillOpacity="0.2" stroke={stroke} strokeWidth="1.5" />
          <line x1="14" y1="29" x2="26" y2="29" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'editorial-card':
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <rect x="7" y="5" width="26" height="30" rx="1.5" stroke={stroke} strokeWidth="1.6" />
          <rect x="10" y="8" width="20" height="14" fill={stroke} fillOpacity="0.2" />
          <line x1="10" y1="25.5" x2="22" y2="25.5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="10" y1="29.5" x2="29" y2="29.5" stroke={stroke} strokeWidth="1.2" strokeOpacity="0.7" strokeLinecap="round" />
          <line x1="10" y1="32.5" x2="25" y2="32.5" stroke={stroke} strokeWidth="1.2" strokeOpacity="0.7" strokeLinecap="round" />
        </svg>
      );
    case 'half-frame-single':
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <rect x="10" y="4" width="20" height="32" rx="2" stroke={stroke} strokeWidth="1.8" />
          <rect x="12.5" y="10.5" width="15" height="19" rx="1" fill={stroke} fillOpacity="0.22" stroke={stroke} strokeWidth="1.2" />
          {[11.6, 16.6, 21.6, 26.6].map((x) => (
            <g key={x}>
              <rect x={x} y="5.8" width="1.8" height="2.7" rx="0.4" fill={stroke} />
              <rect x={x} y="31.5" width="1.8" height="2.7" rx="0.4" fill={stroke} />
            </g>
          ))}
        </svg>
      );
    case 'half-frame-diptych':
      return (
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <rect x="4" y="8" width="32" height="24" rx="2" stroke={stroke} strokeWidth="1.8" />
          <rect x="6.5" y="14" width="12.2" height="12" rx="1" fill={stroke} fillOpacity="0.22" stroke={stroke} strokeWidth="1.2" />
          <rect x="21.3" y="14" width="12.2" height="12" rx="1" fill={stroke} fillOpacity="0.22" stroke={stroke} strokeWidth="1.2" />
          {[5.2, 9.2, 13.2, 17.2, 21.2, 25.2, 29.2, 33.2].map((x) => (
            <g key={x}>
              <rect x={x} y="9.8" width="1.6" height="2.4" rx="0.4" fill={stroke} />
              <rect x={x} y="27.8" width="1.6" height="2.4" rx="0.4" fill={stroke} />
            </g>
          ))}
        </svg>
      );
  }
}
