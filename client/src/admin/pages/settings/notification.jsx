import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import Textfield from "../../../components/ui/forms/input";
import Textarea from "../../../components/ui/forms/textarea";
import Button from "../../../components/ui/forms/button";
import Pagination from "../../components/pagination"; 
import { useQuery } from "@tanstack/react-query";
import {
  getAllUsers,
  createNotification as createNotificationApi,
  getAllUsersNotifications,
  deleteNotification as deleteNotificationApi,
} from "../../api";
import { toast } from "react-toastify";
import Modal from "../../components/modal";
import Table from "../../components/table";
import DeleteModal from "../../components/deleteModal";
import { FaTrash } from "react-icons/fa";

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
    <div className="md:p-6 p-2 border border-solid rounded-md border-gray-200 bg-white dark:bg-gray-800 w-full">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Notification</h2>
        <Button className="bg-green-600 hover:bg-green-400" onClick={toggleModal} size="sm">
          Create
        </Button>
      </div>
      <div className="my-5">
        <Textfield
          label="Filter by Username"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); 
          }}
        />
        {isNotificationLoading ? (
          <p>Loading notifications...</p>
        ) : isNotificationError ? (
          <p>Error: {notificationError.message}</p>
        ) : (
          <>
          <div className="overflow-x-auto">
            <Table columns={columns} data={notifications} />
          </div>
          <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>
      {isUserLoading && <p>Loading users...</p>}
      {isUserError && <p>Error: {userError.message}</p>}

      <Modal isOpen={isOpen} closeModal={toggleModal} title="Create Notification">
        <form onSubmit={formik.handleSubmit}>
          <Textfield
            label="Type"
            name="type"
            value={formik.values.type}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.type && Boolean(formik.errors.type)}
            helperText={formik.touched.type && formik.errors.type}
          />

          <div className="my-3">
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
              onBlur={formik.handleBlur}
              value={formik.values.user}
            />
            {formik.touched.user && formik.errors.user && (
              <div className="text-red-500">{formik.errors.user.message}</div>
            )}
          </div>

          <Textarea
            label="Message"
            name="message"
            value={formik.values.message}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.message && Boolean(formik.errors.message)}
            helperText={formik.touched.message && formik.errors.message}
          />

          <Button type="submit">Send</Button>
        </form>
      </Modal>

      {isDeleteModalOpen && (
        <DeleteModal
          isDelete={isDeleteModalOpen}
          closeDeleteModal={closeDeleteModal}
          handleDeleteData={handleDeleteData}
          id={userIdToDelete}
        />
      )}
    </div>
  );
};

export default Notification;