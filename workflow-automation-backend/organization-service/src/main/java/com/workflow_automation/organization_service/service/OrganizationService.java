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

    public OrganizationSummary resolveOrganization(OrganizationResolveRequest request) {
        String normalizedName = request.getName().trim();
        String normalizedDomain = trimToNull(request.getDomain());

        Organization organization = (normalizedDomain == null
                ? organizationRepository.findByNameIgnoreCase(normalizedName)
                : organizationRepository.findByDomainIgnoreCase(normalizedDomain)
                    .or(() -> organizationRepository.findByNameIgnoreCase(normalizedName)))
                .orElseGet(() -> organizationRepository.save(
                        Organization.builder()
                                .name(normalizedName)
                                .domain(normalizedDomain)
                                .build()
                ));

        boolean changed = false;
        if ((organization.getDomain() == null || organization.getDomain().isBlank()) && normalizedDomain != null) {
            organization.setDomain(normalizedDomain);
            changed = true;
        }
        if (organization.getName() == null || organization.getName().isBlank()) {
            organization.setName(normalizedName);
            changed = true;
        }

        if (changed) {
            organization = organizationRepository.save(organization);
        }

        return toSummary(organization);
    }

    public OrganizationSummary getOrganizationSummary(Long organizationId) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new NoSuchElementException("Organization not found"));

        return toSummary(organization);
    }

    public OrganizationResponse getOrganization(Long organizationId) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new NoSuchElementException("Organization not found"));

        List<OrganizationMember> members = organizationMemberRepository.findAllByOrganization_IdOrderByCreatedAtAsc(organizationId);
        return toResponse(organization, members);
    }

    public OrganizationSummary syncMember(Long organizationId, OrganizationMemberSyncRequest request) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new NoSuchElementException("Organization not found"));

        OrganizationMember member = organizationMemberRepository.findByUserId(request.getUserId())
                .orElseGet(OrganizationMember::new);

        member.setUserId(request.getUserId());
        member.setOrganization(organization);
        member.setName(request.getName().trim());
        member.setEmail(request.getEmail().trim().toLowerCase());
        member.setRole(request.getRole().trim());
        member.setDepartment(defaultIfBlank(request.getDepartment(), "Unassigned"));
        member.setJobTitle(defaultIfBlank(request.getJobTitle(), "Team Member"));
        member.setStatus(defaultIfBlank(request.getStatus(), "Pending"));

        organizationMemberRepository.save(member);
        return toSummary(organization);
    }

    private OrganizationSummary toSummary(Organization organization) {
        return OrganizationSummary.builder()
                .id(organization.getId())
                .name(organization.getName())
                .domain(organization.getDomain())
                .memberCount(organizationMemberRepository.countByOrganization_Id(organization.getId()))
                .build();
    }

    private OrganizationResponse toResponse(Organization organization, List<OrganizationMember> members) {
        List<OrganizationMember> sortedMembers = members.stream()
                .sorted(Comparator.comparing(OrganizationMember::getName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();

        long activeMemberCount = sortedMembers.stream()
                .filter(member -> "Active".equalsIgnoreCase(member.getStatus()))
                .count();
        long privilegedRoleCount = sortedMembers.stream()
                .filter(member -> "ADMIN".equalsIgnoreCase(member.getRole()))
                .count();

        return OrganizationResponse.builder()
                .id(organization.getId())
                .name(organization.getName())
                .domain(organization.getDomain())
                .createdAt(organization.getCreatedAt())
                .memberCount((long) sortedMembers.size())
                .activeMemberCount(activeMemberCount)
                .privilegedRoleCount(privilegedRoleCount)
                .members(sortedMembers.stream()
                        .map(this::toMemberResponse)
                        .toList())
                .build();
    }

    private OrganizationMemberResponse toMemberResponse(OrganizationMember member) {
        return OrganizationMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUserId())
                .name(member.getName())
                .email(member.getEmail())
                .role(member.getRole())
                .department(member.getDepartment())
                .jobTitle(member.getJobTitle())
                .status(member.getStatus())
                .build();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toLowerCase();
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
