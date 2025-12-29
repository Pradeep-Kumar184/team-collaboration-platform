import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Container,
  Card,
  Modal,
  Form,
  Badge,
  Alert,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/api";
import TeamInvitations from "../components/TeamInvitations";

const Team = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // Fetch team members from API
  const fetchTeamMembers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await userAPI.getTeam();
      setTeamMembers(response.data || []);
    } catch (err) {
      setError("Failed to load team members");
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const handleShowModal = (member) => {
    setEditingMember(member);
    setNewRole(member.role);
    setShowModal(true);
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await userAPI.updateRole(editingMember._id, newRole);
      setTeamMembers((prev) =>
        prev.map((member) =>
          member._id === editingMember._id
            ? { ...member, role: newRole }
            : member
        )
      );
      setShowModal(false);
      // Refresh team members to get updated data
      fetchTeamMembers();
    } catch (err) {
      setError(err.error || "Failed to update role");
    }
  };

  const handleDebugTeam = async () => {
    setError("");
    try {
      const response = await userAPI.debugTeam();
      setDebugInfo(response.data);
      setShowDebug(true);
      // Refresh team members after debug fix
      fetchTeamMembers();
    } catch (err) {
      setError(err.error || "Failed to debug team");
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "ADMIN":
        return <Badge bg="danger">Admin</Badge>;
      case "MANAGER":
        return <Badge bg="warning">Manager</Badge>;
      case "MEMBER":
        return <Badge bg="secondary">Member</Badge>;
      default:
        return <Badge bg="info">{role}</Badge>;
    }
  };

  const canEditRoles = user?.role === "ADMIN";

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-4">
        <h1>Team Management</h1>
        <p className="text-muted">Manage your team members and invitations</p>
      </div>

      {error && <Alert variant="warning">{error}</Alert>}

      <Row>
        <Col md={12} className="mb-4">
          <TeamInvitations />
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Current Team Members</h5>
            {user?.role === "ADMIN" && (
              <Button
                variant="outline-warning"
                size="sm"
                onClick={handleDebugTeam}
              >
                🔧 Debug Team
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member._id}>
                  <td>
                    <strong>{member.name}</strong>
                    {member._id === user?._id && (
                      <Badge bg="info" className="ms-2">
                        You
                      </Badge>
                    )}
                  </td>
                  <td>{member.email}</td>
                  <td>{getRoleBadge(member.role)}</td>
                  <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                  <td>
                    {canEditRoles && member._id !== user?._id && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleShowModal(member)}
                      >
                        Edit Role
                      </Button>
                    )}
                    {member._id === user?._id && (
                      <span className="text-muted small">Current User</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {teamMembers.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">No team members found.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Role Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Member Role</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateRole}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <p>
              <strong>Member:</strong> {editingMember?.name} ({editingMember?.email})
            </p>

            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                required
              >
                <option value="MEMBER">Member</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </Form.Select>
              <Form.Text className="text-muted">
                <small>
                  <strong>Member:</strong> Basic access<br />
                  <strong>Manager:</strong> Can create projects and tasks<br />
                  <strong>Admin:</strong> Full access including user management
                </small>
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update Role
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Debug Info Modal */}
      <Modal show={showDebug} onHide={() => setShowDebug(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Team Debug Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {debugInfo && (
            <div>
              <Alert variant="info">
                <strong>Company Team Debug Results:</strong>
                <ul className="mb-0 mt-2">
                  <li>Total Users in Database: {debugInfo.totalUsers}</li>
                  <li>Users in Company Team: {debugInfo.usersInCompanyTeam}</li>
                  <li>Users Fixed: {debugInfo.usersFixed}</li>
                </ul>
              </Alert>
              
              <h6>All Company Team Members:</h6>
              <Table size="sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {debugInfo.allUsers.map((user, index) => (
                    <tr key={index}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge bg={
                          user.role === "ADMIN" ? "danger" :
                          user.role === "MANAGER" ? "warning" : "secondary"
                        }>
                          {user.role}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDebug(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Team;