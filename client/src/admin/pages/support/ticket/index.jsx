import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { replyTicket, getTickets, updateTicket } from "../../../api";
import { toast } from "react-toastify";
import Modal from "../../../components/modal";
import Table from "../../../components/table";
import Pagination from "../../../components/pagination";
import Textarea from "../../../../components/ui/forms/textarea";
import Textfield from "../../../../components/ui/forms/input";
import Button from "../../../../components/ui/forms/button";
import { Formik, Form, Field } from "formik";
import { FaEye, FaTrash } from "react-icons/fa";

const Ticket = ({ isDarkMode }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient(); 
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleReplyModal = () => setIsReplyModalOpen((prev) => !prev);

  const { data: ticketsData = { tickets: [], totalCount: 0 }, isLoading } = useQuery({
    queryKey: ["tickets", currentPage, ticketsPerPage, searchQuery],
    queryFn: () => getTickets(currentPage, ticketsPerPage, searchQuery),
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

  const closeTicketMutation = useMutation({
    mutationFn: (ticketId) => updateTicket(ticketId, { status: "closed" }),
    onSuccess: () => {
      toast.success("Ticket closed successfully!");
      queryClient.invalidateQueries(["tickets"]);
    },
    onError: () => {
      toast.error("Failed to close ticket.");
    },
  });

  const columns = [
    { header: "ID", render: (ticket) => <span className="text-sm">{ticket.ticketId}</span> },
    { header: "Title", render: (ticket) => <span className="text-sm">{ticket.title}</span> },
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
        <div className="flex space-x-2">
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
          {ticket.status === "open" && (
            <div
              className="cursor-pointer text-red-500 hover:text-red-700"
              onClick={() => closeTicketMutation.mutate(ticket._id)}
              aria-label={`Close ticket ${ticket.title}`}
            >
              <FaTrash size={20} />
            </div>
          )}
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Tickets</h2>
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
        isOpen={isReplyModalOpen}
        closeModal={toggleReplyModal}
        title="Ticket Replies"
        isDarkMode={isDarkMode}
      >
        {selectedTicket && (
          <div>
            <h3 className="text-xl font-bold mb-2">{selectedTicket.title}</h3>
            <p className="dark:text-white text-gray-700 mb-4">{selectedTicket.description}</p>
            <div className="border-t border-gray-300 pt-4">
              <h4 className="text-lg font-semibold mb-2">Replies</h4>
              <div className="flex flex-col">
                {selectedTicket.replies.length ? (
                  selectedTicket.replies.map((reply) => (
                    <div
                      key={reply._id}
                      className={`reply mb-3 flex ${
                        reply.role === "admin" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`${
                          reply.role === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        } p-3 rounded-lg max-w-xs`}
                        style={{
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                        }}
                      >
                        <strong>{reply.role === "admin" ? "" : "User:"}</strong>
                        <p className="text-gray-800">{reply.content}</p>
                        <small className="text-gray-500">
                          {new Date(reply.createdAt).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="dark:text-white text-gray-500">No replies yet.</p>
                )}
              </div>
            </div>

            <Formik
              initialValues={{ replyContent: "" }}
              onSubmit={(values, { resetForm }) => {
                replyMutation.mutate({
                  ticketId: selectedTicket._id,
                  userId: selectedTicket?.userId._id,
                  content: values.replyContent,
                  role: "admin",
                  email: selectedTicket?.userId.email
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Ticket;