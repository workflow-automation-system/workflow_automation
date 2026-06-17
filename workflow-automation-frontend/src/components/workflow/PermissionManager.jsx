import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';
import usePermissionStore from '../../stores/permissionStore';
import {
  PERMISSION_TYPES,
  PERMISSION_LABELS,
  PERMISSION_DESCRIPTIONS,
} from '../../api/permissionApi';

const PermissionManager = ({ workflowId, canManagePermissions }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const {
    workflowPermissions,
    isLoading,
    fetchWorkflowPermissions,
    grantPermission,
    updatePermission,
    revokePermission,
  } = usePermissionStore();

  const permissions = workflowPermissions[workflowId] || [];

  useEffect(() => {
    if (workflowId && canManagePermissions) {
      fetchWorkflowPermissions(workflowId).catch((err) =>
        setError(`Failed to load permissions: ${err.message}`)
      );
    }
  }, [workflowId, canManagePermissions, fetchWorkflowPermissions]);

  const handlePermissionToggle = (permission) => {
    const newPermissions = new Set(selectedPermissions);
    if (newPermissions.has(permission)) {
      newPermissions.delete(permission);
    } else {
      newPermissions.add(permission);
    }
    setSelectedPermissions(newPermissions);
  };

  const handleGrantPermission = async () => {
    if (!selectedUser || selectedPermissions.size === 0) {
      setError('Please select a user and at least one permission');
      return;
    }

    try {
      setError(null);
      const userId = parseInt(selectedUser, 10);
      await grantPermission(workflowId, userId, Array.from(selectedPermissions));
      setSuccess(`Permissions granted successfully!`);
      setSelectedUser('');
      setSelectedPermissions(new Set());
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to grant permissions: ${err.message}`);
    }
  };

  const handleUpdatePermission = async (userId) => {
    if (selectedPermissions.size === 0) {
      setError('Please select at least one permission');
      return;
    }

    try {
      setError(null);
      await updatePermission(workflowId, userId, Array.from(selectedPermissions));
      setSuccess('Permissions updated successfully!');
      setEditingId(null);
      setSelectedPermissions(new Set());
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to update permissions: ${err.message}`);
    }
  };

  const handleRevokePermission = async (userId) => {
    if (window.confirm('Are you sure you want to revoke all permissions for this user?')) {
      try {
        setError(null);
        await revokePermission(workflowId, userId);
        setSuccess('Permissions revoked successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(`Failed to revoke permissions: ${err.message}`);
      }
    }
  };

  const handleEditClick = (permission) => {
    setEditingId(permission.id);
    setSelectedUser(permission.userId.toString());
    setSelectedPermissions(new Set(permission.permissions));
  };

  const handleCancel = () => {
    setEditingId(null);
    setSelectedUser('');
    setSelectedPermissions(new Set());
    setShowModal(false);
  };

  if (!canManagePermissions) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#292D32]">Workflow Access</h3>
        {!showModal && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D0FFA4] text-[#292D32] rounded-lg font-medium hover:bg-[#B8FF7D] transition-colors"
          >
            <UserPlus size={18} />
            Grant Access
          </button>
        )}
      </div>

      {/* Grant Permission Form */}
      {showModal && (
        <div className="border border-[#E2E8F0] rounded-lg p-4 bg-[#F8FAFC] space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#292D32] mb-2">
              User ID
            </label>
            <input
              type="number"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              disabled={editingId !== null}
              placeholder="Enter user ID"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-[#292D32] focus:outline-none focus:ring-2 focus:ring-[#D0FFA4]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#292D32] mb-3">
              Permissions
            </label>
            <div className="space-y-2">
              {Object.entries(PERMISSION_TYPES).map(([key, value]) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.has(value)}
                    onChange={() => handlePermissionToggle(value)}
                    className="mt-1 w-4 h-4 rounded border-[#E2E8F0] cursor-pointer"
                  />
                  <div>
                    <p className="font-medium text-[#292D32]">{PERMISSION_LABELS[value]}</p>
                    <p className="text-xs text-[#64748B]">{PERMISSION_DESCRIPTIONS[value]}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                editingId
                  ? handleUpdatePermission(Number(selectedUser))
                  : handleGrantPermission()
              }
              disabled={isLoading || !selectedUser || selectedPermissions.size === 0}
              className="flex-1 px-4 py-2 bg-[#D0FFA4] text-[#292D32] rounded-lg font-medium hover:bg-[#B8FF7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {editingId ? 'Update' : 'Grant'} Permissions
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-[#E2E8F0] text-[#292D32] rounded-lg font-medium hover:bg-[#F1F5F9] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Permissions List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-[#64748B]">Loading permissions...</div>
        ) : permissions.length === 0 ? (
          <div className="text-center py-8 text-[#64748B]">
            No permissions granted yet. Click "Grant Access" to share this workflow.
          </div>
        ) : (
          permissions.map((permission) => (
            <div
              key={permission.id}
              className="border border-[#E2E8F0] rounded-lg p-4 bg-white hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-[#292D32]">User ID: {permission.userId}</p>
                  <p className="text-xs text-[#64748B] mt-1">
                    Granted by User {permission.grantedBy} on{' '}
                    {new Date(permission.grantedAt).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {permission.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-[#D0FFA4] text-[#292D32] text-xs font-medium rounded"
                      >
                        <Check size={12} />
                        {PERMISSION_LABELS[perm]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(permission)}
                    className="p-2 text-[#64748B] hover:text-[#292D32] hover:bg-[#E2E8F0] rounded-lg transition-colors"
                    title="Edit permissions"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleRevokePermission(permission.userId)}
                    className="p-2 text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors"
                    title="Revoke permissions"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PermissionManager;
