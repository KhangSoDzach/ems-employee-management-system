package com.company.ems.backend.user.entity;

import java.util.HashSet;
import java.util.Set;

import com.company.ems.backend.common.entity.BaseEntity;

import com.company.ems.backend.user.enums.DataScope;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Role entity for authorization
 * Represents user roles (ADMIN, MANAGER, EMPLOYEE)
 */
@Entity
@Table(name = "roles", indexes = {
        @Index(name = "idx_role_name", columnList = "name", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Role extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(length = 255)
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "role_data_scopes",
            joinColumns = @JoinColumn(name = "role_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "data_scope", length = 20, nullable = false)
    @Builder.Default
    private Set<DataScope> dataScopes = new HashSet<>();

    @ManyToMany(mappedBy = "roles")
    @Builder.Default
    private Set<User> users = new HashSet<>();

    @ManyToMany(fetch = FetchType.EAGER, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "role_permissions",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();

    /**
     * Add a permission to this role
     */
    public void addPermission(Permission permission) {
        this.permissions.add(permission);
        permission.getRoles().add(this);
    }

    /**
     * Remove a permission from this role
     */
    public void removePermission(Permission permission) {
        this.permissions.remove(permission);
        permission.getRoles().remove(this);
    }

    /**
     * Check if role has a specific permission
     */
    public boolean hasPermission(String permissionName) {
        return permissions.stream()
                .anyMatch(permission -> permission.getName().equals(permissionName));
    }

    public boolean hasDataScope(DataScope scope) {
        if (dataScopes.contains(DataScope.ALL)) return true;
        if (scope == DataScope.DEPARTMENT && dataScopes.contains(DataScope.DEPARTMENT)) return true;
        if (scope == DataScope.TEAM && dataScopes.contains(DataScope.TEAM)) return true;
        return dataScopes.contains(scope);
    }
}
