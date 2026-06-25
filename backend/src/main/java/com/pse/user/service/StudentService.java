package com.pse.user.service;


import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.pse.moderation.dto.response.UserListResponse;
import com.pse.moderation.dto.response.UserResponse;
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

}
