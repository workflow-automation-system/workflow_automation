package com.workflow_automation.organization_service.service;

import com.workflow_automation.organization_service.dto.*;
import com.workflow_automation.organization_service.entity.Department;
import com.workflow_automation.organization_service.entity.MemberStatus;
import com.workflow_automation.organization_service.entity.Organization;
import com.workflow_automation.organization_service.entity.OrganizationMember;
import com.workflow_automation.organization_service.repository.DepartmentRepository;
import com.workflow_automation.organization_service.repository.OrganizationMemberRepository;
import com.workflow_automation.organization_service.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private static final String UNASSIGNED = "Unassigned";

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${audit.service.url:http://audit-service:8085/api/notifications}")
    private String auditServiceUrl;
    private final DepartmentRepository departmentRepository;
    private final AuthClient authClient;

    // ================= ORGANIZATION =================

    public OrganizationSummary resolveOrganization(OrganizationResolveRequest request) {

        String name = request.getName().trim();
        String domain = request.getDomain() != null ? normalizeDomain(request.getDomain()) : null;

        Organization org = organizationRepository.findByNameIgnoreCase(name)
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

    public OrganizationMemberResponse inviteMember(Long organizationId, String email, String name, String role, String department, String jobTitle, Long invitedByUserId) {
        Organization org = findOrganization(organizationId);
        
        String normalizedEmail = email.trim().toLowerCase();
        organizationMemberRepository.findByOrganization_IdAndEmailIgnoreCase(organizationId, normalizedEmail)
                .ifPresent(m -> {
                    if ("PENDING".equals(m.getStatus())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "User is already invited");
                    } else {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "User is already a member");
                    }
                });

        OrganizationMember member = OrganizationMember.builder()
                .organization(org)
                .email(normalizedEmail)
                .name(name != null ? name.trim() : null)
                .role(sanitizeRole(role))
                .department(defaultIfBlank(department, UNASSIGNED))
                .jobTitle(defaultIfBlank(jobTitle, "Team Member"))
                .status("PENDING")
                .inviteToken(java.util.UUID.randomUUID().toString())
                .inviteExpiresAt(java.time.LocalDateTime.now().plusDays(7))
                .invitedByUserId(invitedByUserId)
                .build();

        return toMemberResponse(organizationMemberRepository.save(member));
    }

    public List<OrganizationMemberResponse> listPendingInvitations(Long organizationId) {
        return organizationMemberRepository.findAllByOrganization_Id(organizationId)
                .stream()
                .filter(m -> "PENDING".equalsIgnoreCase(m.getStatus()))
                .map(this::toMemberResponse)
                .toList();
    }

    public void cancelInvitation(Long organizationId, Long inviteId) {
        OrganizationMember member = organizationMemberRepository.findByIdAndOrganization_Id(inviteId, organizationId)
                .orElseThrow(() -> new NoSuchElementException("Invitation not found"));
                
        if (!"PENDING".equalsIgnoreCase(member.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot cancel an accepted membership");
        }
        
        organizationMemberRepository.delete(member);
    }

    public OrganizationSummary acceptInvitation(String token, Long userId, String email, String name) {
        OrganizationMember member = organizationMemberRepository.findByInviteToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid or expired invitation token"));
                
        if (!"PENDING".equalsIgnoreCase(member.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitation has already been accepted");
        }
        
        if (member.getInviteExpiresAt() != null && member.getInviteExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitation has expired");
        }

        member.setUserId(userId);
        member.setEmail(email.trim().toLowerCase());
        member.setName(name);
        member.setStatus("ACCEPTED");
        member.setInviteToken(null);
        member.setInviteExpiresAt(null);
        
        organizationMemberRepository.save(member);

        try {
            String message = String.format(
                "%s a rejoint %s et est prêt à collaborer sur vos workflows.",
                name != null ? name : email,
                member.getOrganization().getName()
            );

            var requestBody = new java.util.HashMap<String, Object>();
            requestBody.put("organizationId", member.getOrganization().getId());
            requestBody.put("userId", member.getInvitedByUserId());
            requestBody.put("type", "MEMBER_JOINED");
            requestBody.put("message", message);

            restTemplate.postForEntity(auditServiceUrl, requestBody, Void.class);
        } catch (Exception ex) {
            System.err.println("Failed to send invitation acceptance notification: " + ex.getMessage());
        }

        return toSummary(member.getOrganization());
    }


    public OrganizationSummary syncMember(Long organizationId, OrganizationMemberSyncRequest request) {
        String rawStatus = request.getStatus();
        if (rawStatus == null || rawStatus.isBlank()) {
            rawStatus = MemberStatus.ACCEPTED.name();
        }

        Organization org = findOrganization(organizationId);
        OrganizationMember member = organizationMemberRepository
                .findByUserId(request.getUserId())
                .orElse(new OrganizationMember());
        member.setUserId(request.getUserId());
        member.setOrganization(org);
        member.setName(request.getName().trim());
        member.setEmail(request.getEmail().trim().toLowerCase());
        member.setRole(resolveSyncedRole(member, request.getRole()));
        if (request.getDepartment() != null) {
            member.setDepartment(request.getDepartment());
        }
        if (request.getJobTitle() != null) {
            member.setJobTitle(request.getJobTitle());
        }
        member.setStatus(rawStatus.toUpperCase());
        organizationMemberRepository.save(member);
        return toSummary(org);
    }

    public OrganizationMemberResponse getMember(Long organizationId, Long userId) {
        OrganizationMember member = organizationMemberRepository
                .findByOrganization_IdAndUserId(organizationId, userId)
                .orElseThrow(() -> new NoSuchElementException("Member not found"));
        return toMemberResponse(member);
    }

    public OrganizationMemberResponse getMemberByToken(String token) {
        OrganizationMember member = organizationMemberRepository
                .findByInviteToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid or expired invitation token"));
        return toMemberResponse(member);
    }

    public List<OrganizationMemberResponse> getMembers(Long organizationId) {
        return organizationMemberRepository
                .findAllByOrganization_Id(organizationId)
                .stream()
                .filter(m -> MemberStatus.ACCEPTED.name().equalsIgnoreCase(m.getStatus()))
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

        try {
            String message = String.format("Votre rôle a été mis à jour vers : %s", member.getRole());
            var requestBody = new java.util.HashMap<String, Object>();
            requestBody.put("organizationId", organizationId);
            requestBody.put("userId", userId);
            requestBody.put("type", "ROLE_UPDATED");
            requestBody.put("message", message);

            restTemplate.postForEntity(auditServiceUrl, requestBody, Void.class);
        } catch (Exception ex) {
            System.err.println("Failed to send role update notification: " + ex.getMessage());
        }
    }

    // ================= DEPARTMENTS =================

    public List<DepartmentResponse> listDepartmentDetails(Long organizationId) {
        findOrganization(organizationId);
        seedDepartmentsFromMembers(organizationId);
        Map<String, long[]> counts = memberCountsByDepartment(organizationId);

        return departmentRepository.findAllByOrganization_IdOrderByNameAsc(organizationId)
                .stream()
                .map(department -> toDepartmentResponse(department, counts))
                .toList();
    }

    public DepartmentResponse createDepartment(Long organizationId, String rawName) {
        Organization org = findOrganization(organizationId);
        String name = normalizeDepartmentName(rawName);

        if (UNASSIGNED.equalsIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot create a reserved department name");
        }

        if (departmentRepository.existsByOrganization_IdAndNameIgnoreCase(organizationId, name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department already exists");
        }

        Department saved = departmentRepository.save(Department.builder()
                .organization(org)
                .name(name)
                .build());

        Map<String, long[]> counts = memberCountsByDepartment(organizationId);
        return toDepartmentResponse(saved, counts);
    }

    public DepartmentResponse renameDepartment(Long organizationId, String rawOldName, String rawNewName) {
        findOrganization(organizationId);
        String oldName = normalizeDepartmentName(rawOldName);
        String newName = normalizeDepartmentName(rawNewName);

        if (UNASSIGNED.equalsIgnoreCase(oldName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot rename the default department");
        }
        if (UNASSIGNED.equalsIgnoreCase(newName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot use a reserved department name");
        }
        if (oldName.equalsIgnoreCase(newName)) {
            return getDepartmentResponse(organizationId, oldName);
        }
        if (departmentRepository.existsByOrganization_IdAndNameIgnoreCase(organizationId, newName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department already exists");
        }

        Department department = departmentRepository
                .findByOrganization_IdAndNameIgnoreCase(organizationId, oldName)
                .orElseThrow(() -> new NoSuchElementException("Department not found"));

        department.setName(newName);
        departmentRepository.save(department);

        updateMemberDepartments(organizationId, oldName, newName);
        authClient.renameDepartment(organizationId, oldName, newName);

        return getDepartmentResponse(organizationId, newName);
    }

    public void deleteDepartment(Long organizationId, String rawName) {
        findOrganization(organizationId);
        String name = normalizeDepartmentName(rawName);

        if (UNASSIGNED.equalsIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete the default department");
        }

        long assignedMembers = organizationMemberRepository.findAllByOrganization_Id(organizationId)
                .stream()
                .filter(member -> name.equalsIgnoreCase(
                        member.getDepartment() != null ? member.getDepartment().trim() : UNASSIGNED))
                .count();

        if (assignedMembers > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete a department with assigned members. Reassign them first."
            );
        }

        Department department = departmentRepository
                .findByOrganization_IdAndNameIgnoreCase(organizationId, name)
                .orElseThrow(() -> new NoSuchElementException("Department not found"));

        authClient.deleteDepartment(organizationId, name);
        departmentRepository.delete(department);
    }

    public boolean departmentExists(Long organizationId, String rawName) {
        findOrganization(organizationId);
        if (rawName == null || rawName.isBlank() || UNASSIGNED.equalsIgnoreCase(rawName.trim())) {
            return true;
        }
        return departmentRepository.existsByOrganization_IdAndNameIgnoreCase(
                organizationId,
                normalizeDepartmentName(rawName)
        );
    }

    public void seedDepartmentsFromMembers(Long organizationId) {
        Organization org = findOrganization(organizationId);
        organizationMemberRepository.findAllByOrganization_Id(organizationId)
                .stream()
                .map(member -> member.getDepartment() != null ? member.getDepartment().trim() : UNASSIGNED)
                .filter(name -> !name.isBlank() && !UNASSIGNED.equalsIgnoreCase(name))
                .distinct()
                .forEach(name -> {
                    if (!departmentRepository.existsByOrganization_IdAndNameIgnoreCase(organizationId, name)) {
                        departmentRepository.save(Department.builder()
                                .organization(org)
                                .name(name)
                                .build());
                    }
                });
    }

    public String getDepartmentNameById(Long organizationId, Long departmentId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new NoSuchElementException("Department not found"));
        if (!department.getOrganization().getId().equals(organizationId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Department does not belong to organization");
        }
        return department.getName();
    }

    private DepartmentResponse getDepartmentResponse(Long organizationId, String name) {
        Department department = departmentRepository
                .findByOrganization_IdAndNameIgnoreCase(organizationId, name)
                .orElseThrow(() -> new NoSuchElementException("Department not found"));
        return toDepartmentResponse(department, memberCountsByDepartment(organizationId));
    }

    private Map<String, long[]> memberCountsByDepartment(Long organizationId) {
        return organizationMemberRepository.findAllByOrganization_Id(organizationId)
                .stream()
                .collect(Collectors.groupingBy(
                        member -> member.getDepartment() != null ? member.getDepartment() : UNASSIGNED,
                        Collectors.collectingAndThen(Collectors.toList(), members -> {
                            long total = members.size();
                            long admins = members.stream()
                                    .filter(m -> "ADMIN".equalsIgnoreCase(m.getRole()))
                                    .count();
                            return new long[]{total, admins};
                        })
                ));
    }

    private DepartmentResponse toDepartmentResponse(Department department, Map<String, long[]> counts) {
        long[] stats = counts.getOrDefault(department.getName(), new long[]{0L, 0L});
        return new DepartmentResponse(
                department.getId(),
                department.getName(),
                stats[0],
                stats[1]
        );
    }

    private void updateMemberDepartments(Long organizationId, String oldName, String newName) {
        organizationMemberRepository.findAllByOrganization_Id(organizationId)
                .stream()
                .filter(member -> oldName.equalsIgnoreCase(
                        member.getDepartment() != null ? member.getDepartment() : UNASSIGNED))
                .forEach(member -> {
                    member.setDepartment(newName);
                    organizationMemberRepository.save(member);
                });
    }

    private String normalizeDepartmentName(String value) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department name is required");
        }
        return value.trim();
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
                        .filter(m -> MemberStatus.ACCEPTED.name().equalsIgnoreCase(m.getStatus()))
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
                .organizationId(m.getOrganization() != null ? m.getOrganization().getId() : null)
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
