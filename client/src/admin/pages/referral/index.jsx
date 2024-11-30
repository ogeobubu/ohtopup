import React, { useState, useEffect } from "react";
import { FaUserTimes, FaWallet } from "react-icons/fa";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { getUser, getReferrals as getReferralsApi, addPoint } from "../../api";
import Pagination from "../../components/pagination";
import Table from "../../components/table";
import Modal from "../../components/modal";
import Textfield from "../../../components/ui/forms/input";
import Button from "../../../components/ui/forms/button";
import noData from "../../../assets/no-data.svg";

const Referral = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state for adding points

  const toggleModal = () => setIsOpen((prev) => !prev);

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setIsOpen(true);
  };

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  const {
    data: referrals,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "referrals",
      { page: currentPage, limit, search: debouncedSearchTerm },
    ],
    queryFn: () => getReferralsApi(currentPage, limit, debouncedSearchTerm),
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
    { header: "Username", render: (item) => item.username },
    { header: "Email", render: (item) => item.email },
    {
      header: "Referred Users",
      render: (item) => item?.referredUsers?.length || 0,
    },
    { header: "Points", render: (item) => item?.points || 0 },
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

  const handleAddPoints = async (values, { resetForm }) => {
    setLoading(true); // Set loading to true on submit
    try {
      const amount = Number(values.amount);
      const data = {
        userId: currentUser._id,
        pointsToAdd: amount,
      };
      await addPoint(data);
      toast.success("Points added successfully!");
      resetForm();
      toggleModal();
      refetch();
    } catch (error) {
      toast.error("Error adding points: " + error.message);
    } finally {
      setLoading(false); // Set loading to false after finish
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-5 text-gray-800">Referral Management</h2>
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 min-h-[250px] flex flex-col justify-between bg-white shadow-md rounded-lg p-4">
          {isLoading ? (
            <p className="text-gray-500">Loading referrals...</p>
          ) : isError ? (
            <p className="text-red-500">Error loading referrals: {error.message}</p>
          ) : referrals?.users.length > 0 ? (
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

              <Table columns={columns} data={referrals.users} />

              <Pagination
                currentPage={currentPage}
                totalPages={referrals.totalPages}
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

      <Modal isOpen={isOpen} closeModal={toggleModal} title="Add Points">
        <Formik
          initialValues={{ amount: "" }}
          validationSchema={Yup.object({
            amount: Yup.number()
              .required("Amount is required")
              .positive("Amount must be positive")
              .min(1, "Amount must be at least ₦1.00"),
          })}
          onSubmit={handleAddPoints}
        >
          {({ errors, touched }) => (
            <Form className="flex flex-col">
              <label htmlFor="amount" className="mb-1 text-gray-700">
                Enter Amount:
              </label>
              <Field
                name="amount"
                as={Textfield}
                placeholder="0"
                min="0"
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.amount && touched.amount ? (
                <div className="text-red-600 text-sm">{errors.amount}</div>
              ) : null}

              <Button
                type="submit"
                className={`mt-3 py-2 rounded transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"} text-white`}
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Points"}
              </Button>
            </Form>
          )}
        </Formik>
      </Modal>
    </>
  );
};

export default Referral;