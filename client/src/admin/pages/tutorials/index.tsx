import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaPlus, FaEdit, FaTrash, FaEye, FaToggleOn, FaToggleOff, FaBook, FaVideo, FaPlay, FaCheckCircle, FaClock, FaStar } from "react-icons/fa";
import Select from "react-select";
import { toast } from "react-toastify";
import {
  getAllTutorialsAdmin,
  createTutorial,
  updateTutorial,
  deleteTutorial,
  toggleTutorialStatus,
  getTutorialCategories
} from "../../../api";

const TutorialManagement = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    duration: "",
    difficulty: "Beginner",
    type: "text",
    steps: [""],
    videoUrl: "",
    popular: false,
    order: 0
  });

  // Fetch tutorials
  const { data: tutorialsData, isLoading } = useQuery({
    queryKey: ["admin-tutorials", currentPage, searchTerm, categoryFilter, statusFilter],
    queryFn: () =>
      getAllTutorialsAdmin({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        category: categoryFilter?.value,
        isActive: statusFilter === "all" ? undefined : statusFilter === "active"
      }),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["tutorial-categories"],
    queryFn: getTutorialCategories,
  });

  const categories = categoriesData?.categories || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTutorial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tutorials"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast.success("Tutorial created successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create tutorial");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTutorial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tutorials"] });
      setIsEditModalOpen(false);
      setSelectedTutorial(null);
      resetForm();
      toast.success("Tutorial updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update tutorial");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTutorial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tutorials"] });
      toast.success("Tutorial deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete tutorial");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleTutorialStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tutorials"] });
      toast.success("Tutorial status updated!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update tutorial status");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      duration: "",
      difficulty: "Beginner",
      type: "text",
      steps: [""],
      videoUrl: "",
      popular: false,
      order: 0
    });
  };

  const handleCreate = () => {
    if (!formData.title || !formData.description || !formData.category || !formData.duration) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (tutorial) => {
    setSelectedTutorial(tutorial);
    setFormData({
      title: tutorial.title,
      description: tutorial.description,
      category: tutorial.category,
      duration: tutorial.duration,
      difficulty: tutorial.difficulty,
      type: tutorial.type,
      steps: tutorial.steps,
      videoUrl: tutorial.videoUrl || "",
      popular: tutorial.popular,
      order: tutorial.order
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.title || !formData.description || !formData.category || !formData.duration) {
      toast.error("Please fill in all required fields");
      return;
    }
    updateMutation.mutate({ id: selectedTutorial._id, data: formData });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this tutorial?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id) => {
    toggleMutation.mutate(id);
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, ""]
    }));
  };

  const updateStep = (index, value) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => i === index ? value : step)
    }));
  };

  const removeStep = (index) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name
  }));

  const totalPages = Math.ceil((tutorialsData?.pagination?.total || 0) / 10);

  return (
    <div className="my-3 md:my-5 p-2 md:px-4 sm:px-4 lg:px-4">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">Tutorial Management</h1>
        <p className="text-gray-600 text-sm md:text-base">Create and manage tutorials for users</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-4 md:mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs md:text-sm font-medium">Total Tutorials</p>
              <p className="text-lg md:text-2xl font-bold">{tutorialsData?.pagination?.total || 0}</p>
            </div>
            <FaBook className="h-6 w-6 md:h-8 md:w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs md:text-sm font-medium">Active Tutorials</p>
              <p className="text-lg md:text-2xl font-bold">
                {tutorialsData?.tutorials?.filter(t => t.isActive).length || 0}
              </p>
            </div>
            <FaCheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 md:p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs md:text-sm font-medium">Popular Tutorials</p>
              <p className="text-lg md:text-2xl font-bold">
                {tutorialsData?.tutorials?.filter(t => t.popular).length || 0}
              </p>
            </div>
            <FaStar className="h-6 w-6 md:h-8 md:w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 px-2 md:px-0">
        <div className="text-xs md:text-sm text-gray-600">
          {tutorialsData?.tutorials?.length || 0} tutorials found
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search tutorials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 md:px-4 py-2 pl-8 md:pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 text-sm"
            />
            <FaBook className="absolute left-2 md:left-3 top-2.5 md:top-3 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
          </div>
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
            className="w-full sm:w-40 text-sm"
            placeholder="Category"
            isClearable
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
              })
            }}
          />
          <Select
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            value={{ value: statusFilter, label: statusFilter === "all" ? "All Status" : statusFilter === "active" ? "Active" : "Inactive" }}
            onChange={(option) => setStatusFilter(option.value)}
            className="w-full sm:w-32 text-sm"
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
              })
            }}
          />
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-xs md:text-sm"
          >
            <FaPlus className="inline mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Add Tutorial</span>
          </button>
        </div>
      </div>

      {/* Tutorials Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-white rounded-full p-6 shadow-lg mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Tutorials</h3>
          <p className="text-gray-600 text-center max-w-md">
            Please wait while we fetch the tutorial data...
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mx-2 md:mx-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutorial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tutorialsData?.tutorials?.map((tutorial) => (
                  <tr key={tutorial._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {tutorial.type === 'video' ? <FaVideo className="h-5 w-5 text-gray-600" /> : <FaBook className="h-5 w-5 text-gray-600" />}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{tutorial.title}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <FaClock className="mr-1 h-3 w-3" />
                            {tutorial.duration}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {tutorial.category.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tutorial.type === 'video' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {tutorial.type === 'video' ? <FaVideo className="mr-1 h-3 w-3" /> : <FaBook className="mr-1 h-3 w-3" />}
                        {tutorial.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tutorial.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tutorial.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(tutorial)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Tutorial"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(tutorial._id)}
                          className={tutorial.isActive ? "text-yellow-600 hover:text-yellow-900" : "text-green-600 hover:text-green-900"}
                          title={tutorial.isActive ? "Deactivate Tutorial" : "Activate Tutorial"}
                        >
                          {tutorial.isActive ? <FaToggleOn className="h-4 w-4" /> : <FaToggleOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(tutorial._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Tutorial"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  page === currentPage
                    ? 'text-blue-600 bg-blue-50 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isCreateModalOpen ? 'Create New Tutorial' : 'Edit Tutorial'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration *</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 5 min"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="text">Text</option>
                      <option value="video">Video</option>
                      <option value="interactive">Interactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Video URL (optional)</label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tutorial Steps</label>
                  <p className="text-xs text-gray-500 mb-3">Create step-by-step instructions for users to follow</p>

                  {formData.steps.map((step, index) => (
                    <div key={index} className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Step {index + 1}</span>
                        {formData.steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove this step"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <textarea
                        value={step}
                        onChange={(e) => updateStep(index, e.target.value)}
                        placeholder={`Describe step ${index + 1} in detail...`}
                        rows={2}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <div className="mt-2 text-xs text-gray-500">
                        💡 Tip: Be specific and include screenshots or visual cues when possible
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={addStep}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-600 rounded-md hover:bg-blue-50 flex items-center gap-2"
                    >
                      <span>+</span>
                      Add New Step
                    </button>

                    {formData.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newSteps = [...formData.steps];
                          newSteps.splice(formData.steps.length - 1, 0, "");
                          setFormData(prev => ({ ...prev, steps: newSteps }));
                        }}
                        className="px-4 py-2 text-sm text-green-600 hover:text-green-800 border border-green-600 rounded-md hover:bg-green-50 flex items-center gap-2"
                      >
                        <span>↗</span>
                        Insert Step
                      </button>
                    )}
                  </div>

                  {formData.steps.length === 0 && (
                    <div className="mt-3 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <p className="text-gray-500 text-sm">No steps added yet</p>
                      <p className="text-gray-400 text-xs mt-1">Click "Add New Step" to get started</p>
                    </div>
                  )}

                  {formData.steps.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800 text-sm">
                        <span>📋</span>
                        <span><strong>{formData.steps.length}</strong> step{formData.steps.length !== 1 ? 's' : ''} will be created</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="popular"
                    checked={formData.popular}
                    onChange={(e) => setFormData(prev => ({ ...prev, popular: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="popular" className="ml-2 block text-sm text-gray-900">
                    Mark as Popular Tutorial
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedTutorial(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={isCreateModalOpen ? handleCreate : handleUpdate}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (isCreateModalOpen ? 'Create' : 'Update')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorialManagement;