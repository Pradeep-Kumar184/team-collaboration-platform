import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Alert,
  Table,
  Badge,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { invitationAPI } from "../services/api";

const TeamInvitations = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);

  const [invitationForm, setInvitationForm] = useState({
    email: "",
    role: "MEMBER",
  });

  const canManageInvitations = user?.role === "ADMIN" || user?.role === "MANAGER";

  useEffect(() => {
    if (canManageInvitations) {
      fetchInvitations();
    }
  }, [canManageInvitations]);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const response = await invitationAPI.getTeamInvitations();
      setInvitations(response.data || []);
    } catch (err) {
      setError("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const response = await invitationAPI.create(invitationForm);
      if (response.success) {
        setSuccess(`Invitation created! Share this link: ${response.data.invitationUrl}`);
        setInvitations([...invitations, response.data]);
        setShowModal(false);
        setInvitationForm({ email: "", role: "MEMBER" });
        fetchInvitations(); // Refresh the list
      }
    } catch (err) {
      setError(err.error || "Failed to create invitation");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInvitation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invitation?")) {
      return;
    }

    try {
      await invitationAPI.delete(id);
      setInvitations(invitations.filter(inv => inv._id !== id));
      setSuccess("Invitation deleted successfully");
    } catch (err) {
      setError("Failed to delete invitation");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess("Invitation link copied to clipboard!");
    });
  };

  if (!canManageInvitations) {
    return (
      <Card>
        <Card.Body>
          <p className="text-muted">You don't have permission to manage team invitations.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Team Invitations</h5>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              + Create Invitation
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

          {loading ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-muted text-center">No active invitations</p>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created By</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => (
                  <tr key={invitation._id}>
                    <td>
                      <code>{invitation.code.substring(0, 8)}...</code>
                    </td>
                    <td>{invitation.email || "Any email"}</td>
                    <td>
                      <Badge bg={
                        invitation.role === "ADMIN" ? "danger" :
                        invitation.role === "MANAGER" ? "warning" : "secondary"
                      }>
                        {invitation.role}
                      </Badge>
                    </td>
                    <td>{invitation.createdBy?.name}</td>
                    <td>{new Date(invitation.expiresAt).toLocaleDateString()}</td>
                    <td>
                      <Badge bg={invitation.isUsed ? "success" : "primary"}>
                        {invitation.isUsed ? "Used" : "Active"}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-2"
                        onClick={() => copyToClipboard(
                          `${window.location.origin}/join/${invitation.code}`
                        )}
                      >
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDeleteInvitation(invitation._id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Create Invitation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Team Invitation</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateInvitation}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Email (Optional)</Form.Label>
              <Form.Control
                type="email"
                placeholder="Leave empty for any email"
                value={invitationForm.email}
                onChange={(e) => setInvitationForm({ ...invitationForm, email: e.target.value })}
              />
              <Form.Text className="text-muted">
                If specified, only this email can use the invitation
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={invitationForm.role}
                onChange={(e) => setInvitationForm({ ...invitationForm, role: e.target.value })}
              >
                <option value="MEMBER">Member</option>
                <option value="MANAGER">Manager</option>
                {user?.role === "ADMIN" && <option value="ADMIN">Admin</option>}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={creating}>
              {creating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Creating...
                </>
              ) : (
                "Create Invitation"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamInvitations;