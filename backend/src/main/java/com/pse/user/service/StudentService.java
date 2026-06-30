package com.pse.user.service;


import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.moderation.dto.response.UserListResponse;
import com.pse.moderation.dto.response.UserResponse;
import com.pse.moderation.service.ModerationService;
import com.pse.shared.enums.UserRole;
import com.pse.shared.enums.UserStatus;
import com.pse.user.dto.StudentProfileResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.pse.rating.model.Rating;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;

@Service
public class StudentService {


    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private ModerationService moderationService;


    public Optional<Student> findByKitEmail(String kitEmail){
        return studentRepository.findByKitEmail(kitEmail);
    }


    public void softDeleteByKitEmail(String email){
        studentRepository.softDeleteByKitEmail(email);
    }


    public void addStudent(Student student) {
        studentRepository.save(student);
    }

    public double getAverageRating(Student student) {
        return studentRepository.getAverageOverallRating(student);
    }

    public List<Student> getAllUsers() {

        return studentRepository.findAll();

    }


    public Student getUser(UUID studentId) {

        return studentRepository.findById(studentId).orElse(null);


    }

    public boolean deleteUser(UUID studentId) {
        Student student = studentRepository.findById(studentId).orElse(null);

        if(student == null) {
            return false;
        }

        student.setStatus(UserStatus.DELETED);
        studentRepository.save(student);
        return true;
    }

    public boolean blockStudent(UUID studentId) {
        Student student = studentRepository.findById(studentId).orElse(null);

        if(student == null) {
            return false;
        }
        student.setStatus(UserStatus.BLOCKED);
        studentRepository.save(student);
        return true;
    }

    public boolean unblockStudent(UUID studentId) {
        Student student = studentRepository.findById(studentId).orElse(null);

        if(student == null) {
            return false;
        }
        student.setStatus(UserStatus.ACTIVE);
        studentRepository.save(student);
        return true;
    }
}
