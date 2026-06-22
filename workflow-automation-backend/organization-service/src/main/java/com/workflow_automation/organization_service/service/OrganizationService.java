package com.workflow_automation.organization_service.service;

import com.workflow_automation.organization_service.dto.*;
import com.workflow_automation.organization_service.entity.Organization;
import com.workflow_automation.organization_service.entity.OrganizationMember;
import com.workflow_automation.organization_service.repository.OrganizationMemberRepository;
import com.workflow_automation.organization_service.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;

    // ================= ORGANIZATION =================

    public OrganizationSummary resolveOrganization(OrganizationResolveRequest request) {

        String name = request.getName().trim();
        String domain = request.getDomain() != null ? normalizeDomain(request.getDomain()) : null;

        Organization org = (domain == null
                ? organizationRepository.findByNameIgnoreCase(name)
                : organizationRepository.findByDomainIgnoreCase(domain)
                .or(() -> organizationRepository.findByNameIgnoreCase(name)))
                .orElseGet(() -> organizationRepository.save(
                        Organization.builder()
                                .name(name)
                                .domain(domain)
                                .build()
                ));

        return toSummary(org);
    }

    public OrganizationSummary getOrganizationSummary(Long id) {
        return toSummary(findOrganization(id));
    }

    public OrganizationResponse getOrganization(Long id) {
        Organization org = findOrganization(id);

        List<OrganizationMember> members =
                organizationMemberRepository.findAllByOrganization_IdOrderByCreatedAtAsc(id);

        return toResponse(org, members);
    }

    // ================= MEMBERS =================

    public OrganizationSummary syncMember(Long organizationId, OrganizationMemberSyncRequest request) {
        Organization org = findOrganization(organizationId);
        OrganizationMember member = organizationMemberRepository
                .findByUserId(request.getUserId())
                .orElse(new OrganizationMember());
        member.setUserId(request.getUserId());
        member.setOrganization(org);
        member.setName(request.getName().trim());
        member.setEmail(request.getEmail().trim().toLowerCase());
        member.setRole(resolveSyncedRole(member, request.getRole()));
        member.setDepartment(defaultIfBlank(request.getDepartment(), "Unassigned"));
        member.setJobTitle(defaultIfBlank(request.getJobTitle(), "Team Member"));
        member.setStatus(defaultIfBlank(request.getStatus(), "Pending"));
        organizationMemberRepository.save(member);
        return toSummary(org);
    }

    public OrganizationMemberResponse getMember(Long organizationId, Long userId) {
        OrganizationMember member = organizationMemberRepository
                .findByOrganization_IdAndUserId(organizationId, userId)
                .orElseThrow(() -> new NoSuchElementException("Member not found"));
        return toMemberResponse(member);
    }

    public List<OrganizationMemberResponse> getMembers(Long organizationId) {
        return organizationMemberRepository
                .findAllByOrganization_Id(organizationId)
                .stream()
                .map(this::toMemberResponse)
                .toList();
    }

    public void removeMember(Long organizationId, Long userId) {
        OrganizationMember member = organizationMemberRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Member not found"));
        if (!member.getOrganization().getId().equals(organizationId)) {
            throw new RuntimeException("Member does not belong to organization");
        }
        organizationMemberRepository.delete(member);
    }

    public void updateRole(Long organizationId, Long userId, String role) {
        OrganizationMember member = organizationMemberRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Member not found"));
        if (!member.getOrganization().getId().equals(organizationId)) {
            throw new RuntimeException("Member does not belong to organization");
        }
        member.setRole(sanitizeRole(role));
        organizationMemberRepository.save(member);
    }

    // ================= DEPARTMENT CRUD =================

    /**
     * List distinct department names for an organization.
     */
    public List<String> listDepartments(Long organizationId) {
        return organizationMemberRepository.findAllByOrganization_Id(organizationId)
                .stream()
                .map(m -> m.getDepartment() != null ? m.getDepartment() : "Unassigned")
                .distinct()
                .sorted()
                .toList();
    }

    /**
     * Create a new department (no-op if already exists).
     */
    public void createDepartment(Long organizationId, String name) {
        // Ensure the name is unique – callers should check before invoking.
        List<String> existing = listDepartments(organizationId);
        if (!existing.contains(name)) {
            // No dedicated entity; just a placeholder to satisfy UI expectations.
            // Optionally, could create a dummy member with no userId, but we keep it simple.
        }
    }

    /**
     * Rename a department and update all members.
     */
    public void renameDepartment(Long organizationId, String oldName, String newName) {
        List<OrganizationMember> members = organizationMemberRepository.findAllByOrganization_Id(organizationId);
        for (OrganizationMember m : members) {
            String dept = m.getDepartment() != null ? m.getDepartment() : "Unassigned";
            if (dept.equals(oldName)) {
                m.setDepartment(newName);
                organizationMemberRepository.save(m);
            }
        }
    }

    /**
     * Delete a department; reassign its members to "Unassigned".
     */
    public void deleteDepartment(Long organizationId, String name) {
        List<OrganizationMember> members = organizationMemberRepository.findAllByOrganization_Id(organizationId);
        for (OrganizationMember m : members) {
            String dept = m.getDepartment() != null ? m.getDepartment() : "Unassigned";
            if (dept.equals(name)) {
                m.setDepartment("Unassigned");
                organizationMemberRepository.save(m);
            }
        }
    }

    // ================= MAPPERS =================

    private Organization findOrganization(Long id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Organization not found"));
    }

    private OrganizationSummary toSummary(Organization org) {
        return OrganizationSummary.builder()
                .id(org.getId())
                .name(org.getName())
                .domain(org.getDomain())
                .memberCount(organizationMemberRepository.countByOrganization_Id(org.getId()))
                .build();
    }

    private OrganizationResponse toResponse(Organization org, List<OrganizationMember> members) {

        List<OrganizationMember> sorted = members.stream()
                .sorted(Comparator.comparing(
                        OrganizationMember::getName,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                ))
                .toList();

        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .domain(org.getDomain())
                .createdAt(org.getCreatedAt())
                .memberCount((long) sorted.size())
                .activeMemberCount(sorted.stream()
                        .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()))
                        .count())
                .privilegedRoleCount(sorted.stream()
                        .filter(m -> "ADMIN".equalsIgnoreCase(m.getRole()))
                        .count())
                .members(sorted.stream()
                        .map(this::toMemberResponse)
                        .toList())
                .build();
    }

    private OrganizationMemberResponse toMemberResponse(OrganizationMember m) {
        return OrganizationMemberResponse.builder()
                .id(m.getId())
                .userId(m.getUserId())
                .name(m.getName())
                .email(m.getEmail())
                .role(m.getRole())
                .department(m.getDepartment())
                .jobTitle(m.getJobTitle())
                .status(m.getStatus())
                .build();
    }

    // ================= UTIL =================

    private String normalizeDomain(String domain) {
        return domain.trim().toLowerCase().replace("www.", "");
    }

    private String sanitizeRole(String role) {
        if (role == null) return "USER";
        role = role.trim().toUpperCase();
        // VIEWER role has been removed; default to USER for any unknown role
        return (role.equals("ADMIN") || role.equals("USER")) ? role : "USER";
    }

    private String resolveSyncedRole(OrganizationMember existingMember, String requestedRole) {
        return sanitizeRole(requestedRole);
    }

    private String defaultIfBlank(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value.trim();
    }
}
