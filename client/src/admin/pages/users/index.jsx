import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaUser, FaUserShield, FaUserTimes, FaEdit } from "react-icons/fa";
import Select from "react-select";
import Table from "../../components/table";
import Pagination from "../../components/pagination";
import { getAllUsers, updateUser, getUserAnalytics } from "../../api";
import { setUsers, updateAdminRedux } from "../../../actions/adminActions";
import Card from "./card";
import Modal from "../../components/modal";

const UserManagement = () => {
  const users = useSelector((state) => state.admin.users);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState(null);
  const [status, setStatus] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const toggleModal = () => setIsOpen((prev) => !prev);

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ["users", currentPage, searchTerm, filter, status],
    queryFn: () =>
      getAllUsers(currentPage, 10, searchTerm, filter?.value, status),
    keepPreviousData: true,
  });

  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ["userAnalytics"],
    queryFn: getUserAnalytics,
  });

  useEffect(() => {
    if (usersData) {
      dispatch(setUsers(usersData.users));
    }
  }, [usersData, dispatch]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (selectedOption) => {
    setFilter(selectedOption);
    setCurrentPage(1);
  };

  const handleStatusChange = (selectedOption) => {
    setStatus(selectedOption.value);
    setCurrentPage(1);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setIsOpen(true);
  };

  const mutation = useMutation({
    mutationFn: (updatedUser) =>
      updateUser(updatedUser._id, { isDeleted: updatedUser.isDeleted }),
    onSuccess: (data) => {
      dispatch(updateAdminRedux(data));
      queryClient.invalidateQueries(["users"]);
      toggleModal();
    },
    onError: (error) => {
      console.error("Error updating user:", error);
    },
  });

  const handleToggleDelete = () => {
    if (currentUser) {
      const updatedUser = { ...currentUser, isDeleted: !currentUser.isDeleted };
      mutation.mutate(updatedUser);
    }
  };

  const totalPages = Math.ceil(usersData?.totalCount / 10);

  const columns = [
    { header: "ID", render: (user) => user._id },
    {
      header: "Name",
      render: (user) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
            <span className="text-gray-600 font-medium">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-left">{user?.username}</span>
        </div>
      ),
    },
    { header: "Email", render: (user) => user?.email },
    { header: "Role", render: (user) => user?.role },
    {
      header: "Actions",
      render: (user) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditUser(user)}
            className="border border-solid border-green-500 flex justify-center items-center rounded-full w-6 h-6 text-green-500 hover:text-green-700"
          >
            <FaEdit size={15} />
          </button>
          <button
            onClick={() => console.log("Disable user with ID:", user._id)}
            className="border border-solid border-red-500 flex justify-center items-center rounded-full w-6 h-6 text-red-500 hover:text-red-700"
          >
            <FaUserTimes size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="my-5">
      <div className="flex gap-4">
        <Card
          title="Registered Users"
          count={users.length}
          icon={FaUser}
          bgColor="bg-blue-200"
        />
        <Card
          title="Registered Admins"
          count={
            analyticsData?.usersByRole.find((role) => role._id === "admin")
              ?.count || 0
          }
          icon={FaUserShield}
          bgColor="bg-green-200"
        />
        <Card
          title="Deleted Users"
          count={analyticsData?.totalDeletedUsers || 0}
          icon={FaUserTimes}
          bgColor="bg-red-200"
        />
      </div>

      <div className="flex justify-between my-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded p-2"
        />
        <div className="flex gap-1 items-center">
          <Select
            options={[
              { value: "", label: "All" },
              { value: "admin", label: "Admin" },
              { value: "user", label: "User" },
            ]}
            value={filter}
            onChange={handleFilterChange}
            className="w-40"
            placeholder="Filter by role"
          />
          <Select
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active User" },
              { value: "deleted", label: "Deleted User" },
            ]}
            onChange={handleStatusChange}
            className="w-40"
            placeholder="Filter by status"
          />
        </div>
      </div>

      {isUsersLoading || isAnalyticsLoading ? (
        <p>Loading...</p>
      ) : (
        <Table columns={columns} data={users} />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <Modal isOpen={isOpen} closeModal={toggleModal} title="Update User">
        <div className="p-4 bg-blue-100 rounded-md">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col gap-1">
              <span>Delete User</span>
              <small className="text-sm text-gray-500">
                You can delete/undelete this user.
              </small>
            </div>
            <div>
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={currentUser?.isDeleted || false}
                    onChange={handleToggleDelete}
                    disabled={mutation.isLoading}
                  />
                  <div className="block bg-gray-300 w-14 h-8 rounded-full"></div>
                  <div
                    className={`absolute left-1 top-1 w-6 h-6 rounded-full transition-transform duration-200 ${
                      currentUser?.isDeleted
                        ? "transform translate-x-full bg-green-500"
                        : "bg-white"
                    }`}
                  ></div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;