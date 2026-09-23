import React from 'react';
import { Field, ErrorMessage } from 'formik';
import TextField from "../../../components/ui/forms/input";

const AccountNumberInput = ({ accountNameApi, onAccountChange }) => {
  return (
    <div className="flex flex-col mt-3">
      <label className="block text-muted">Smart Card Number</label>
      <Field name="accountNumber">
        {({ field, form }) => (
          <TextField
            {...field}
            type="text"
            value={field.value}
            className="w-full border rounded bg-bg text-ink"
            onChange={(e) => {
              form.setFieldValue(field.name, e.target.value);
              onAccountChange(e.target.value);
            }}
          />
        )}
      </Field>
      <ErrorMessage name="accountNumber" component="div" className="text-red-500 text-sm" />
      {accountNameApi && (
        <>
          <div className="flex flex-col">
            <label className="mb-1 block text-muted">Smart Card Name</label>
            <Field name="accountName">
              {({ field }) => (
                <TextField
                  {...field}
                  type="text"
                  disabled
                  value={accountNameApi?.data.Customer_Name}
                  className="w-full p-2 border rounded bg-bg text-ink"
                />
              )}
            </Field>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountNumberInput;
