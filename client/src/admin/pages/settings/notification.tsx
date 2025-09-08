import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import Textfield from "../../../components/ui/forms/input";
import Textarea from "../../../components/ui/forms/textarea";
import Button from "../../../components/ui/forms/button";
import ModernPagination from "../../../components/modernPagination";
import { useQuery } from "@tanstack/react-query";
import {
  getAllUsers,
  createNotification as createNotificationApi,
  getAllUsersNotifications,
  deleteNotification as deleteNotificationApi,
} from "../../api";
import { toast } from "react-toastify";
import { FaTrash, FaPlus, FaBell, FaUsers, FaSearch, FaFilter, FaPaperPlane, FaEye, FaEyeSlash } from "react-icons/fa";

const Notification = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);
  const [notifications, setNotifications] = useState([]); // Added notifications state

  const openDeleteModal = (userId) => {
    setUserIdToDelete(userId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setUserIdToDelete(null);
  };

  const toggleModal = () => setIsOpen((prev) => !prev);

  const { data: userData, isLoading: isUserLoading, isError: isUserError, error: userError } = useQuery({
    queryKey: ["users", search],
    queryFn: () => getAllUsers(1, 10, search, "", "active"),
    keepPreviousData: true,
  });

  const { data: notificationsData = { notifications: [] }, isLoading: isNotificationLoading, isError: isNotificationError, error: notificationError } = useQuery({
    queryKey: ["notifications", currentPage, search],
    queryFn: () => getAllUsersNotifications({ page: currentPage, username: search }),
  });

  useEffect(() => {
    if(notificationsData) {
      setTotalPages(notificationsData.totalPages);
      setNotifications(notificationsData.notifications); 
    }
  }, [notificationsData])

  useEffect(() => {
    if (userData) {
      setUsers(userData.users);
    }
  }, [userData]);

  const formik = useFormik({
    initialValues: {
      type: "",
      user: null,
      message: "",
    },
    validationSchema: Yup.object({
      type: Yup.string().required("Type is required"),
      user: Yup.object().required("User is required"),
      message: Yup.string().required("Message is required"),
    }),
    onSubmit: async (values) => {
      const notificationData = {
        userId: values.user.value === "all" ? "all" : values.user.value,
        title: values.type,
        message: values.message,
      };

      try {
        const newNotification = await createNotificationApi(notificationData);
        const createdNotification = newNotification.notifications || [newNotification.notification];

        setNotifications((prev) => [
          ...createdNotification.map((notification) => ({
            id: notification._id,
            user: {
              id: notification.userId,
              username: notification.user.username,
              email: notification.user.email,
            },
            type: notification.type,
            message: notification.message,
            createdAt: notification.createdAt,
          })),
          ...prev,
        ]);

        toast.success("Notification sent successfully!");
        formik.resetForm();
        toggleModal();
      } catch (err) {
        console.error("Error sending notification:", err);
        toast.error("Failed to send notification. Please try again.");
      }
    },
  });

  const handleDeleteData = async (id) => {
    try {
      await deleteNotificationApi(id);
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
      toast.success("Notification deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete notification.");
    } finally {
      closeDeleteModal();
    }
  };

  const columns = [
    { header: "User", render: (notification) => notification?.user?.username },
    {
      header: "Message",
      render: (notification) => {
        const isExpanded = expandedNotificationId === notification.id;
        const trimmedMessage = notification.message.length > 50
          ? `${notification.message.substring(0, 50)}...`
          : notification.message;

        return (
          <div>
            <p className="text-sm">{isExpanded ? notification.message : trimmedMessage}</p>
          </div>
        );
      },
    },
    {
      header: "Date",
      render: (notification) => (
        <small>{new Date(notification.createdAt).toLocaleString()}</small>
      ),
    },
    {
      header: "Actions",
      render: (notification) => (
        <div className="flex space-x-2">
          <button
            className="border border-solid border-red-500 flex justify-center items-center rounded-full w-8 h-8 text-red-500 hover:text-red-700"
            onClick={() => openDeleteModal(notification.id)}
          >
            <FaTrash size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Notification Management</h2>
            <p className="text-blue-100 text-lg">Send notifications to users and manage communication</p>
          </div>
          <button
            onClick={toggleModal}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
          >
            <FaPlus className="text-sm" />
            Create Notification
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FaBell className="text-white text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{notifications.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <FaUsers className="text-white text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FaPaperPlane className="text-white text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sent Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {notifications.filter(n => {
                  const today = new Date();
                  const notificationDate = new Date(n.createdAt);
                  return notificationDate.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications by username..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2">
              <FaFilter className="text-sm" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Notifications</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage and monitor sent notifications</p>
        </div>

        {isNotificationLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : isNotificationError ? (
          <div className="p-12 text-center">
            <div className="text-red-500 mb-2">
              <FaTrash className="text-4xl mx-auto" />
            </div>
            <p className="text-red-600 dark:text-red-400">Error: {notificationError.message}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <FaBell className="text-4xl mx-auto mb-4 opacity-50 text-gray-400" />
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">No Notifications Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Start by creating your first notification</p>
            <button
              onClick={toggleModal}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              Create First Notification
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <tr key={notification.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                            {notification?.user?.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification?.user?.username}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {notification?.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {notification.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openDeleteModal(notification.id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                          title="Delete Notification"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <ModernPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </>
        )}
      </div>

      {/* Create Notification Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-full mb-4">
                <FaBell className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Notification
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send a notification to users
              </p>
            </div>

            {/* Form */}
            <form onSubmit={formik.handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notification Type
                </label>
                <input
                  type="text"
                  name="type"
                  value={formik.values.type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., System Update, Promotion"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formik.touched.type && formik.errors.type && (
                  <div className="text-red-600 text-sm mt-1">{formik.errors.type}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Recipients
                </label>
                <Select
                  placeholder="Select a user or 'All Users'..."
                  onInputChange={(inputValue) => setSearch(inputValue)}
                  onChange={(option) => formik.setFieldValue("user", option)}
                  options={[
                    { value: "all", label: "All Users" },
                    ...(users.map((user) => ({
                      value: user._id,
                      label: user.username,
                    })) || []),
                  ]}
                  isClearable
                  isSearchable
                  value={formik.values.user}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
                {formik.touched.user && formik.errors.user && (
                  <div className="text-red-600 text-sm mt-1">{formik.errors.user}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formik.values.message}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter your notification message..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                {formik.touched.message && formik.errors.message && (
                  <div className="text-red-600 text-sm mt-1">{formik.errors.message}</div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={toggleModal}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formik.values.type || !formik.values.user || !formik.values.message}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative"
                >
                  <span className="flex items-center justify-center">
                    <FaPaperPlane className="h-5 w-5 mr-2" />
                    Send Notification
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 rounded-full mb-4">
                <FaTrash className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Delete Notification
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this notification? This action cannot be undone.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteData(userIdToDelete)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;