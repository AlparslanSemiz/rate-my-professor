package com.pse.user.service;


import com.pse.rating.model.Rating;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Service;


import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class StudentService {


    @Autowired
    private StudentRepository studentRepository;




    public Optional<Student> findByKitEmail(String kitEmail){
        return studentRepository.findByKitEmail(kitEmail);
    }


    public String findEmailByStudent(Student student){
        return studentRepository.findEmailByStudent(student);
    }


    public void softDeleteByKitEmail(String email){
        studentRepository.softDeleteByKitEmail(email);
    }


    public Double getAverageOverallRating(Student student){
        return studentRepository.getAverageOverallRating(student);
    }


    public List<Rating> findAllByStudentIdWithTopics(UUID studentId){
        return studentRepository.findAllByStudentIdWithTopics(studentId);
    }

    public void addStudent(Student student) {
        studentRepository.save(student);
    }

    public double getAverageRating(Student student) {
        return studentRepository.getAverageOverallRating(student);
    }

}
