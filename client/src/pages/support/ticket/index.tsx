import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTicket, replyTicket, getTickets, getUser } from "../../../api";
import { toast } from "react-toastify";
import Modal from "../../../admin/components/modal";
import Textfield from "../../../components/ui/forms/input";
import Textarea from "../../../components/ui/forms/textarea";
import Button from "../../../components/ui/forms/button";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { FaEye } from "react-icons/fa";

const Ticket = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
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
    onSuccess: () => { toast.success("Ticket created!"); toggleCreateModal(); queryClient.invalidateQueries(["tickets"]); },
    onError: () => toast.error("Failed to create ticket."),
  });

  const replyMutation = useMutation({
    mutationFn: replyTicket,
    onSuccess: () => { toast.success("Reply sent!"); toggleReplyModal(); queryClient.invalidateQueries(["tickets"]); },
    onError: () => toast.error("Failed to send reply."),
  });

  const tickets = ticketsData?.tickets || [];
  const totalPages = Math.ceil((ticketsData?.totalCount || 0) / ticketsPerPage);

  const statusColor = (s) => s === 'open' ? '#27805d' : '#b84545';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p className="ot-field-label" style={{ marginBottom: 0 }}>Your Tickets</p>
        <button onClick={toggleCreateModal} className="ot-button ot-button-primary" style={{ fontSize: 12, padding: '6px 14px', minHeight: 'auto' }}>Create</button>
      </div>

      <div style={{ marginBottom: 16 }}><input type="text" placeholder="Search by Ticket ID…" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="ot-field" style={{ width: '100%', maxWidth: 320 }} /></div>

      {isLoading ? (
        <div className="ot-empty" role="status"><p>Loading tickets…</p></div>
      ) : tickets.length === 0 ? (
        <div className="ot-empty"><p>No tickets yet.</p></div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ot-line)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase' }}>ID</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase' }}>Title</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--ot-muted)', fontSize: 11, textTransform: 'uppercase' }}>View</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t._id} style={{ borderBottom: '1px solid var(--ot-line)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12 }}>{t.ticketId}</td>
                    <td style={{ padding: '12px 16px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.title}>{t.title}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ot-muted)', fontSize: 12 }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 12, color: statusColor(t.status), fontWeight: 500, textTransform: 'capitalize' }}>{t.status}</span></td>
                    <td style={{ padding: '12px 16px' }}><button onClick={() => { setSelectedTicket(t); toggleReplyModal(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ot-accent)', padding: 4 }}><FaEye size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '16px 0' }}>
              <button className="ot-button ot-button-secondary" disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)}>← Prev</button>
              <span style={{ fontSize: 12, color: 'var(--ot-muted)' }}>Page {currentPage} of {totalPages}</span>
              <button className="ot-button ot-button-secondary" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} closeModal={toggleCreateModal} title="Create Ticket">
        <Formik initialValues={{ title: "", description: "", email: user?.email }} validationSchema={Yup.object({ title: Yup.string().required("Title is required"), description: Yup.string().required("Description is required") })} onSubmit={(values, { resetForm }) => { createMutation.mutate(values); resetForm(); }}>
          {({ isSubmitting }) => (
            <Form>
              <div style={{ marginBottom: 16 }}><label className="ot-field-label">Title</label><Field name="title" as={Textfield} className="ot-field" style={{ width: '100%' }} placeholder="Enter ticket title" /><ErrorMessage name="title" component="div" className="ot-field-error" /></div>
              <div style={{ marginBottom: 16 }}><label className="ot-field-label">Description</label><Field name="description" as={Textarea} className="ot-field" style={{ width: '100%' }} placeholder="Enter ticket description" /><ErrorMessage name="description" component="div" className="ot-field-error" /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button type="button" onClick={toggleCreateModal} className="ot-button ot-button-secondary">Cancel</button><button type="submit" disabled={isSubmitting} className="ot-button ot-button-primary">{isSubmitting ? "Creating…" : "Create Ticket"}</button></div>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Reply Modal */}
      <Modal isOpen={isReplyModalOpen} closeModal={toggleReplyModal} title="Ticket Replies">
        {selectedTicket && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{selectedTicket.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--ot-muted)', marginBottom: 16 }}>{selectedTicket.description}</p>
            <div style={{ borderTop: '1px solid var(--ot-line)', paddingTop: 16, marginBottom: 16 }}>
              <p className="ot-field-label">Replies</p>
              {selectedTicket.replies.length ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {selectedTicket.replies.map((reply) => (
                    <div key={reply._id} style={{ padding: 12, borderRadius: 6, background: reply.role === 'admin' ? 'var(--ot-tint)' : 'var(--ot-paper)', border: '1px solid var(--ot-line)', maxWidth: '80%', alignSelf: reply.role === 'admin' ? 'start' : 'end', marginLeft: reply.role === 'admin' ? 0 : 'auto' }}>
                      {reply.role === 'admin' && <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Admin</div>}
                      <p style={{ fontSize: 13, lineHeight: 1.6 }}>{reply.content}</p>
                      <small style={{ fontSize: 11, color: 'var(--ot-muted)', display: 'block', marginTop: 6 }}>{new Date(reply.createdAt).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--ot-muted)' }}>No replies yet.</p>
              )}
            </div>
            {selectedTicket?.status !== "closed" && (
              <Formik initialValues={{ replyContent: "" }} onSubmit={(values, { resetForm }) => { replyMutation.mutate({ ticketId: selectedTicket._id, userId: selectedTicket?.userId, content: values.replyContent, role: "user" }); resetForm(); }}>
                {({ isSubmitting }) => (
                  <Form>
                    <Field name="replyContent" as={Textarea} placeholder="Type your reply…" className="ot-field" style={{ width: '100%', marginBottom: 12 }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="submit" disabled={isSubmitting} className="ot-button ot-button-primary" style={{ fontSize: 12, padding: '8px 16px', minHeight: 'auto' }}>{isSubmitting ? "Replying…" : "Reply"}</button></div>
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
