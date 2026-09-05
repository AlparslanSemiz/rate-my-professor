package com.pse.user;

import com.pse.security.AuthenticatedUser;
import com.pse.shared.enums.UserStatus;
import com.pse.support.TestGitLabConfig;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import com.pse.support.TestDeliveryConfig;

import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@Import({TestDeliveryConfig.class, TestGitLabConfig.class})
class AccountApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private StudentRepository studentRepository;


    @Test
    void getUserInformationReturnsProfileOfAuthenticatedStudent()
            throws Exception {

        Student student = createStudent(
                "information@student.kit.edu",
                "informationUser"
        );


        mockMvc.perform(
                        get("/account/information")
                                .with(authenticatedAs(student))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.username")
                        .value("informationUser"))
                .andExpect(jsonPath("$.ratingsCount").value(0))
                .andExpect(jsonPath("$.commentsWritten").value(0))
                .andExpect(jsonPath("$.credibilityScore").value(0));
    }


    @Test
    void getUserRatingsReturnsEmptyListWhenStudentHasNoRatings()
            throws Exception {

        Student student = createStudent(
                "ratings@student.kit.edu",
                "ratingsUser"
        );


        mockMvc.perform(
                        get("/account/ratings")
                                .with(authenticatedAs(student))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Success, found 0 ratings."))
                .andExpect(jsonPath("$.ratings").isArray())
                .andExpect(jsonPath("$.ratings", hasSize(0)));
    }


    @Test
    void logoutReturnsSuccessfulResponse()
            throws Exception {

        Student student = createStudent(
                "logout@student.kit.edu",
                "logoutUser"
        );


        mockMvc.perform(
                        post("/account/logout")
                                .with(authenticatedAs(student))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Logged out successfully (0 sessions)"));
    }


    @Test
    void deleteAccountSoftDeletesStudent()
            throws Exception {

        Student student = createStudent(
                "delete@student.kit.edu",
                "deleteUser"
        );


        mockMvc.perform(
                        patch("/account/deleteAccount")
                                .with(authenticatedAs(student))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));


        Student deletedStudent =
                studentRepository
                        .findByKitEmail("delete@student.kit.edu")
                        .orElseThrow();


        assertEquals(
                UserStatus.DELETED,
                deletedStudent.getStatus()
        );
    }


    @Test
    void accountEndpointsRequireAuthentication()
            throws Exception {

        mockMvc.perform(
                        get("/account/information")
                )
                .andExpect(status().is4xxClientError());
    }



    private Student createStudent(
            String email,
            String username
    ) {

        Student student = new Student();

        student.setKitEmail(email);
        student.setUsername(username);
        student.setStatus(UserStatus.ACTIVE);

        return studentRepository.saveAndFlush(student);
    }


    private RequestPostProcessor authenticatedAs(
            Student student
    ) {

        AuthenticatedUser principal =
                mock(AuthenticatedUser.class);

        when(principal.student())
                .thenReturn(student);


        Authentication authentication =
                new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        List.of(
                                new SimpleGrantedAuthority(
                                        "ROLE_USER"
                                )
                        )
                );


        return authentication(authentication);
    }
}