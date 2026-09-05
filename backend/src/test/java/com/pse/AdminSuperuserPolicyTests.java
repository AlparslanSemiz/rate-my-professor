package com.pse;

import com.pse.auth.service.AdminSuperuserPolicy;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The addresses have to be matched the way the admin panel normalizes them — trimmed and
 * lowercased — or an operator configured with a capital letter silently has no elevation.
 */
class AdminSuperuserPolicyTests {

    @Test
    void addressesAreTrimmedAndLowercasedOnBothSides() {
        AdminSuperuserPolicy policy =
                new AdminSuperuserPolicy("  u-kisi4@Student.KIT.edu , second@student.kit.edu ");

        assertTrue(policy.isSuperuser("u-kisi4@student.kit.edu"));
        assertTrue(policy.isSuperuser("  u-kisi4@student.kit.edu  "));
        assertTrue(policy.isSuperuser("second@student.kit.edu"));
        assertFalse(policy.isSuperuser("someone-else@student.kit.edu"));
    }

    @Test
    void blankEntriesAreDroppedRatherThanMatchingEveryone() {
        AdminSuperuserPolicy policy = new AdminSuperuserPolicy("a@student.kit.edu,, ,");

        assertEqualsSize(policy, 1);
        assertFalse(policy.isSuperuser(""));
        assertFalse(policy.isSuperuser("   "));
    }

    /**
     * Unset is the safe direction: nobody is elevated, and every administrator account
     * stays protected exactly as it was before elevation existed.
     */
    @Test
    void anUnsetValueElevatesNobody() {
        AdminSuperuserPolicy policy = new AdminSuperuserPolicy("");

        assertEqualsSize(policy, 0);
        assertFalse(policy.isSuperuser("u-kisi4@student.kit.edu"));
        assertFalse(policy.isSuperuser(null));
    }

    private void assertEqualsSize(AdminSuperuserPolicy policy, int expected) {
        org.junit.jupiter.api.Assertions.assertEquals(expected, policy.superuserEmails().size());
    }
}
