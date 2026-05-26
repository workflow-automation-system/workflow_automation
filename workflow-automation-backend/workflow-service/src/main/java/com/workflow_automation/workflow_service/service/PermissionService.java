package com.workflow_automation.workflow_service.service;

import com.workflow_automation.workflow_service.dto.GrantPermissionRequest;
import com.workflow_automation.workflow_service.dto.WorkflowPermissionDTO;
import com.workflow_automation.workflow_service.dto.organization.OrganizationMemberResponse;
import com.workflow_automation.workflow_service.entity.Workflow;
import com.workflow_automation.workflow_service.entity.WorkflowPermission;
import com.workflow_automation.workflow_service.entity.enums.PermissionType;
import com.workflow_automation.workflow_service.exception.ForbiddenException;
import com.workflow_automation.workflow_service.repository.WorkflowPermissionRepository;
import com.workflow_automation.workflow_service.security.AccessContext;
import com.workflow_automation.workflow_service.security.PlatformRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private static final Set<PermissionType> OWNER_PERMISSIONS = EnumSet.of(
            PermissionType.VIEW,
            PermissionType.EDIT,
            PermissionType.EXECUTE
    );

    private final WorkflowPermissionRepository permissionRepository;
    private final WorkflowAccessService workflowAccessService;
    private final OrganizationDirectoryClient organizationDirectoryClient;

    @Transactional
    public WorkflowPermissionDTO grantPermission(GrantPermissionRequest request, AccessContext accessContext) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(request.getWorkflowId(), accessContext);
        workflowAccessService.assertCanManagePermissions(workflow, accessContext);
        validateTargetMember(workflow, request.getUserId());

        WorkflowPermission permission = permissionRepository
                .findByWorkflow_IdAndUserId(request.getWorkflowId(), request.getUserId())
                .orElse(WorkflowPermission.builder()
                        .workflow(workflow)
                        .userId(request.getUserId())
                        .organizationId(workflow.getOrganizationId())
                        .grantedBy(accessContext.getUserId())
                        .build());

        permission.setPermissions(sanitizePermissions(request.getPermissions()));
        permission.setGrantedBy(accessContext.getUserId());
        WorkflowPermission saved = permissionRepository.save(permission);

        return convertToDTO(saved);
    }

    @Transactional
    public void revokePermission(Long workflowId, Long userId, AccessContext accessContext) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext);
        workflowAccessService.assertCanManagePermissions(workflow, accessContext);

        if (workflow.getUserId() != null && workflow.getUserId().equals(userId)) {
            throw new ForbiddenException("Owner permissions cannot be revoked");
        }

        permissionRepository.deleteByWorkflow_IdAndUserId(workflowId, userId);
    }

    @Transactional
    public WorkflowPermissionDTO updatePermission(Long workflowId, Long userId,
                                                  List<PermissionType> permissions,
                                                  AccessContext accessContext) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext);
        workflowAccessService.assertCanManagePermissions(workflow, accessContext);
        validateTargetMember(workflow, userId);

        if (workflow.getUserId() != null && workflow.getUserId().equals(userId)) {
            throw new ForbiddenException("Owner permissions are managed automatically");
        }

        WorkflowPermission permission = permissionRepository
                .findByWorkflow_IdAndUserId(workflowId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Permission not found"));

        permission.setPermissions(sanitizePermissions(permissions));
        permission.setGrantedBy(accessContext.getUserId());
        WorkflowPermission updated = permissionRepository.save(permission);

        return convertToDTO(updated);
    }

    public List<WorkflowPermissionDTO> getWorkflowPermissions(Long workflowId, AccessContext accessContext) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext);
        workflowAccessService.assertCanManagePermissions(workflow, accessContext);

        return permissionRepository.findByWorkflow_Id(workflowId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<WorkflowPermissionDTO> getUserPermission(Long workflowId, Long userId, AccessContext accessContext) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext);
        if (!(workflowAccessService.canShare(workflow, accessContext) || accessContext.getUserId().equals(userId))) {
            throw new ForbiddenException("You do not have access to this permission record");
        }

        return permissionRepository.findByWorkflow_IdAndUserId(workflowId, userId)
                .map(this::convertToDTO);
    }

    public boolean hasPermission(Long workflowId, Long userId, PermissionType permission, AccessContext accessContext) {
        Workflow workflow = workflowAccessService.getAccessibleWorkflow(workflowId, accessContext);
        if (!(workflowAccessService.canShare(workflow, accessContext) || accessContext.getUserId().equals(userId))) {
            throw new ForbiddenException("You do not have access to this permission record");
        }

        if (workflow.getUserId() != null && workflow.getUserId().equals(userId)) {
            return OWNER_PERMISSIONS.contains(permission);
        }

        return permissionRepository.findByWorkflow_IdAndUserId(workflowId, userId)
                .map(wp -> wp.getPermissions().contains(permission))
                .orElse(false);
    }

    public List<Long> getWorkflowsByPermission(Long userId, Long organizationId, PermissionType permission, AccessContext accessContext) {
        if (!accessContext.getOrganizationId().equals(organizationId)) {
            throw new ForbiddenException("Cross-organization access is not allowed");
        }

        if (!accessContext.getUserId().equals(userId) && accessContext.getRole() != PlatformRole.ADMIN) {
            throw new ForbiddenException("You cannot inspect another user's workflow permissions");
        }

        return permissionRepository.findByUserIdAndOrganizationId(userId, organizationId).stream()
                .filter(wp -> wp.getPermissions().contains(permission))
                .map(wp -> wp.getWorkflow().getId())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteWorkflowPermissions(Long workflowId) {
        List<WorkflowPermission> permissions = permissionRepository.findByWorkflow_Id(workflowId);
        permissionRepository.deleteAll(permissions);
    }

    @Transactional
    public void ensureOwnerPermissions(Workflow workflow) {
        if (workflow.getId() == null || workflow.getUserId() == null) {
            return;
        }

        WorkflowPermission permission = permissionRepository
                .findByWorkflow_IdAndUserId(workflow.getId(), workflow.getUserId())
                .orElse(WorkflowPermission.builder()
                        .workflow(workflow)
                        .userId(workflow.getUserId())
                        .organizationId(workflow.getOrganizationId())
                        .grantedBy(workflow.getUserId())
                        .build());

        permission.setPermissions(EnumSet.copyOf(OWNER_PERMISSIONS));
        permission.setGrantedBy(workflow.getUserId());
        permissionRepository.save(permission);
    }

    private void validateTargetMember(Workflow workflow, Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("A target user is required");
        }

        OrganizationMemberResponse member = organizationDirectoryClient.getMember(workflow.getOrganizationId(), userId);
        if (member == null) {
            throw new ForbiddenException("Workflow permissions can only be granted to members of the same organization");
        }
    }

    private Set<PermissionType> sanitizePermissions(Set<PermissionType> permissions) {
        if (permissions == null || permissions.isEmpty()) {
            throw new IllegalArgumentException("At least one permission is required");
        }

        EnumSet<PermissionType> sanitized = EnumSet.copyOf(permissions);
        sanitized.removeIf(permission -> permission == null);
        sanitized.retainAll(OWNER_PERMISSIONS);

        if (sanitized.isEmpty()) {
            throw new IllegalArgumentException("Permissions must contain VIEW, EDIT, or EXECUTE");
        }

        return sanitized;
    }

    private Set<PermissionType> sanitizePermissions(List<PermissionType> permissions) {
        return sanitizePermissions(permissions == null ? Set.of() : Set.copyOf(permissions));
    }

    private WorkflowPermissionDTO convertToDTO(WorkflowPermission permission) {
        return WorkflowPermissionDTO.builder()
                .id(permission.getId())
                .workflowId(permission.getWorkflow().getId())
                .userId(permission.getUserId())
                .permissions(permission.getPermissions())
                .grantedBy(permission.getGrantedBy())
                .grantedAt(permission.getGrantedAt())
                .build();
    }
}
