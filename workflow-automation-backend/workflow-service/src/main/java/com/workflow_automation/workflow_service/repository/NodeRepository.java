package com.workflow_automation.workflow_service.repository;

import com.workflow_automation.workflow_service.entity.Node;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NodeRepository extends JpaRepository<Node, Long> {
}
