package com.pse.audit.model;

import java.util.Arrays;
import java.util.List;

/**
 * Lists AuditAction.
 */
public enum AuditAction {

    // Administrative actions. The actor is always an admin account.
    /**
     * The ADMIN_LOGIN.
     */
    ADMIN_LOGIN(AuditActionScope.ADMINISTRATIVE),
    /**
     * The ADMIN_LOGOUT.
     */
    ADMIN_LOGOUT(AuditActionScope.ADMINISTRATIVE),
    /**
     * The USER_UPDATED.
     */
    USER_UPDATED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The USER_WARNING_CREATED.
     */
    USER_WARNING_CREATED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The USER_WARNING_UPDATED.
     */
    USER_WARNING_UPDATED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The USER_WARNING_DELETED.
     */
    USER_WARNING_DELETED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The USER_BLOCKED.
     */
    USER_BLOCKED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The USER_UNBLOCKED.
     */
    USER_UNBLOCKED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The USER_DELETED.
     */
    USER_DELETED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The COMMENT_UPDATED.
     */
    COMMENT_UPDATED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The COMMENT_DELETED.
     */
    COMMENT_DELETED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The ANSWER_UPDATED.
     */
    ANSWER_UPDATED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The ANSWER_DELETED.
     */
    ANSWER_DELETED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The RATING_DELETED.
     */
    RATING_DELETED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The COMMENT_REPORT_STATUS_CHANGED.
     */
    COMMENT_REPORT_STATUS_CHANGED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The COMMENT_REPORT_DELETED.
     */
    COMMENT_REPORT_DELETED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The ANSWER_REPORT_STATUS_CHANGED.
     */
    ANSWER_REPORT_STATUS_CHANGED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The ANSWER_REPORT_DELETED.
     */
    ANSWER_REPORT_DELETED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The BUG_REPORT_UPDATED.
     */
    BUG_REPORT_UPDATED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The BUG_REPORT_ISSUE_CREATED.
     */
    BUG_REPORT_ISSUE_CREATED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The BUG_REPORT_DELETED.
     */
    BUG_REPORT_DELETED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The LECTURE_CREATED.
     */
    LECTURE_CREATED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The LECTURE_UPDATED.
     */
    LECTURE_UPDATED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The LECTURE_DELETED.
     */
    LECTURE_DELETED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The PROFESSOR_CREATED.
     */
    PROFESSOR_CREATED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The PROFESSOR_UPDATED.
     */
    PROFESSOR_UPDATED(AuditActionScope.ADMINISTRATIVE),
    /**
     * The PROFESSOR_DELETED.
     */
    PROFESSOR_DELETED(AuditActionScope.ADMINISTRATIVE),

    // Student activity. The actor is the account that performed the action in the
    // student app, so the activity log can show who signed in and what they posted.
    /**
     * The USER_LOGIN.
     */
    USER_LOGIN(AuditActionScope.ACTIVITY),
    /**
     * The USER_LOGOUT.
     */
    USER_LOGOUT(AuditActionScope.ACTIVITY),
    /**
     * The COMMENT_CREATED.
     */
    COMMENT_CREATED(AuditActionScope.ACTIVITY),
    /**
     * The ANSWER_CREATED.
     */
    ANSWER_CREATED(AuditActionScope.ACTIVITY),
    /**
     * The COMMENT_VOTED.
     */
    COMMENT_VOTED(AuditActionScope.ACTIVITY),
    /**
     * The ANSWER_VOTED.
     */
    ANSWER_VOTED(AuditActionScope.ACTIVITY),
    /**
     * The RATING_SUBMITTED.
     */
    RATING_SUBMITTED(AuditActionScope.ACTIVITY),
    /**
     * The COMMENT_REPORT_CREATED.
     */
    COMMENT_REPORT_CREATED(AuditActionScope.ACTIVITY),
    /**
     * The ANSWER_REPORT_CREATED.
     */
    ANSWER_REPORT_CREATED(AuditActionScope.ACTIVITY),
    /**
     * The BUG_REPORT_CREATED.
     */
    BUG_REPORT_CREATED(AuditActionScope.ACTIVITY),

    // Refused requests. Only refusals that can be attributed to a known account are
    // recorded; an anonymous 401 has no actor and would let anyone fill the table.
    /**
     * The LOGIN_REFUSED.
     */
    LOGIN_REFUSED(AuditActionScope.ACTIVITY),
    /**
     * The ACCESS_REFUSED.
     */
    ACCESS_REFUSED(AuditActionScope.ACTIVITY);

    private final AuditActionScope scope;

    AuditAction(AuditActionScope scope) {
        this.scope = scope;
    }

    /**
     * Returns getScope.
     *
     * @return the result
     */
    public AuditActionScope getScope() {
        return scope;
    }

    /**
     * Returns of.
     *
     * @param scope the scope
     * @return the result
     */
    public static List<AuditAction> of(AuditActionScope scope) {
        return Arrays.stream(values()).filter(action -> action.scope == scope).toList();
    }
}
