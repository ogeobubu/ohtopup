import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import Textfield from "../../../components/ui/forms/input";
import Textarea from "../../../components/ui/forms/textarea";
import Button from "../../../components/ui/forms/button";
import { useQuery } from "@tanstack/react-query";
import {
  getAllUsers,
  createNotification as createNotificationApi,
  getAllUsersNotifications,
  deleteNotification as deleteNotificationApi,
} from "../../api";
import {
  getNotifications,
  addNotification,
  removeNotification,
} from "../../../actions/adminActions";
import { toast } from "react-toastify";
import Modal from "../../components/modal";
import Table from "../../components/table";
import DeleteModal from "../../components/deleteModal";
import { FaTrash } from "react-icons/fa";

const Notification = () => {
  const dispatch = useDispatch();
  const notificationsData = useSelector((state) => state.admin.notifications);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);

  const openDeleteModal = (userId) => {
    setUserIdToDelete(userId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setUserIdToDelete(null);
  };

  const toggleModal = () => setIsOpen((prev) => !prev);

  const {
    data: userData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["users", search],
    queryFn: () => getAllUsers(1, 10, search, "", "active"),
    keepPreviousData: true,
  });

  const {
    data: notifications,
    isLoading: isNotificationLoading,
    isError: isNotificationError,
    error: notificationError,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: getAllUsersNotifications,
  });

  useEffect(() => {
    if (userData) {
      setUsers(userData.users);
    }
  }, [userData]);

  useEffect(() => {
    if (notifications) {
      dispatch(getNotifications(notifications));
    }
  }, [notifications, dispatch]);

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
        type: values.type,
        message: values.message,
      };
    
      try {
        const newNotification = await createNotificationApi(notificationData);
        console.log("API Response:", newNotification);
    
        const notifications = newNotification.notifications || [newNotification.notification];
    
        notifications.forEach((notification) => {
          const data = {
            id: notification._id,
            user: {
              id: notification.userId,
              username: notification.user.username,
              email: notification.user.email,
            },
            type: notification.type,
            message: notification.message,
            createdAt: notification.createdAt,
          };
    
          dispatch(addNotification(data));
        });
    
        toast.success("Notification sent successfully!");

        formik.setFieldValue("user", null);
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
      dispatch(removeNotification(id));
      toast.success("Notification deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete notification.");
    } finally {
      closeDeleteModal();
    }
  };

  const columns = [
    { header: "Type", render: (notification) => notification.type },
    { header: "User", render: (notification) => notification?.user?.username },
    {
      header: "Message",
      render: (notification) => {
        const isExpanded = expandedNotificationId === notification._id;
        const trimmedMessage = notification.message.length > 50 
          ? `${notification.message.substring(0, 50)}...` 
          : notification.message;

        return (
          <div>
            <p>{isExpanded ? notification.message : trimmedMessage}</p>
            {notification.message.length > 50 && (
              <button
                onClick={() => setExpandedNotificationId(isExpanded ? null : notification._id)}
                className="text-blue-500 underline"
              >
                {isExpanded ? "View Less" : "View More"}
              </button>
            )}
          </div>
        );
      },
    },
    {
      header: "Date",
      render: (notification) =>
        <small>{new Date(notification.createdAt).toLocaleString()}</small>,
    },
    {
      header: "Actions",
      render: (notification) => (
        <div className="flex space-x-2">
          <button
            className="border border-solid border-red-500 flex justify-center items-center rounded-full w-6 h-6 text-red-500 hover:text-red-700"
            onClick={() => openDeleteModal(notification.id)}
          >
            <FaTrash size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 border border-solid rounded-md border-gray-200 w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold mb-4">Notification</h2>
        <Button onClick={toggleModal} size="sm">
          Create
        </Button>
      </div>
      <div className="my-5">
        {isNotificationLoading ? (
          <p>Loading notifications...</p>
        ) : isNotificationError ? (
          <p>Error: {notificationError.message}</p>
        ) : (
          <Table columns={columns} data={notificationsData} />
        )}
      </div>
      {isLoading && <p>Loading users...</p>}
      {isError && <p>Error: {error.message}</p>}

      <Modal
        isOpen={isOpen}
        closeModal={toggleModal}
        title="Create Notification"
      >
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