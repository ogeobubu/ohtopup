import { useQuery } from '@tanstack/react-query';
import { getDataVariations } from '../../../../api';

const useDataVariations = (serviceID) => {
  return useQuery({
    queryKey: ['data-variations', serviceID],
    queryFn: () => serviceID ? getDataVariations(serviceID) : Promise.resolve([]),
    enabled: !!serviceID,
    select: (data) => {
      if (!data?.variations) return [];

      return data.variations.map((variation) => ({
        value: variation.variation_code,
        label: variation.name,
        amount: Number(variation.variation_amount || variation.fixedPrice || 0),
        dataAmount: variation.dataAmount,
        validity: variation.validity,
        type: variation.type,
        network: variation.network,
      }));
    }
  });
};

export default useDataVariations;