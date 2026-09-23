import { FiWifi, FiSmartphone, FiZap, FiTv } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function Shortcut() {
  return (
    <div className="grid grid-cols-4 gap-2.5 px-5 pb-5 max-[380px]:grid-cols-2 max-[380px]:gap-2 max-[380px]:px-4 md:px-6 md:pb-6">
      {[
        ['data', 'Data', FiWifi], ['airtime', 'Airtime', FiSmartphone], ['electricity', 'Electricity', FiZap], ['tv', 'TV', FiTv],
      ].map(([id, label, Icon]: any) => (
        <Link
          key={id}
          to={`/utilities?id=${id}`}
          className="flex min-h-[93px] min-w-0 flex-col items-center justify-center gap-3 rounded-md border border-line bg-transparent px-2 py-2 text-center text-[11px] text-ink no-underline hover:border-accent hover:bg-tint md:min-h-[112px] md:gap-[15px] md:text-xs"
        >
          <Icon className="text-[21px] text-accent stroke-[1.5] md:text-[23px]" />
          <span>{label}</span>
        </Link>
      ))}
    </div>
  );
}
