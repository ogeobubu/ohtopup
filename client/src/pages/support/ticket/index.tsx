import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTicket, replyTicket, getTickets, getUser } from "../../../api";
import { toast } from "react-toastify";
import Modal from "../../../admin/components/modal";
import Textfield from "../../../components/ui/forms/input";
import Textarea from "../../../components/ui/forms/textarea";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { FaEye } from "react-icons/fa";

const primaryBtn =
  "inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-accent px-[15px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-accent-dark disabled:opacity-45";
const secondaryBtn =
  "inline-flex min-h-[38px] items-center justify-center gap-3 rounded-md border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink transition hover:bg-tint disabled:opacity-45 disabled:cursor-not-allowed";
const primarySm =
  "inline-flex min-h-[32px] items-center justify-center gap-2 rounded-md border border-transparent bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-dark";

const Ticket = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleCreateModal = () => setIsCreateModalOpen((prev) => !prev);
  const toggleReplyModal = () => setIsReplyModalOpen((prev) => !prev);

  const { data: user } = useQuery({ queryKey: ["user"], queryFn: getUser });
  const { data: ticketsData = {}, isLoading } = useQuery({
    queryKey: ["tickets", currentPage, ticketsPerPage, searchQuery],
    queryFn: () => getTickets(currentPage, ticketsPerPage, searchQuery),
  });

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      toast.success("Ticket created!");
      toggleCreateModal();
      queryClient.invalidateQueries(["tickets"] as any);
    },
    onError: () => toast.error("Failed to create ticket."),
  });

  const replyMutation = useMutation({
    mutationFn: replyTicket,
    onSuccess: () => {
      toast.success("Reply sent!");
      toggleReplyModal();
      queryClient.invalidateQueries(["tickets"] as any);
    },
    onError: () => toast.error("Failed to send reply."),
  });

  const tickets = ticketsData?.tickets || [];
  const totalPages = Math.ceil((ticketsData?.totalCount || 0) / ticketsPerPage);
  const statusColor = (s: string) => (s === "open" ? "#27805d" : "#b84545");

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="!mb-0 block text-xs font-mediumish text-ink">Your Tickets</p>
        <button onClick={toggleCreateModal} className={primarySm}>
          Create
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by Ticket ID…"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="h-11 w-full max-w-[320px] rounded-md border border-line bg-bg px-3 text-xs text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/40"
        />
      </div>

      {isLoading ? (
        <div className="p-12 text-center" role="status">
          <p className="text-xs text-muted">Loading tickets…</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-xs text-muted">No tickets yet.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line">
                  {["ID", "Title", "Date", "Status", "View"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium uppercase text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t: any) => (
                  <tr key={t._id} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-3 font-mono text-xs">{t.ticketId}</td>
                    <td className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap px-4 py-3" title={t.title}>
                      {t.title}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium capitalize" style={{ color: statusColor(t.status) }}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedTicket(t);
                          toggleReplyModal();
                        }}
                        className="p-1 text-accent"
                        aria-label={`View ticket ${t.ticketId}`}
                      >
                        <FaEye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-4">
              <button className={secondaryBtn} disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)}>
                ← Prev
              </button>
              <span className="text-xs text-muted">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className={secondaryBtn}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <Modal isOpen={isCreateModalOpen} closeModal={toggleCreateModal} title="Create Ticket">
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
                <label className="mb-2 block text-xs font-mediumish text-ink">Title</label>
                <Field
                  name="title"
                  as={Textfield}
                  className="h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
                  placeholder="Enter ticket title"
                />
                <ErrorMessage name="title" component="div" className="mt-1 text-[11px] text-danger" />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-xs font-mediumish text-ink">Description</label>
                <Field
                  name="description"
                  as={Textarea}
                  className="min-h-[100px] w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
                  placeholder="Enter ticket description"
                />
                <ErrorMessage name="description" component="div" className="mt-1 text-[11px] text-danger" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={toggleCreateModal} className={secondaryBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className={primaryBtn}>
                  {isSubmitting ? "Creating…" : "Create Ticket"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>

      <Modal isOpen={isReplyModalOpen} closeModal={toggleReplyModal} title="Ticket Replies">
        {selectedTicket && (
          <div>
            <h3 className="mb-2 text-[15px] font-semibold">{selectedTicket.title}</h3>
            <p className="mb-4 text-[13px] text-muted">{selectedTicket.description}</p>
            <div className="mb-4 border-t border-line pt-4">
              <p className="mb-2 block text-xs font-mediumish text-ink">Replies</p>
              {selectedTicket.replies?.length ? (
                <div className="grid gap-2.5">
                  {selectedTicket.replies.map((reply: any) => (
                    <div
                      key={reply._id}
                      className={[
                        "max-w-[80%] rounded-md border border-line p-3",
                        reply.role === "admin" ? "self-start bg-tint" : "self-end bg-paper ml-auto",
                      ].join(" ")}
                    >
                      {reply.role === "admin" && <div className="mb-1 text-[11px] font-semibold">Admin</div>}
                      <p className="text-[13px] leading-relaxed">{reply.content}</p>
                      <small className="mt-1.5 block text-[11px] text-muted">
                        {new Date(reply.createdAt).toLocaleString()}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted">No replies yet.</p>
              )}
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
                  <Form>
                    <Field
                      name="replyContent"
                      as={Textarea}
                      placeholder="Type your reply…"
                      className="mb-3 min-h-[80px] w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
                    />
                    <div className="flex justify-end">
                      <button type="submit" disabled={isSubmitting} className={primarySm}>
                        {isSubmitting ? "Replying…" : "Reply"}
                      </button>
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
