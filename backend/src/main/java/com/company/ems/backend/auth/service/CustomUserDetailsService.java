package com.company.ems.backend.auth.service;

import java.util.stream.Collectors;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Custom UserDetailsService implementation for Spring Security
 * Loads user from database and converts to Spring Security UserDetails
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

        private final UserRepository userRepository;

        @Override
        @Transactional(readOnly = true)
        public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
                log.debug("Loading user by username: {}", username);

                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new UsernameNotFoundException(
                                                "User not found with username: " + username));

                // Check if account is locked
                if (user.isAccountLocked()) {
                        throw new UsernameNotFoundException("Account is locked");
                }

                // Convert User entity to Spring Security UserDetails
                java.util.Set<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
                                .collect(Collectors.toSet());

                authorities.addAll(user.getRoles().stream()
                                .flatMap(role -> role.getPermissions().stream())
                                .map(permission -> new SimpleGrantedAuthority(permission.getName()))
                                .collect(Collectors.toSet()));

                return org.springframework.security.core.userdetails.User.builder()
                                .username(user.getUsername())
                                .password(user.getPassword())
                                .disabled(!user.getEnabled())
                                .accountExpired(!user.getAccountNonExpired())
                                .accountLocked(user.isAccountLocked())
                                .credentialsExpired(!user.getCredentialsNonExpired())
                                .authorities(authorities)
                                .build();
        }

        /**
         * Load user by user ID
         * Useful for token refresh
         */
        @Transactional(readOnly = true)
        public UserDetails loadUserById(Long userId) {
                log.debug("Loading user by ID: {}", userId);

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

                return loadUserByUsername(user.getUsername());
        }
}
