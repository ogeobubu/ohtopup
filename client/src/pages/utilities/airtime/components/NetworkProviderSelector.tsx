import mtn from '../../../../assets/mtn.svg';
import glo from '../../../../assets/glo.svg';
import airtel from '../../../../assets/airtel.svg';
import nineMobile from '../../../../assets/9mobile.svg';

type Provider = { serviceID: string };
type Props = {
  providers?: Provider[];
  selectedProvider?: string;
  onChange: (id: string) => void;
  isSubmitting?: boolean;
};

const NetworkProviderSelector = ({ providers, selectedProvider, onChange, isSubmitting }: Props) => {
  const getProviderImage = (serviceID: string) => {
    const providerMap: Record<string, string> = {
      mtn: mtn,
      'mtn-data': mtn,
      glo: glo,
      'glo-data': glo,
      airtel: airtel,
      'airtel-data': airtel,
      etisalat: nineMobile,
      'etisalat-data': nineMobile,
    };
    return providerMap[serviceID] || null;
  };

  const getProviderName = (serviceID: string) => serviceID?.replace('-data', '').toUpperCase();

  return (
    <div>
      <label className="mb-3 flex items-center gap-2 text-xs font-semibold text-ink">
        <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-6.938-4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        Select Network Provider
      </label>
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-bg p-4">
        {providers?.map((provider) => {
          const selected = selectedProvider === provider.serviceID;
          return (
            <button
              key={provider.serviceID}
              type="button"
              className={[
                'flex flex-col items-center rounded-lg border-2 p-4 transition',
                selected ? 'border-accent bg-tint' : 'border-transparent bg-paper',
                isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              ].join(' ')}
              onClick={() => onChange(provider.serviceID)}
              disabled={isSubmitting}
            >
              <div
                className={`mb-2 flex h-14 w-14 items-center justify-center rounded-full ${selected ? 'bg-tint' : 'bg-bg'}`}
              >
                <img src={getProviderImage(provider.serviceID)} alt={provider.serviceID} className="h-8 w-8 object-contain" />
              </div>
              <span className={`text-[13px] font-medium ${selected ? 'text-accent' : 'text-ink'}`}>
                {getProviderName(provider.serviceID)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NetworkProviderSelector;
