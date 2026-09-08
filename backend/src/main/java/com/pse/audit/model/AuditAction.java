package com.pse.audit.model;

import java.util.Arrays;
import java.util.List;

public enum AuditAction {

    // Administrative actions. The actor is always an admin account.
    ADMIN_LOGIN(AuditActionScope.ADMINISTRATIVE),
    ADMIN_LOGOUT(AuditActionScope.ADMINISTRATIVE),
    USER_UPDATED(AuditActionScope.ADMINISTRATIVE),
    USER_WARNING_CREATED(AuditActionScope.ADMINISTRATIVE),
    USER_WARNING_UPDATED(AuditActionScope.ADMINISTRATIVE),
    USER_WARNING_DELETED(AuditActionScope.ADMINISTRATIVE),
    USER_BLOCKED(AuditActionScope.ADMINISTRATIVE),
    USER_UNBLOCKED(AuditActionScope.ADMINISTRATIVE),
    USER_DELETED(AuditActionScope.ADMINISTRATIVE),
    COMMENT_UPDATED(AuditActionScope.ADMINISTRATIVE),
    COMMENT_DELETED(AuditActionScope.ADMINISTRATIVE),
    ANSWER_UPDATED(AuditActionScope.ADMINISTRATIVE),
    ANSWER_DELETED(AuditActionScope.ADMINISTRATIVE),
    RATING_DELETED(AuditActionScope.ADMINISTRATIVE),
    COMMENT_REPORT_STATUS_CHANGED(AuditActionScope.ADMINISTRATIVE),
    COMMENT_REPORT_DELETED(AuditActionScope.ADMINISTRATIVE),
    ANSWER_REPORT_STATUS_CHANGED(AuditActionScope.ADMINISTRATIVE),
    ANSWER_REPORT_DELETED(AuditActionScope.ADMINISTRATIVE),
    BUG_REPORT_UPDATED(AuditActionScope.ADMINISTRATIVE),
    BUG_REPORT_ISSUE_CREATED(AuditActionScope.ADMINISTRATIVE),
    BUG_REPORT_DELETED(AuditActionScope.ADMINISTRATIVE),
    LECTURE_CREATED(AuditActionScope.ADMINISTRATIVE),
    LECTURE_UPDATED(AuditActionScope.ADMINISTRATIVE),
    LECTURE_DELETED(AuditActionScope.ADMINISTRATIVE),
    PROFESSOR_CREATED(AuditActionScope.ADMINISTRATIVE),
    PROFESSOR_UPDATED(AuditActionScope.ADMINISTRATIVE),
    PROFESSOR_DELETED(AuditActionScope.ADMINISTRATIVE),

    // Student activity. The actor is the account that performed the action in the
    // student app, so the activity log can show who signed in and what they posted.
    USER_LOGIN(AuditActionScope.ACTIVITY),
    USER_LOGOUT(AuditActionScope.ACTIVITY),
    COMMENT_CREATED(AuditActionScope.ACTIVITY),
    ANSWER_CREATED(AuditActionScope.ACTIVITY),
    COMMENT_VOTED(AuditActionScope.ACTIVITY),
    ANSWER_VOTED(AuditActionScope.ACTIVITY),
    RATING_SUBMITTED(AuditActionScope.ACTIVITY),
    COMMENT_REPORT_CREATED(AuditActionScope.ACTIVITY),
    ANSWER_REPORT_CREATED(AuditActionScope.ACTIVITY),
    BUG_REPORT_CREATED(AuditActionScope.ACTIVITY),

    // Refused requests. Only refusals that can be attributed to a known account are
    // recorded; an anonymous 401 has no actor and would let anyone fill the table.
    LOGIN_REFUSED(AuditActionScope.ACTIVITY),
    ACCESS_REFUSED(AuditActionScope.ACTIVITY);

    private final AuditActionScope scope;

    AuditAction(AuditActionScope scope) {
        this.scope = scope;
    }

    public AuditActionScope getScope() {
        return scope;
    }

    public static List<AuditAction> of(AuditActionScope scope) {
        return Arrays.stream(values()).filter(action -> action.scope == scope).toList();
    }
}
