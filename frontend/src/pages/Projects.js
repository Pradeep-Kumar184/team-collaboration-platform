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
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { projectAPI } from "../services/api";

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
  });
  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Fetch projects from API
  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data || []);
    } catch (err) {
      setError("Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleShowModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status,
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: "",
        description: "",
        status: "active",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitLoading(true);

    try {
      if (editingProject) {
        // Update project
        const response = await projectAPI.update(editingProject._id, formData);
        if (response.success) {
          setProjects((prev) =>
            prev.map((p) => (p._id === editingProject._id ? response.data : p))
          );
          setShowModal(false);
        } else {
          setError(response.error || "Update failed");
        }
      } else {
        // Create new project
        const response = await projectAPI.create(formData);
        if (response.success) {
          setProjects((prev) => [response.data, ...prev]);
          setShowModal(false);
        } else {
          setError(response.error || "Create failed");
        }
      }
    } catch (err) {
      setError(err.error || err.message || "Operation failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      setDeleteLoading(projectId);
      setError("");
      
      try {
        const response = await projectAPI.delete(projectId);
        if (response.success) {
          setProjects((prev) => prev.filter((p) => p._id !== projectId));
        } else {
          setError(response.error || "Delete failed");
        }
      } catch (err) {
        setError(err.error || err.message || "Failed to delete project");
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge bg="success">Active</Badge>;
      case "in-progress":
        return <Badge bg="warning">In Progress</Badge>;
      case "completed":
        return <Badge bg="secondary">Completed</Badge>;
      default:
        return <Badge bg="info">{status}</Badge>;
    }
  };

  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canDelete = user?.role === "ADMIN";

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Projects</h1>
        {canEdit && (
          <Button variant="primary" onClick={() => handleShowModal()}>
            + New Project
          </Button>
        )}
      </div>

      {error && <Alert variant="warning">{error}</Alert>}

      <Card className="shadow-sm">
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project._id}>
                  <td>
                    <strong>{project.name}</strong>
                  </td>
                  <td>{project.description}</td>
                  <td>{getStatusBadge(project.status)}</td>
                  <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleShowModal(project)}
                      >
                        View
                      </Button>
                      {canEdit && (
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => handleShowModal(project)}
                        >
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(project._id)}
                          disabled={deleteLoading === project._id}
                        >
                          {deleteLoading === project._id ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {projects.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">
                No projects found. Create your first project!
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProject ? "Edit Project" : "Create New Project"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Project Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Enter project name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter project description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  {editingProject ? "Updating..." : "Creating..."}
                </>
              ) : (
                editingProject ? "Update" : "Create"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Projects;
