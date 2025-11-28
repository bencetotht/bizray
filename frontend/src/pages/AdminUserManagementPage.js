import React, { useState, useEffect } from "react";
import { Users, Search, Mail, Calendar, Shield, Trash2, Edit, X, Save, Ban, ChevronLeft, ChevronRight } from "lucide-react";
import "./AdminUserManagementPage.css";

const API_BASE_URL = "https://apibizray.bnbdevelopment.hu/api/v1";

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    role: "registered",
    isBlocked: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("adminToken");
      
      if (token === "dev-mock-admin-token") {
        setTimeout(() => {
          setUsers([
            {
              id: 1,
              uuid: "user-1-uuid",
              username: "john_doe",
              email: "john@example.com",
              role: "registered",
              registered_at: "2024-01-15T10:30:00",
              isBlocked: false
            },
            {
              id: 2,
              uuid: "user-2-uuid",
              username: "jane_smith",
              email: "jane@example.com",
              role: "subscriber",
              registered_at: "2024-02-20T14:15:00",
              isBlocked: false
            },
            {
              id: 3,
              uuid: "dev-admin-uuid",
              username: "admin",
              email: "admin@admin.com",
              role: "admin",
              registered_at: "2024-01-01T00:00:00",
              isBlocked: false
            },
            {
              id: 4,
              uuid: "user-4-uuid",
              username: "bob_wilson",
              email: "bob@example.com",
              role: "registered",
              registered_at: "2024-03-10T09:45:00",
              isBlocked: false
            },
            {
              id: 5,
              uuid: "user-5-uuid",
              username: "alice_brown",
              email: "alice@example.com",
              role: "subscriber",
              registered_at: "2024-03-15T11:20:00",
              isBlocked: false
            },
            {
              id: 6,
              uuid: "user-6-uuid",
              username: "blocked_user",
              email: "blocked@example.com",
              role: "registered",
              registered_at: "2024-01-10T08:00:00",
              isBlocked: true
            },
            {
              id: 7,
              uuid: "user-7-uuid",
              username: "charlie_davis",
              email: "charlie@example.com",
              role: "registered",
              registered_at: "2024-03-20T12:00:00",
              isBlocked: false
            },
            {
              id: 8,
              uuid: "user-8-uuid",
              username: "diana_prince",
              email: "diana@example.com",
              role: "subscriber",
              registered_at: "2024-03-25T15:30:00",
              isBlocked: false
            },
            {
              id: 9,
              uuid: "user-9-uuid",
              username: "edward_miller",
              email: "edward@example.com",
              role: "registered",
              registered_at: "2024-04-01T09:15:00",
              isBlocked: false
            },
            {
              id: 10,
              uuid: "user-10-uuid",
              username: "fiona_green",
              email: "fiona@example.com",
              role: "subscriber",
              registered_at: "2024-04-05T11:45:00",
              isBlocked: false
            },
            {
              id: 11,
              uuid: "user-11-uuid",
              username: "george_taylor",
              email: "george@example.com",
              role: "registered",
              registered_at: "2024-04-10T14:20:00",
              isBlocked: false
            },
            {
              id: 12,
              uuid: "user-12-uuid",
              username: "helen_wilson",
              email: "helen@example.com",
              role: "subscriber",
              registered_at: "2024-04-15T16:00:00",
              isBlocked: false
            }
          ]);
          setLoading(false);
        }, 500);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setUsers([]);
          setLoading(false);
          return;
        }
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || data || []);
    } catch (err) {
      const token = localStorage.getItem("adminToken");
      if (token === "dev-mock-admin-token") {
        setUsers([
          {
            id: 1,
            uuid: "user-1-uuid",
            username: "john_doe",
            email: "john@example.com",
            role: "registered",
            registered_at: "2024-01-15T10:30:00"
          },
          {
            id: 2,
            uuid: "user-2-uuid",
            username: "jane_smith",
            email: "jane@example.com",
            role: "subscriber",
            registered_at: "2024-02-20T14:15:00"
          },
          {
            id: 3,
            uuid: "dev-admin-uuid",
            username: "admin",
            email: "admin@admin.com",
            role: "admin",
            registered_at: "2024-01-01T00:00:00"
          }
        ]);
      } else {
        setError(err.message || "Failed to load users");
        setUsers([]);
      }
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === "all" || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  //pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin":
        return "role-badge admin";
      case "registered":
        return "role-badge registered";
      case "subscriber":
        return "role-badge subscriber";
      default:
        return "role-badge";
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "registered":
        return "Basic";
      case "subscriber":
        return "Premium";
      default:
        return role || "N/A";
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username || "",
      email: user.email || "",
      role: user.role || "registered",
      isBlocked: user.isBlocked || false
    });
  };

  const handleEditClose = () => {
    setEditingUser(null);
    setEditForm({
      username: "",
      email: "",
      role: "registered",
      isBlocked: false
    });
  };

  const handleEditSave = () => {
    if (!editingUser) return;

    // Update user in the list
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === editingUser.id || user.uuid === editingUser.uuid
          ? { ...user, ...editForm }
          : user
      )
    );

    // When the backend is ready uncomment the following code
    // await fetch(`${API_BASE_URL}/admin/users/${editingUser.id}`, {
    //   method: "PUT",
    //   headers: {
    //     Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
    //     "Content-Type": "application/json"
    //   },
    //   body: JSON.stringify(editForm)
    // });

    handleEditClose();
  };

  if (loading) {
    return (
      <div className="admin-users-page">
        <div className="admin-users-card">
          <div className="loading-state">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <h1>User Management</h1>
          <p>Manage and monitor all system users</p>
        </div>
        <button onClick={fetchUsers} className="btn btn-primary">
          Refresh
        </button>
      </div>

      <div className="admin-users-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by email or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="registered">Basic (Registered)</option>
          <option value="subscriber">Premium (Subscriber)</option>
        </select>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="admin-users-card">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>No users found</h3>
            <p>{searchQuery || filterRole !== "all" ? "Try adjusting your filters" : "No users in the system yet"}</p>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id || user.uuid}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <span className="user-name">{user.username || "N/A"}</span>
                          {user.isBlocked && (
                            <span className="blocked-badge">
                              <Ban size={12} />
                              Blocked
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="user-email">
                        <Mail size={16} />
                        {user.email}
                      </div>
                    </td>
                    <td>
                      <span className={getRoleBadgeClass(user.role)}>
                        <Shield size={14} />
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td>
                      <div className="user-date">
                        <Calendar size={16} />
                        {formatDate(user.registered_at)}
                      </div>
                    </td>
                    <td>
                      <div className="user-actions">
                        <button 
                          className="action-btn edit" 
                          title="Edit user"
                          onClick={() => handleEditClick(user)}
                        >
                          <Edit size={16} />
                        </button>
                        <button className="action-btn delete" title="Delete user">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredUsers.length > 0 && (
        <>
          <div className="users-summary">
            <p>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
              {filteredUsers.length !== users.length && ` (${users.length} total)`}
            </p>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              
              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        className={`pagination-page ${currentPage === page ? "active" : ""}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="pagination-ellipsis">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={handleEditClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="modal-close" onClick={handleEditClose}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-username">Username</label>
                <input
                  type="text"
                  id="edit-username"
                  className="form-input"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-email">Email</label>
                <input
                  type="email"
                  id="edit-email"
                  className="form-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-role">Role</label>
                <select
                  id="edit-role"
                  className="form-select"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="registered">Basic (Registered)</option>
                  <option value="subscriber">Premium (Subscriber)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label htmlFor="edit-blocked">Block User</label>
                    <p>Prevent this user from accessing the system</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      id="edit-blocked"
                      checked={editForm.isBlocked}
                      onChange={(e) => setEditForm({ ...editForm, isBlocked: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleEditClose}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEditSave}>
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

