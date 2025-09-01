import React, { useState, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";
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
import { useSelector } from "react-redux";

const Waitlist = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendToAll, setSendToAll] = useState(false);
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);

  const toggleModal = () => setIsOpen((prev) => !prev);

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setSendToAll(false);
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
            <FaPaperPlane size={16} />
          </button>
        </div>
      ),
    },
  ];

  const handleSendSubmit = async (values, { resetForm }) => {
    setLoading(true);
    try {
      const data = {
        emails: sendToAll ? waitlists.emails : [currentUser],
        subject: values.text,
        message: values.description,
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
      <h2 className="text-2xl font-bold mb-5 text-gray-800 dark:text-white">
        Waitlist Management
      </h2>
      <div className="flex flex-col md:flex-row bg-white dark:bg-gray-800">
        <div className="flex-1 min-h-[250px] flex flex-col justify-between bg-white dark:bg-gray-700 shadow-md rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-grow"></div>
            <div className="flex items-center">
              <input
                type="search"
                placeholder="Search by email"
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
          {isLoading ? (
            <p className="text-gray-500 text-center">Loading waitlists...</p>
          ) : isError ? (
            <p className="text-red-500">
              Error loading waitlists: {error.message}
            </p>
          ) : waitlists?.emails?.length > 0 ? (
            <div className="overflow-x-auto">
              <Table columns={columns} data={waitlists.emails} />
              <Pagination
                currentPage={currentPage}
                totalPages={waitlists.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          ) : (
            <div className="border border-gray-300 rounded-md p-6 flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-600">
              <img className="w-24 h-24 mb-4" src={noData} alt="No data" />
              <p className="mt-2 text-gray-500 dark:text-gray-300 text-center">
                No referral history
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        closeModal={toggleModal}
        title="Send Email"
        isDarkMode={isDarkMode}
      >
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
              <label
                htmlFor="text"
                className="mb-1 text-gray-700 dark:text-gray-300"
              >
                Enter Subject:
              </label>
              <Field
                name="text"
                as={Textfield}
                placeholder="Enter subject"
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              {errors.text && touched.text ? (
                <div className="text-red-600 text-sm">{errors.text}</div>
              ) : null}
              <label
                htmlFor="description"
                className="mb-1 text-gray-700 dark:text-gray-300"
              >
                Enter Description:
              </label>
              <Field
                name="description"
                as={Textarea}
                placeholder="Enter description"
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              {errors.description && touched.description ? (
                <div className="text-red-600 text-sm">{errors.description}</div>
              ) : null}

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={sendToAll}
                  onChange={() => setSendToAll((prev) => !prev)}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition duration-200 ease-in-out cursor-pointer"
                  id="sendToAll"
                />
                <label
                  htmlFor="sendToAll"
                  className="ml-2 text-gray-800 dark:text-gray-300 text-sm cursor-pointer hover:text-blue-600 transition duration-200 ease-in-out"
                >
                  Send to all users
                </label>
              </div>

              <Button
                type="submit"
                className={`mt-3 py-2 rounded transition ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white`}
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
