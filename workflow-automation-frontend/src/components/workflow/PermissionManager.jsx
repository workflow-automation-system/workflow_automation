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
import organizationService from '../../services/organizationService';

const PermissionManager = ({ workflowId, canManagePermissions }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [members, setMembers] = useState([]);

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
      organizationService.getMembers()
        .then(setMembers)
        .catch(err => console.error('Failed to fetch org members', err));
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

      {/* Header / Actions */}
      {!showModal && (
        <button
          onClick={() => setShowModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D0FFA4] px-4 py-2.5 text-sm font-semibold text-[#292D32] transition-colors hover:bg-[#BDEB94]"
        >
          <UserPlus size={16} />
          Grant Access
        </button>
      )}

      {/* Grant Permission Form */}
      {showModal && (
        <div className="border border-[#E2E8F0] rounded-lg p-4 bg-[#F8FAFC] space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#292D32] mb-2">
              User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              disabled={editingId !== null}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-[#292D32] focus:outline-none focus:ring-2 focus:ring-[#D0FFA4] bg-white disabled:opacity-50"
            >
              <option value="" disabled>Select a user</option>
              {members.map(member => (
                <option key={member.userId} value={member.userId}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
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
              className="group rounded-xl border border-[#E2E8F0] bg-white p-4 transition-all hover:border-[#CBD5E1] hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#FAFAFC] text-sm font-bold uppercase text-[#292D32]">
                    {(members.find(m => m.userId === permission.userId)?.name || 'U').charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#292D32]">
                      {members.find(m => m.userId === permission.userId)?.name || `User ID ${permission.userId}`}
                    </p>
                    {members.find(m => m.userId === permission.userId)?.email && (
                      <p className="mt-0.5 text-xs text-[#5C5C5C]">
                        {members.find(m => m.userId === permission.userId).email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleEditClick(permission)}
                    className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#292D32]"
                    title="Edit permissions"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleRevokePermission(permission.userId)}
                    className="rounded-lg p-1.5 text-[#EF4444] transition-colors hover:bg-red-50"
                    title="Revoke permissions"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {permission.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-bold text-[#292D32]"
                  >
                    <Check size={10} className="text-[#64748B]" />
                    {PERMISSION_LABELS[perm]}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PermissionManager;
