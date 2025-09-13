import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FaUser, FaUserShield, FaUserTimes, FaEdit, FaUsers, FaChartLine, FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaDownload, FaEye, FaTrash, FaUserCheck, FaCreditCard } from "react-icons/fa";
import Select from "react-select";
import Table from "../../components/table";
import Pagination from "../../components/pagination";
import { getAllUsers, updateUser, getUserAnalytics } from "../../api";
import { setUsers, updateAdminRedux } from "../../../actions/adminActions";
import Card from "./card";
import Modal from "../../components/modal";
import { formatNairaAmount } from "../../../utils";
import { toast } from "react-toastify";

const UserManagement = () => {
  const users = useSelector((state: any) => state.admin?.users);
  const isDarkMode = useSelector((state: any) => state.theme?.isDarkMode || false);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
      queryClient.invalidateQueries({ queryKey: ["users"] } as any);
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
    {
      header: "User",
      render: (user) => (
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
            user?.role === 'admin' ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
          }`}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900">{user?.username}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Role & Status",
      render: (user) => (
        <div className="space-y-1">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            user?.role === 'admin'
              ? 'bg-orange-100 text-orange-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            <FaUserShield className="mr-1 h-3 w-3" />
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </span>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              user?.isDeleted ? 'bg-red-500' : 'bg-green-500'
            }`}></div>
            <span className={`text-xs ${user?.isDeleted ? 'text-red-600' : 'text-green-600'}`}>
              {user?.isDeleted ? 'Deleted' : 'Active'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Source",
      render: (user) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
          {user?.source || 'Direct'}
        </span>
      ),
    },
    {
      header: "Registration Date",
      render: (user) => (
        <div className="text-sm text-gray-600">
          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
        </div>
      ),
    },
    {
      header: "Actions",
      render: (user) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/admin/transactions?userId=${user._id}`)}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            title="View User Transactions"
          >
            <FaCreditCard className="inline h-3 w-3" />
          </button>
          <button
            onClick={() => handleEditUser(user)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            title="Edit User"
          >
            <FaEdit className="inline h-3 w-3" />
          </button>
          <button
            onClick={() => handleToggleDelete()}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
              user?.isDeleted
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
            }`}
            title={user?.isDeleted ? 'Restore User' : 'Delete User'}
          >
            {user?.isDeleted ? <FaUserCheck className="inline h-3 w-3" /> : <FaUserTimes className="inline h-3 w-3" />}
          </button>
        </div>
      ),
    },
  ];

  // Calculate additional analytics
  const activeUsers = analyticsData?.totalUsers - (analyticsData?.totalDeletedUsers || 0);
  const adminUsers = analyticsData?.usersByRole.find((role) => role._id === "admin")?.count || 0;
  const regularUsers = analyticsData?.totalUsers - adminUsers;
  const deletedUsers = analyticsData?.totalDeletedUsers || 0;

  return (
    <div className="my-3 md:my-5 p-2 md:px-4 sm:px-6 lg:px-8">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600 text-sm md:text-base">Manage and monitor all users in the system</p>
      </div>

      {/* Enhanced Analytics Cards */}
      <div className="mb-4 md:mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs md:text-sm font-medium">Total Users</p>
              <p className="text-lg md:text-2xl font-bold">{analyticsData?.totalUsers || 0}</p>
            </div>
            <FaUsers className="h-6 w-6 md:h-8 md:w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs md:text-sm font-medium">Active Users</p>
              <p className="text-lg md:text-2xl font-bold">{activeUsers || 0}</p>
            </div>
            <FaUserCheck className="h-6 w-6 md:h-8 md:w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs md:text-sm font-medium">Regular Users</p>
              <p className="text-lg md:text-2xl font-bold">{regularUsers || 0}</p>
            </div>
            <FaUser className="h-6 w-6 md:h-8 md:w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs md:text-sm font-medium">Admins</p>
              <p className="text-lg md:text-2xl font-bold">{adminUsers || 0}</p>
            </div>
            <FaUserShield className="h-6 w-6 md:h-8 md:w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Secondary Analytics Row */}
      <div className="mb-4 md:mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 md:p-4 rounded-lg shadow-md text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-xs md:text-sm font-medium">Deleted Users</p>
              <p className="text-lg md:text-xl font-bold">{deletedUsers || 0}</p>
            </div>
            <FaUserTimes className="h-5 w-5 md:h-6 md:w-6 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-3 md:p-4 rounded-lg shadow-md text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-xs md:text-sm font-medium">Users This Month</p>
              <p className="text-lg md:text-xl font-bold">{analyticsData?.usersThisMonth || 0}</p>
            </div>
            <FaCalendarAlt className="h-5 w-5 md:h-6 md:w-6 text-indigo-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-3 md:p-4 rounded-lg shadow-md text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-xs md:text-sm font-medium">Active Rate</p>
              <p className="text-lg md:text-xl font-bold">
                {analyticsData?.totalUsers > 0
                  ? Math.round(((activeUsers || 0) / analyticsData.totalUsers) * 100)
                  : 0}%
              </p>
            </div>
            <FaChartLine className="h-5 w-5 md:h-6 md:w-6 text-teal-200" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 px-2 md:px-0">
        <div className="text-xs md:text-sm text-gray-600">
          {usersData?.users?.length || 0} users found
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={handleSearchChange}
              className="border border-gray-300 rounded-lg px-3 md:px-4 py-2 pl-8 md:pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 text-sm"
            />
            <FaUsers className="absolute left-2 md:left-3 top-2.5 md:top-3 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
          </div>
          <Select
            options={[
              { value: "", label: "All Roles" },
              { value: "admin", label: "Admin" },
              { value: "user", label: "User" },
            ]}
            value={filter}
            onChange={handleFilterChange}
            className="w-full sm:w-32 text-sm"
            placeholder="Role"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '36px',
                borderRadius: '6px',
                borderColor: '#d1d5db',
                '&:hover': { borderColor: '#9ca3af' },
                boxShadow: 'none',
                '&:focus-within': {
                  borderColor: '#3b82f6',
                  boxShadow: '0 0 0 1px #3b82f6'
                }
              }),
              placeholder: (base) => ({
                ...base,
                color: '#9ca3af',
                fontSize: '12px'
              }),
              singleValue: (base) => ({
                ...base,
                color: '#374151',
                fontSize: '12px'
              }),
              menu: (base) => ({
                ...base,
                borderRadius: '6px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }),
              option: (base, { isFocused, isSelected }) => ({
                ...base,
                backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#eff6ff' : 'white',
                color: isSelected ? 'white' : '#374151',
                fontSize: '12px'
              })
            }}
          />
          <Select
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "deleted", label: "Deleted" },
            ]}
            onChange={handleStatusChange}
            className="w-full sm:w-32 text-sm"
            placeholder="Status"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '36px',
                borderRadius: '6px',
                borderColor: '#d1d5db',
                '&:hover': { borderColor: '#9ca3af' },
                boxShadow: 'none',
                '&:focus-within': {
                  borderColor: '#3b82f6',
                  boxShadow: '0 0 0 1px #3b82f6'
                }
              }),
              placeholder: (base) => ({
                ...base,
                color: '#9ca3af',
                fontSize: '12px'
              }),
              singleValue: (base) => ({
                ...base,
                color: '#374151',
                fontSize: '12px'
              }),
              menu: (base) => ({
                ...base,
                borderRadius: '6px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }),
              option: (base, { isFocused, isSelected }) => ({
                ...base,
                backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#eff6ff' : 'white',
                color: isSelected ? 'white' : '#374151',
                fontSize: '12px'
              })
            }}
          />
          <button
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 md:px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-xs md:text-sm"
            onClick={() => toast.info("Export functionality coming soon!")}
          >
            <FaDownload className="inline mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {isUsersLoading || isAnalyticsLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-white rounded-full p-6 shadow-lg mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Users</h3>
          <p className="text-gray-600 text-center max-w-md">
            Please wait while we fetch the user data and analytics...
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mx-2 md:mx-0">
          <div className="overflow-x-auto">
            <Table columns={columns} data={users} />
          </div>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 md:p-6"
          onClick={toggleModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-md mx-4 sm:mx-auto transform transition-all duration-300 scale-100 max-h-[95vh] sm:max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700 dark:hover:scrollbar-thumb-gray-500 px-2 sm:px-0 pb-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full mb-4">
                <FaUser className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {currentUser?.isDeleted ? 'Restore User' : 'Delete User'}
              </h3>
              <p className="text-sm text-gray-600">
                Manage user account status for {currentUser?.username}
              </p>
            </div>

            {/* User Details */}
            <div className="mb-6 p-6 rounded-xl bg-gray-50">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-600">Username</span>
                  <span className="font-semibold text-lg text-gray-900">
                    {currentUser?.username}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-600">Email</span>
                  <span className="font-semibold text-gray-900">
                    {currentUser?.email}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-600">Role</span>
                  <span className={`font-semibold ${
                    currentUser?.role === 'admin' ? 'text-orange-600' : 'text-blue-600'
                  }`}>
                    {currentUser?.role?.charAt(0).toUpperCase() + currentUser?.role?.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-gray-600">Current Status</span>
                  <span className={`font-semibold ${
                    currentUser?.isDeleted ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {currentUser?.isDeleted ? 'Deleted' : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Description */}
            <div className={`mb-6 p-4 rounded-lg ${
              currentUser?.isDeleted
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center mt-0.5 mr-3 ${
                  currentUser?.isDeleted ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {currentUser?.isDeleted ? (
                    <FaCheckCircle className="h-3 w-3 text-white" />
                  ) : (
                    <FaTimesCircle className="h-3 w-3 text-white" />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${
                    currentUser?.isDeleted ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {currentUser?.isDeleted ? 'Restore User Account' : 'Delete User Account'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    currentUser?.isDeleted ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {currentUser?.isDeleted
                      ? 'This will restore the user account and allow them to access the system again.'
                      : 'This will deactivate the user account. The user will not be able to log in until restored.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={toggleModal}
                disabled={mutation.isPending}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleDelete}
                disabled={mutation.isPending}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative ${
                  currentUser?.isDeleted
                    ? 'bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 text-white'
                    : 'bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700 text-white'
                }`}
              >
                {mutation.isPending ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    {currentUser?.isDeleted ? (
                      <>
                        <FaUserCheck className="h-5 w-5 mr-2" />
                        Restore User
                      </>
                    ) : (
                      <>
                        <FaUserTimes className="h-5 w-5 mr-2" />
                        Delete User
                      </>
                    )}
                  </span>
                )}
              </button>
            </div>
        </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
