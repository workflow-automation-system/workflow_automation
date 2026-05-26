package com.workflow_automation.workflow_service.service;

import com.workflow_automation.workflow_service.entity.Workflow;
import com.workflow_automation.workflow_service.entity.WorkflowPermission;
import com.workflow_automation.workflow_service.entity.enums.PermissionType;
import com.workflow_automation.workflow_service.exception.ForbiddenException;
import com.workflow_automation.workflow_service.exception.WorkflowNotFoundException;
import com.workflow_automation.workflow_service.repository.WorkflowPermissionRepository;
import com.workflow_automation.workflow_service.repository.WorkflowRepository;
import com.workflow_automation.workflow_service.security.AccessContext;
import com.workflow_automation.workflow_service.security.PlatformRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkflowAccessService {

    private static final EnumSet<PermissionType> OWNER_PERMISSIONS = EnumSet.of(
            PermissionType.VIEW,
            PermissionType.EDIT,
            PermissionType.EXECUTE
    );

    private final WorkflowRepository workflowRepository;
    private final WorkflowPermissionRepository workflowPermissionRepository;

    public List<Workflow> getAccessibleWorkflows(AccessContext context) {
        List<Workflow> organizationWorkflows = workflowRepository.findByOrganizationIdOrderByUpdatedAtDesc(context.getOrganizationId());
        if (context.getRole() == PlatformRole.ADMIN) {
            return organizationWorkflows;
        }

        Map<Long, Set<PermissionType>> permissionMap = getPermissionMap(context);
        return organizationWorkflows.stream()
                .filter(workflow -> hasViewAccess(workflow, context, permissionMap))
                .toList();
    }

    public Workflow getAccessibleWorkflow(Long workflowId, AccessContext context) {
        Workflow workflow = workflowRepository.findByIdAndOrganizationId(workflowId, context.getOrganizationId())
                .orElseThrow(() -> new WorkflowNotFoundException(workflowId));

        if (!canView(workflow, context)) {
            throw new ForbiddenException("You do not have access to this workflow");
        }

        return workflow;
    }

    public void assertCanCreate(AccessContext context) {
        if (context.getRole() == PlatformRole.VIEWER) {
            throw new ForbiddenException("Viewer accounts cannot create workflows");
        }
    }

    public void assertCanEdit(Workflow workflow, AccessContext context) {
        if (!canEdit(workflow, context)) {
            throw new ForbiddenException("You do not have permission to edit this workflow");
        }
    }

    public void assertCanDelete(Workflow workflow, AccessContext context) {
        if (!canEdit(workflow, context)) {
            throw new ForbiddenException("You do not have permission to delete this workflow");
        }
    }

    public void assertCanExecute(Workflow workflow, AccessContext context) {
        if (!canExecute(workflow, context)) {
            throw new ForbiddenException("You do not have permission to execute this workflow");
        }
    }

    public void assertCanManagePermissions(Workflow workflow, AccessContext context) {
        if (!(isAdmin(context) || isOwner(workflow, context))) {
            throw new ForbiddenException("Only the workflow owner or an admin can manage sharing");
        }
    }

    public boolean canView(Workflow workflow, AccessContext context) {
        return hasViewAccess(workflow, context, getPermissionMap(context));
    }

    public boolean canEdit(Workflow workflow, AccessContext context) {
        return hasPermission(workflow, context, PermissionType.EDIT);
    }

    public boolean canExecute(Workflow workflow, AccessContext context) {
        return hasPermission(workflow, context, PermissionType.EXECUTE);
    }

    public boolean canShare(Workflow workflow, AccessContext context) {
        return isAdmin(context) || isOwner(workflow, context);
    }

    public Set<PermissionType> resolvePermissions(Workflow workflow, AccessContext context) {
        if (isAdmin(context) || isOwner(workflow, context)) {
            return EnumSet.copyOf(OWNER_PERMISSIONS);
        }

        return workflowPermissionRepository.findByWorkflow_IdAndUserId(workflow.getId(), context.getUserId())
                .map(permission -> permission.getPermissions().isEmpty()
                        ? EnumSet.noneOf(PermissionType.class)
                        : EnumSet.copyOf(permission.getPermissions()))
                .orElseGet(() -> EnumSet.noneOf(PermissionType.class));
    }

    public boolean isOwner(Workflow workflow, AccessContext context) {
        return workflow.getUserId() != null && workflow.getUserId().equals(context.getUserId());
    }

    private boolean isAdmin(AccessContext context) {
        return context.getRole() == PlatformRole.ADMIN;
    }

    private boolean hasPermission(Workflow workflow, AccessContext context, PermissionType permissionType) {
        if (isAdmin(context) || isOwner(workflow, context)) {
            return true;
        }

        return workflowPermissionRepository.findByWorkflow_IdAndUserId(workflow.getId(), context.getUserId())
                .map(permission -> permission.getPermissions().contains(permissionType))
                .orElse(false);
    }

    private Map<Long, Set<PermissionType>> getPermissionMap(AccessContext context) {
        return workflowPermissionRepository.findByUserIdAndOrganizationId(context.getUserId(), context.getOrganizationId())
                .stream()
                .collect(Collectors.toMap(
                        permission -> permission.getWorkflow().getId(),
                        WorkflowPermission::getPermissions,
                        (left, right) -> {
                            EnumSet<PermissionType> merged = left.isEmpty()
                                    ? EnumSet.noneOf(PermissionType.class)
                                    : EnumSet.copyOf(left);
                            merged.addAll(right);
                            return merged;
                        }
                ));
    }

    private boolean hasViewAccess(Workflow workflow, AccessContext context, Map<Long, Set<PermissionType>> permissionMap) {
        if (isAdmin(context) || isOwner(workflow, context)) {
            return true;
        }

        Set<PermissionType> permissions = permissionMap.get(workflow.getId());
        return permissions != null && permissions.stream().anyMatch(isViewEquivalent());
    }

    private Predicate<PermissionType> isViewEquivalent() {
        return permissionType -> permissionType == PermissionType.VIEW
                || permissionType == PermissionType.EDIT
                || permissionType == PermissionType.EXECUTE;
    }
}
