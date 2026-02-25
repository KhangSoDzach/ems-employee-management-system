package com.company.ems.backend.rbac.aop;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;

import lombok.extern.slf4j.Slf4j;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class ProfileAccessAuditAspect {

    private static final String AUDIT_FORMAT =
            "PROFILE_AUDIT | user=[{}] | roles=[{}] | method=[{}] | targetEmpId=[{}] | result=[{}] | time=[{}ms]";

    @Around("execution(* com.company.ems.backend.employee.service.EmployeeProfileService.*(..))")
    public Object auditProfileAccess(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();

        String username   = "anonymous";
        String userId     = "N/A";
        String roles      = "N/A";
        String targetEmpId = extractFirstLongArg(joinPoint.getArgs());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserPrincipal p) {
            username = p.getUsername();
            userId   = String.valueOf(p.getUserId());
            roles    = p.getRoleNames().toString();
        }

        String methodName = joinPoint.getSignature().toShortString();

        try {
            Object result = joinPoint.proceed();
            long elapsed = System.currentTimeMillis() - start;
            log.info(AUDIT_FORMAT, username + "(id=" + userId + ")", roles,
                    methodName, targetEmpId, "SUCCESS", elapsed);
            return result;

        } catch (AccessDeniedException | ForbiddenException ex) {
            long elapsed = System.currentTimeMillis() - start;
            log.warn(AUDIT_FORMAT, username + "(id=" + userId + ")", roles,
                    methodName, targetEmpId, "DENIED", elapsed);
            throw ex;

        } catch (ResourceNotFoundException ex) {
            long elapsed = System.currentTimeMillis() - start;
            log.warn(AUDIT_FORMAT, username + "(id=" + userId + ")", roles,
                    methodName, targetEmpId, "NOT_FOUND", elapsed);
            throw ex;

        } catch (Exception ex) {
            long elapsed = System.currentTimeMillis() - start;
            log.error(AUDIT_FORMAT, username + "(id=" + userId + ")", roles,
                    methodName, targetEmpId, "ERROR(" + ex.getMessage() + ")", elapsed);
            throw ex;
        }
    }

    private String extractFirstLongArg(Object[] args) {
        if (args == null || args.length == 0) return "self";
        for (Object arg : args) {
            if (arg instanceof Long) return String.valueOf(arg);
        }
        return "N/A";
    }
}