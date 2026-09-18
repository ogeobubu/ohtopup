import PropTypes from 'prop-types';
import mtn from '../../../../assets/mtn.svg';
import glo from '../../../../assets/glo.svg';
import airtel from '../../../../assets/airtel.svg';
import nineMobile from '../../../../assets/9mobile.svg';

const NetworkProviderSelector = ({ providers, selectedProvider, onChange, isSubmitting }) => {
  const getProviderImage = (serviceID) => {
    const providerMap = {
      'mtn': mtn, 'mtn-data': mtn,
      'glo': glo, 'glo-data': glo,
      'airtel': airtel, 'airtel-data': airtel,
      'etisalat': nineMobile, 'etisalat-data': nineMobile,
    };
    return providerMap[serviceID] || null;
  };

  const getProviderName = (serviceID) => {
    return serviceID?.replace('-data', '').toUpperCase();
  };

  return (
    <div>
      <label className="ot-field-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <svg style={{ width: 16, height: 16, color: 'var(--ot-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-6.938-4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        Select Network Provider
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: 16, background: 'var(--ot-bg)', borderRadius: 8, border: '1px solid var(--ot-line)' }}>
        {providers?.map((provider) => (
          <button
            key={provider.serviceID}
            type="button"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16,
              borderRadius: 8, border: selectedProvider === provider.serviceID ? '2px solid var(--ot-accent)' : '2px solid transparent',
              background: selectedProvider === provider.serviceID ? 'var(--ot-tint)' : 'var(--ot-paper)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1,
              transition: 'all 0.15s'
            }}
            onClick={() => onChange(provider.serviceID)}
            disabled={isSubmitting}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedProvider === provider.serviceID ? 'var(--ot-tint)' : 'var(--ot-bg)', marginBottom: 8 }}>
              <img src={getProviderImage(provider.serviceID)} alt={provider.serviceID} style={{ width: 32, height: 32, objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: selectedProvider === provider.serviceID ? 'var(--ot-accent)' : 'var(--ot-ink)' }}>
              {getProviderName(provider.serviceID)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

NetworkProviderSelector.propTypes = {
  providers: PropTypes.array,
  selectedProvider: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool
};

export default NetworkProviderSelector;
