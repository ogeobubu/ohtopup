import React, { useState, useEffect } from "react";
import { FaUserTimes, FaWallet } from "react-icons/fa";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { getWaitlist as getWaitlistApi, sendWaitlist } from "../../api";
import Pagination from "../../components/pagination";
import Table from "../../components/table";
import Modal from "../../components/modal";
import Textfield from "../../../components/ui/forms/input";
import Textarea from "../../../components/ui/forms/textarea";
import Button from "../../../components/ui/forms/button";
import noData from "../../../assets/no-data.svg";

const Waitlist = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendToAll, setSendToAll] = useState(false); // New state for sending to all users

  const toggleModal = () => setIsOpen((prev) => !prev);

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setSendToAll(false); // Reset to individual by default
    setIsOpen(true);
  };

  const {
    data: waitlists,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "waitlists",
      { page: currentPage, limit, search: debouncedSearchTerm },
    ],
    queryFn: () => getWaitlistApi(currentPage, limit, debouncedSearchTerm),
    keepPreviousData: true,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };

  const columns = [
    { header: "Email", render: (item) => item },
    {
      header: "Actions",
      render: (user) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditUser(user)}
            className="border border-green-500 flex justify-center items-center rounded-full w-8 h-8 text-green-500 hover:bg-green-100 transition"
          >
            <FaWallet size={16} />
          </button>
        </div>
      ),
    },
  ];

  const handleSendSubmit = async (values, { resetForm }) => {
    setLoading(true);
    try {
      const data = {
        emails: sendToAll ? waitlists.emails : [currentUser], // Send all emails or one email
        subject: values.text,
        message: values.description
      };
      await sendWaitlist(data);
      toast.success("Message sent successfully");
      resetForm();
      toggleModal();
      refetch();
    } catch (error) {
      toast.error("Error sending message: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-5 text-gray-800">Waitlist Management</h2>
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 min-h-[250px] flex flex-col justify-between bg-white shadow-md rounded-lg p-4">
          {isLoading ? (
            <p className="text-gray-500">Loading waitlists...</p>
          ) : isError ? (
            <p className="text-red-500">Error loading waitlists: {error.message}</p>
          ) : waitlists?.emails?.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="flex justify-between items-center mb-4">
                <div className="flex-grow"></div>
                <div className="flex items-center">
                  <input
                    type="search"
                    placeholder="Search by username or email"
                    className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    className="ml-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                    onClick={handleClearSearch}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <Table columns={columns} data={waitlists.emails} />

              <Pagination
                currentPage={currentPage}
                totalPages={waitlists.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          ) : (
            <div className="border border-gray-300 rounded-md p-6 flex flex-col items-center justify-center h-full bg-gray-50">
              <img
                className="w-24 h-24 mb-4"
                src={noData}
                alt="No data"
              />
              <p className="mt-2 text-gray-500 text-center">
                No referral history
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isOpen} closeModal={toggleModal} title="Send Email">
        <Formik
          initialValues={{ text: "", description: "" }}
          validationSchema={Yup.object({
            text: Yup.string().required("Subject is required"),
            description: Yup.string().required("Description is required"),
          })}
          onSubmit={handleSendSubmit}
        >
          {({ errors, touched }) => (
            <Form className="flex flex-col">
              <label htmlFor="text" className="mb-1 text-gray-700">
                Enter Subject:
              </label>
              <Field
                name="text"
                as={Textfield}
                placeholder="Enter subject"
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.text && touched.text ? (
                <div className="text-red-600 text-sm">{errors.text}</div>
              ) : null}
              <label htmlFor="description" className="mb-1 text-gray-700">
                Enter Description:
              </label>
              <Field
                name="description"
                as={Textarea}
                placeholder="Enter description"
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.description && touched.description ? (
                <div className="text-red-600 text-sm">{errors.description}</div>
              ) : null}

              <div className="flex items-center mt-3">
                <input
                  type="checkbox"
                  checked={sendToAll}
                  onChange={() => setSendToAll((prev) => !prev)}
                  className="mr-2"
                />
                <label className="text-gray-700">Send to all users</label>
              </div>

              <Button
                type="submit"
                className={`mt-3 py-2 rounded transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"} text-white`}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send"}
              </Button>
            </Form>
          )}
        </Formik>
      </Modal>
    </>
  );
};

export default Waitlist;