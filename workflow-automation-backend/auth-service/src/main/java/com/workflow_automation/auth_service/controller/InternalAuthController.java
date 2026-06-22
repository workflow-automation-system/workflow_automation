package com.workflow_automation.auth_service.controller;

import com.workflow_automation.auth_service.dto.DepartmentRenameRequest;
import com.workflow_automation.auth_service.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/internal")
@RequiredArgsConstructor
public class InternalAuthController {

    private final AuthService authService;

    @PatchMapping("/departments/rename")
    public ResponseEntity<Void> renameDepartment(@Valid @RequestBody DepartmentRenameRequest request) {
        authService.renameDepartmentForOrganization(
                request.getOrganizationId(),
                request.getOldName(),
                request.getNewName()
        );
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/departments/{organizationId}/{name}")
    public ResponseEntity<Void> deleteDepartment(
            @PathVariable Long organizationId,
            @PathVariable String name
    ) {
        authService.deleteDepartmentForOrganization(organizationId, name);
        return ResponseEntity.noContent().build();
    }
}
