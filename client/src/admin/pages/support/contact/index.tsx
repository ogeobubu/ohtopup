import React from "react";
import { setDetails } from "../../../api"
import Textfield from "../../../../components/ui/forms/input";

const Contact = () => {
  return (
    <div className="border border-solid border-gray-200 rounded-md p-6 w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
      <Textfield label="Email Address" />
      <Textfield label="Facebook" />
      <Textfield label="Twitter" />
    </div>
  );
};

export default Contact;
