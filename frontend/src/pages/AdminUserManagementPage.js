import React, { useState, useEffect, useCallback } from "react";
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
    role: "registered"
  });
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        window.location.href = "/admin/login";
        return;
      }
      
      const response = await fetch(
        `${API_BASE_URL}/admin/users?page=${currentPage}&page_size=${itemsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          window.location.href = "/admin/login";
          return;
        }
        if (response.status === 404) {
          setUsers([]);
          setTotalUsers(0);
          setTotalPages(1);
          setLoading(false);
          return;
        }
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      const usersList = data.users || data || [];
      setUsers(usersList);
      setTotalUsers(data.total || usersList.length);
      setTotalPages(Math.ceil((data.total || usersList.length) / itemsPerPage));
    } catch (err) {
      if (err.message.includes("401") || err.message.includes("403")) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        window.location.href = "/admin/login";
        return;
      }
      setError(err.message || "Failed to load users");
      setUsers([]);
      setTotalUsers(0);
      setTotalPages(1);
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        window.location.href = "/admin/login";
        return;
      }
      
      const response = await fetch(
        `${API_BASE_URL}/admin/users?page=1&page_size=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      const usersList = data.users || data || [];
      setUsers(usersList);
      setTotalUsers(data.total || usersList.length);
    } catch (err) {
      if (err.message.includes("401") || err.message.includes("403")) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        window.location.href = "/admin/login";
        return;
      }
      console.error("Error fetching all users:", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const hasActiveFilters = searchQuery || filterRole !== "all";
    if (!hasActiveFilters && currentPage !== 1) {
      fetchUsers();
    }
  }, [currentPage, searchQuery, filterRole, fetchUsers]);

  
  useEffect(() => {
    const hasActiveFilters = searchQuery || filterRole !== "all";
    if (hasActiveFilters) {
      fetchAllUsers();
    }
  }, [searchQuery, filterRole, fetchAllUsers]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    
    let roleFilter = filterRole;
    if (filterRole === "subscriber") {
      roleFilter = "premium";
    }
    
    const matchesRole = filterRole === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  
  const hasActiveFilters = searchQuery || filterRole !== "all";
  
  
  const paginatedUsers = hasActiveFilters
    ? filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : users; 
  
  const displayTotalPages = hasActiveFilters
    ? Math.ceil(filteredUsers.length / itemsPerPage)
    : totalPages;
  const displayTotal = hasActiveFilters
    ? filteredUsers.length
    : totalUsers;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + paginatedUsers.length, displayTotal);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, filterRole, currentPage]);

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
      case "premium":
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
      case "premium":
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
      role: user.role || "registered"
    });
  };

  const handleEditClose = () => {
    setEditingUser(null);
    setEditForm({
      username: "",
      email: "",
      role: "registered"
    });
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.username || user.email}"? This action cannot be undone.`)) {
      return;
    }

    const token = localStorage.getItem("adminToken");
    
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          window.location.href = "/admin/login";
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to delete user");
      }
      
      setUsers(prevUsers => prevUsers.filter(u => 
        u.id !== user.id && u.uuid !== user.uuid
      ));
      setTotalUsers(prev => Math.max(0, prev - 1));
    
      if (paginatedUsers.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (err) {
      if (err.message.includes("401") || err.message.includes("403")) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        window.location.href = "/admin/login";
        return;
      }
      setError(err.message || "Failed to delete user");
      console.error("Error deleting user:", err);
    }
  };

  const handleEditSave = async () => {
    if (!editingUser) return;

    const token = localStorage.getItem("adminToken");
    
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }
    
    try {
      const updatePayload = {
        username: editForm.username,
        email: editForm.email,
        role: editForm.role
      };
      
      const response = await fetch(`${API_BASE_URL}/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          window.location.href = "/admin/login";
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update user");
      }

      const updatedUser = await response.json();
      
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === editingUser.id || user.uuid === editingUser.uuid
            ? { ...updatedUser }
            : user
        )
      );
      
      handleEditClose();
    } catch (err) {
      if (err.message.includes("401") || err.message.includes("403")) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        window.location.href = "/admin/login";
        return;
      }
      setError(err.message || "Failed to update user");
      console.error("Error updating user:", err);
    }
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
          <option value="premium">Premium</option>
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
                        <button 
                          className="action-btn delete" 
                          title="Delete user"
                          onClick={() => handleDeleteUser(user)}
                        >
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
              Showing {startIndex + 1}-{endIndex} of {displayTotal} users
            </p>
          </div>
          
          {/* Pagination */}
          {displayTotalPages > 1 && (
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
                {Array.from({ length: displayTotalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === displayTotalPages ||
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
                onClick={() => setCurrentPage(prev => Math.min(displayTotalPages, prev + 1))}
                disabled={currentPage === displayTotalPages}
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
                  <option value="premium">Premium</option>
                  <option value="admin">Admin</option>
                </select>
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

