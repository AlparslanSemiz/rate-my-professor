package com.pse.moderation.service;

import com.pse.moderation.dto.response.UserListResponse;
import com.pse.moderation.repository.AdminRepository;
import com.pse.user.model.Student;
import com.pse.user.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ModerationService {


    @Autowired
    private AdminRepository adminRepository;
    @Autowired
    private StudentService studentService;


    public boolean verifyAdmin(Student student) {

        return adminRepository.existsById(student.getId());
    }

    public UserListResponse getAllUsers() {

        return null;

        //return studentService.getAllUsers();
    }
}
