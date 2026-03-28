package com.company.ems.backend.auth.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.enums.DataScope;

@Getter
public class CustomUserPrincipal implements UserDetails {
    private final Long userId;

    private final String username;
    private final String password;
    private final boolean enabled;
    private final boolean accountNonExpired;
    private final boolean accountNonLocked;
    private final boolean credentialsNonExpired;

    private final Collection<? extends GrantedAuthority> authorities;

    private final Set<DataScope> dataScopes;

    public static CustomUserPrincipal of(User user) {
        // Tạo authorities = ROLE_{name} + all permission names từ tất cả roles
        Set<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> {
                    String roleName = role.getName();
                    String finalAuthority = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
                    return (GrantedAuthority) new SimpleGrantedAuthority(finalAuthority);
                })
                .collect(Collectors.toSet());

        // Thêm permission authorities (dạng plain string, ví dụ: EMPLOYEE_VIEW)
        user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(perm -> (GrantedAuthority) new SimpleGrantedAuthority(perm.getName()))
                .forEach(authorities::add);

        // UNION tất cả DataScopes từ tất cả Roles
        Set<DataScope> dataScopes = user.getRoles().stream()
                .flatMap(role -> role.getDataScopes().stream())
                .collect(Collectors.toSet());

        return new CustomUserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getPassword(),
                user.getEnabled(),
                user.getAccountNonExpired(),
                !user.isAccountLocked(),
                user.getCredentialsNonExpired(),
                authorities,
                dataScopes);
    }

    public CustomUserPrincipal(
            Long userId,
            String username,
            String password,
            boolean enabled,
            boolean accountNonExpired,
            boolean accountNonLocked,
            boolean credentialsNonExpired,
            Collection<? extends GrantedAuthority> authorities,
            Set<DataScope> dataScopes) {
        this.userId = userId;
        this.username = username;
        this.password = password;
        this.enabled = enabled;
        this.accountNonExpired = accountNonExpired;
        this.accountNonLocked = accountNonLocked;
        this.credentialsNonExpired = credentialsNonExpired;
        this.authorities = authorities;
        this.dataScopes = dataScopes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return accountNonExpired;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return credentialsNonExpired;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    public boolean hasPermission(String permissionName) {
        return authorities.stream()
                .anyMatch(auth -> auth.getAuthority().equals(permissionName));
    }

    public boolean hasDataScope(DataScope scope) {
        if (dataScopes.contains(DataScope.ALL))
            return true;
        if (scope == DataScope.DEPARTMENT && dataScopes.contains(DataScope.DEPARTMENT))
            return true;
        if (scope == DataScope.TEAM && dataScopes.contains(DataScope.TEAM))
            return true;
        return dataScopes.contains(scope);
    }

    public Set<String> getPermissionNames() {
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> !auth.startsWith("ROLE_"))
                .collect(Collectors.toSet());
    }

    public Set<String> getRoleNames() {
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("ROLE_"))
                .map(auth -> auth.substring(5)) // bỏ "ROLE_" prefix
                .collect(Collectors.toSet());
    }
}
