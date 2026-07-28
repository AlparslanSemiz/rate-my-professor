package com.pse.security;

import com.pse.auth.model.Token;
import com.pse.moderation.model.Admin;
import com.pse.user.model.Student;

public record AuthenticatedUser(Student student, Token token, Admin admin) {

    public boolean isAdmin() {
        return admin != null;
    }
}
