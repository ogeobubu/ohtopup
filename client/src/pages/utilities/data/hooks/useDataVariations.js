import { useQuery } from '@tanstack/react-query';
import { getDataVariationCodes } from '../../../../api';

const useDataVariations = (providerId) => {
  return useQuery({
    queryKey: ['variations', providerId],
    queryFn: () => providerId ? getDataVariationCodes(providerId) : Promise.resolve([]),
    enabled: !!providerId,
    select: (data) => {
      return data?.data?.map((variation) => ({
        value: variation.variation_code,
        label: variation.name,
        amount: Number(variation.variation_amount)
      })) || [];
    }
  });
};

export default useDataVariations;