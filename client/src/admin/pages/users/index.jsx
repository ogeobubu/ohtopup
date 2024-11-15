import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { FaUser, FaUserShield, FaUserTimes, FaEdit } from "react-icons/fa";
import Select from "react-select";
import Table from "../../components/table";
import Pagination from "../../components/pagination";
import { getAllUsers } from "../../api";
import { setUsers } from "../../../actions/adminActions";


const UserManagement = () => {
  const users = useSelector(state => state.admin.users)
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState(null);
  const pageSize = 5;

  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const {
    data: usersData,
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
  } = useQuery({
    queryKey: ["users", page, search, role],
    queryFn: () => getAllUsers(page, 10, search, role),
    keepPreviousData: true,
  });

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "admin", label: "Admin" },
    { value: "user", label: "User" },
  ];

  useEffect(() => {
    if (usersData) {
      console.log(usersData);
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

  const handleEditUser = (userId) => {
    // Logic to edit user
    console.log("Edit user with ID:", userId);
  };

  const handleDisableUser = (userId) => {
    // Logic to disable user
    console.log("Disable user with ID:", userId);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

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
          <div className="border border-solid border-green-500 flex justify-center items-center rounded-full w-6 h-6">
            <button
              onClick={() => handleEditUser(user._id)}
              className="text-green-500 hover:text-green-700"
            >
              <FaEdit size={15} />
            </button>
          </div>
          <div className="border border-solid border-red-500 flex justify-center items-center rounded-full w-6 h-6">
          <button
            onClick={() => handleDisableUser(user._id)}
            className="text-red-500 hover:text-red-700"
          >
            <FaUserTimes size={15} />
          </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-4">
        <div className="bg-blue-200 rounded-md shadow-md p-4 w-48">
          <div className="flex items-center">
            <div className="bg-blue-500 text-white rounded-full p-3">
              <FaUser size={24} />
            </div>
            <div className="ml-3">
              <span className="text-sm text-gray-700">Registered Users</span>
              <span className="block text-2xl font-bold text-gray-900">
                100
              </span>
            </div>
          </div>
        </div>

        {/* Total Admins Card */}
        <div className="bg-green-200 rounded-md shadow-md p-4 w-48">
          <div className="flex items-center">
            <div className="bg-green-500 text-white rounded-full p-3">
              <FaUserShield size={24} />
            </div>
            <div className="ml-3">
              <span className="text-sm text-gray-700">Registered Admins</span>
              <span className="block text-2xl font-bold text-gray-900">1</span>
            </div>
          </div>
        </div>

        {/* Total Deleted Users Card */}
        <div className="bg-red-200 rounded-md shadow-md p-4 w-48">
          <div className="flex items-center">
            <div className="bg-red-500 text-white rounded-full p-3">
              <FaUserTimes size={24} />
            </div>
            <div className="ml-3">
              <span className="text-sm text-gray-700">Deleted Users</span>
              <span className="block text-2xl font-bold text-gray-900">1</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between my-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded p-2"
        />
        <Select
          options={filterOptions}
          value={filter}
          onChange={handleFilterChange}
          className="w-40"
          placeholder="Filter by role"
        />
      </div>

      {loading ? <p>Loading...</p> : <Table columns={columns} data={users} />}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default UserManagement;
