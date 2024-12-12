import React, { useState } from "react";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import Textfield from "../../../components/ui/forms/input";
import Textarea from "../../../components/ui/forms/textarea";
import Button from "../../../components/ui/forms/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTicket, replyTicket, getTickets, getUser } from "../../../api";
import { toast } from "react-toastify";
import Modal from "../../../admin/components/modal";
import Pagination from "../../../admin/components/pagination";
import Table from "../../../components/ui/table";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { FaEye } from "react-icons/fa";

const Ticket = ({ isDarkMode }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleCreateModal = () => setIsCreateModalOpen((prev) => !prev);
  const toggleReplyModal = () => setIsReplyModalOpen((prev) => !prev);

  const { data: user = null } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  const { data: ticketsData = {}, isLoading } = useQuery({
    queryKey: ["tickets", currentPage, ticketsPerPage, searchQuery],
    queryFn: () => getTickets(currentPage, ticketsPerPage, searchQuery),
  });

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      toast.success("Ticket created successfully!");
      toggleCreateModal();
      queryClient.invalidateQueries(["tickets"]);
    },
    onError: () => {
      toast.error("Failed to create ticket.");
    },
  });

  const replyMutation = useMutation({
    mutationFn: replyTicket,
    onSuccess: () => {
      toast.success("Reply sent successfully!");
      toggleReplyModal();
      queryClient.invalidateQueries(["tickets"]);
    },
    onError: () => {
      toast.error("Failed to send reply.");
    },
  });

  const columns = [
    {
      header: "ID",
      render: (ticket) => <span className="text-sm">{ticket.ticketId}</span>,
    },
    {
      header: "Title",
      render: (ticket) => <span className="text-sm">{ticket.title}</span>,
    },
    {
      header: "Date",
      render: (ticket) => (
        <small>{new Date(ticket.createdAt).toLocaleString()}</small>
      ),
    },
    {
      header: "Status",
      render: (ticket) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
            ticket.status === "open"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {ticket.status}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (ticket) => (
        <div
          className="cursor-pointer text-blue-500 hover:text-blue-700"
          onClick={() => {
            setSelectedTicket(ticket);
            toggleReplyModal();
          }}
          aria-label={`View replies for ${ticket.title}`}
        >
          <FaEye size={20} />
        </div>
      ),
    },
  ];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="p-4 border border-solid rounded-md border-gray-200 w-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Tickets</h2>
        <Button onClick={toggleCreateModal} size="sm">
          Create
        </Button>
      </div>

      <div className="my-4">
        <Textfield
          placeholder="Search by Ticket ID"
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full"
        />
      </div>

      <div className="my-5">
        {isLoading ? (
          <p>Loading tickets...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table columns={columns} data={ticketsData.tickets || []} />
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(ticketsData.totalCount / ticketsPerPage)}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        closeModal={toggleCreateModal}
        title="Create Ticket"
        isDarkMode={isDarkMode}
      >
        <Formik
          initialValues={{ title: "", description: "", email: user?.email }}
          validationSchema={Yup.object({
            title: Yup.string().required("Title is required"),
            description: Yup.string().required("Description is required"),
          })}
          onSubmit={(values, { resetForm }) => {
            createMutation.mutate(values);
            resetForm();
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700">
                  Title
                </label>
                <Field
                  name="title"
                  as={Textfield}
                  className="w-full"
                  placeholder="Enter ticket title"
                />
                <ErrorMessage
                  name="title"
                  component="div"
                  className="text-red-600"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-gray-700">
                  Description
                </label>
                <Field
                  name="description"
                  as={Textarea}
                  className="w-full"
                  placeholder="Enter ticket description"
                />
                <ErrorMessage
                  name="description"
                  component="div"
                  className="text-red-600"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={toggleCreateModal}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>

      <Modal
        isOpen={isReplyModalOpen}
        closeModal={toggleReplyModal}
        title="Ticket Replies"
        isDarkMode={isDarkMode}
      >
        {selectedTicket && (
          <div>
            <h3 className="text-xl font-bold mb-2">{selectedTicket.title}</h3>
            <p className="text-gray-700 mb-4">{selectedTicket.description}</p>
            <div className="border-t border-gray-300 pt-4">
              <h4 className="text-lg font-semibold mb-2">Replies</h4>
              <div className="flex flex-col">
                {selectedTicket.replies.length ? (
                  selectedTicket.replies.map((reply) => (
                    <div
                      key={reply._id}
                      className={`reply mb-3 flex ${
                        reply.role === "admin" ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`${
                          reply.role === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        } p-4 rounded-lg max-w-xs shadow-md`}
                        style={{
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                        }}
                      >
                        <strong className="font-semibold">
                          {reply.role === "admin" ? "Admin:" : ""}
                        </strong>
                        <p className="text-gray-800 mt-1">{reply.content}</p>
                        <small className="text-gray-500 block mt-2">
                          {new Date(reply.createdAt).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No replies yet.</p>
                )}
              </div>
            </div>

            {selectedTicket?.status !== "closed" && (
              <Formik
                initialValues={{ replyContent: "" }}
                onSubmit={(values, { resetForm }) => {
                  replyMutation.mutate({
                    ticketId: selectedTicket._id,
                    userId: selectedTicket?.userId,
                    content: values.replyContent,
                    role: "user",
                  });
                  resetForm();
                }}
              >
                {({ isSubmitting }) => (
                  <Form className="mt-4">
                    <Field
                      name="replyContent"
                      as={Textarea}
                      placeholder="Type your reply..."
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2"
                      >
                        {isSubmitting ? "Replying..." : "Reply"}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Ticket;
