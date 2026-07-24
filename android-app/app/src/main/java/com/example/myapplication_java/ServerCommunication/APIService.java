package com.example.myapplication_java.ServerCommunication;

import com.example.myapplication_java.ServerCommunication.Responses.BasicResponse;
import com.example.myapplication_java.ServerCommunication.Responses.CommentsResponse;
import com.example.myapplication_java.ServerCommunication.Responses.LecturesResponse;
import com.example.myapplication_java.ServerCommunication.Responses.ProfessorResponse;
import com.example.myapplication_java.ServerCommunication.Responses.RatingAverageResponse;
import com.example.myapplication_java.ServerCommunication.Responses.ServerResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.Path;

public interface APIService {

    /**
     * Requests a one-time login token for the given email address.
     */
    @POST("/auth/request-login")
    Call<ServerResponse> requestLogin(
            @Body LoginRequest request
    );

    /**
     * Verifies the email and token pair with the backend.
     */
    @POST("/auth/login")
    Call<ServerResponse> login(
            @Body LoginRequest request
    );

    @POST("/auth/validate")
    Call<ServerResponse> validate(
            @Header("Authorization") String token,
            @Body LoginRequest request
    );

    /**
     * Deletes the account for the currently verified email/token pair.
     */
    @PATCH("/account/deleteAccount")
    Call<BasicResponse> deleteAccount(
            @Header("Authorization") String token
    );

    /**
     * Loads all professors from the backend.
     */
    @GET("/data/professor")
    Call<ProfessorResponse> getProfessors();

    /**
     * Loads all lectures from the backend.
     */
    @GET("/data/lectures")
    Call<LecturesResponse> getLectures();

    /**
     * posts the comment made to the server.
     * @param token the auth token for authorization.
     * @param request the comment.
     * @return the response
     */
    @POST("/social/comments")
    Call<ServerResponse> postComment(
            @Header("Authorization") String token,
            @Body PostCommentRequest request
    );

    /**
     * gets the comments for a specific lecture.
     * @param lectureId the id of the lecture.
     * @return The response with comments.
     */
    @GET("/social/comments/{lecture_id}")
    Call<CommentsResponse> getComments(@Path("lecture_id") String lectureId);

    /**
     *
     * Loads the average ratings for a lecture Offering
     */
    @GET("/ratings/{lectureId}")
    Call<RatingAverageResponse> getRatings(
            @Path("lectureId") String lectureId
    );

    @POST("/social/answers")
    Call<BasicResponse> postAnswer(
            @Header("Authorization") String token,
            @Body SubmitAnswerRequest request
    );


}
