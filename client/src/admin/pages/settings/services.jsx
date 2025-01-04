import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import Textfield from "../../../components/ui/forms/input";
import Button from "../../../components/ui/forms/button";
import { useQuery } from "@tanstack/react-query";
import {
  createService as createServiceApi,
  updateService as updateServiceApi,
  deleteService as deleteServiceApi,
  getServices,
  deleteNotification as deleteNotificationApi,
} from "../../api";
import {
  getNotifications,
  addNotification,
  removeNotification,
  getServicesDispatch,
  addService,
  updateServiceDispatch,
  removeService,
} from "../../../actions/adminActions";
import { toast } from "react-toastify";
import Modal from "../../components/modal";
import Table from "../../components/table";
import DeleteModal from "../../components/deleteModal";
import { FaTrash, FaEdit } from "react-icons/fa";

const Services = () => {
  const dispatch = useDispatch();
  const serviceData = useSelector((state) => state.admin.services);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [isOn, setIsOn] = useState(false);

  const toggleSwitch = () => {
    setIsOn(!isOn);
  };

  const openDeleteModal = (userId) => {
    setUserIdToDelete(userId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setUserIdToDelete(null);
  };

  const toggleModal = () => setIsOpen((prev) => !prev);
  const toggleEditModal = () => setEditOpen((prev) => !prev);

  const {
    data: services,
    isLoading: isServicesLoading,
    isError: isServicesError,
    error: serviceError,
  } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });

  useEffect(() => {
    if (services) {
      dispatch(getServicesDispatch(services));
    }
  }, [services, dispatch]);

  const formik = useFormik({
    initialValues: {
      name: "",
      isAvailable: false,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Type is required"),
    }),
    onSubmit: async (values) => {
      try {
        if (serviceToEdit) {
          const newData = await updateServiceApi(serviceToEdit._id, {
            ...values,
            isAvailable: isOn,
          });
          dispatch(updateServiceDispatch(newData));
          toast.success("Service updated successfully!");
          setServiceToEdit(null);
          toggleEditModal();
        } else {
          const newData = await createServiceApi({
            ...values,
            isAvailable: isOn,
          });
          dispatch(addService(newData));
          toggleModal();
          toast.success("Service created successfully!");
        }
        formik.resetForm();
      } catch (err) {
        console.error("Error:", err);
        toast.error("Failed to process request. Please try again.");
      }
    },
  });

  const handleEditService = (service) => {
    setServiceToEdit(service);
    formik.setValues({
      name: service.name,
      isAvailable: service.isAvailable,
    });
    setIsOn(service.isAvailable);
    toggleEditModal();
  };

  const handleDeleteData = async (id) => {
    console.log(id);
    try {
      await deleteServiceApi(id);
      dispatch(removeService(id));
      toast.success("Service deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete service.");
    } finally {
      closeDeleteModal();
    }
  };

  const columns = [
    { header: "Name", render: (service) => service.name },
    {
      header: "Available",
      render: (service) => (service?.isAvailable ? "true" : "false"),
    },
    {
      header: "Date",
      render: (service) => (
        <small>{new Date(service.updatedAt).toLocaleString()}</small>
      ),
    },
    {
      header: "Actions",
      render: (service) => (
        <div className="flex space-x-2">
          <button
            className="border border-solid border-green-500 flex justify-center items-center rounded-full w-6 h-6 text-green-500 hover:text-green-700"
            onClick={() => handleEditService(service)}
          >
            <FaEdit size={15} />
          </button>
          <button
            className="border border-solid border-red-500 flex justify-center items-center rounded-full w-6 h-6 text-red-500 hover:text-red-700"
            onClick={() => openDeleteModal(service._id)}
          >
            <FaTrash size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="md:p-6 p-2 border border-solid rounded-md border-gray-200 w-full">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <h2 className="text-2xl font-bold mb-4">Services</h2>
        <Button
          className="bg-green-600 hover:bg-green-400"
          onClick={toggleModal}
          size="sm"
        >
          Create
        </Button>
      </div>
      <div className="my-5 overflow-x-auto">
        {isServicesLoading ? (
          <p>Loading services...</p>
        ) : isServicesError ? (
          <p>Error: {serviceError.message}</p>
        ) : (
          <div className="">
            <Table columns={columns} data={serviceData} />
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} closeModal={toggleModal} title="Create Service">
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <Textfield
            label="Name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
          />

          <div className="flex items-center justify-between mb-3 w-full">
            <label
              className={`mr-2 ${isOn ? "text-green-600" : "text-gray-600"}`}
            >
              Is this available?
            </label>
            <div
              onClick={toggleSwitch}
              className={`relative inline-flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors duration-200 ${
                isOn ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute left-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200 ${
                  isOn ? "translate-x-full" : "translate-x-0"
                }`}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        isOpen={isEditOpen}
        closeModal={toggleEditModal}
        title="Update Service"
      >
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <Textfield
            label="Name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
          />

          <div className="flex items-center justify-between mb-3 w-full">
            <label
              className={`mr-2 ${isOn ? "text-green-600" : "text-gray-600"}`}
            >
              Is this available?
            </label>
            <div
              onClick={toggleSwitch}
              className={`relative inline-flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors duration-200 ${
                isOn ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute left-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200 ${
                  isOn ? "translate-x-full" : "translate-x-0"
                }`}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Submit
          </Button>
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

export default Services;
