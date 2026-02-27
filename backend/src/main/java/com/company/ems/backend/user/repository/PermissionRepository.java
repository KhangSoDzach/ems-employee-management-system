package com.company.ems.backend.user.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.company.ems.backend.user.entity.Permission;

/**
 * Repository interface for Permission entity
 * Provides database operations for permission management
 */
@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    /**
     * Find permission by name
     */
    Optional<Permission> findByName(String name);

    /**
     * Check if permission exists by name
     */
    boolean existsByName(String name);

    /**
     * Find permissions by category
     */
    List<Permission> findAllByCategory(String category);

    /**
     * Find permissions for a specific role
     */
    @Query("SELECT p FROM Permission p JOIN p.roles r WHERE r.id = :roleId")
    List<Permission> findAllByRoleId(@Param("roleId") Long roleId);

    /**
     * Find permissions for a user (through roles)
     */
    @Query("SELECT DISTINCT p FROM Permission p JOIN p.roles r JOIN r.users u WHERE u.id = :userId")
    List<Permission> findAllByUserId(@Param("userId") Long userId);
}
