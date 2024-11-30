import * as Yup from 'yup';

export const validationSchema = Yup.object({
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .matches(/^\+234\d{10}$/, "Phone number must be in the format +234XXXXXXXXXX"),

  amount: Yup.number()
    .required("Amount is required")
    .positive("Amount must be a positive number")
    .integer("Amount must be an integer"),

  provider: Yup.string().required("Please select a network provider"),

  accountNumber: Yup.string().required("Account number is required"),

  source: Yup.string()
    .when('provider', {
      is: (provider) => provider && provider !== '', 
      then: Yup.string().required('Please select a data plan'),  // Require source when provider is selected
      otherwise: Yup.string().notRequired(),  // Make source not required when no provider is selected
    })
    .nullable(), // Ensure the field can be null if not required
});
