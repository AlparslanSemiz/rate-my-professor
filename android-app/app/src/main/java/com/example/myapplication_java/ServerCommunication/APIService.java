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

/**
 * Describes every route of the backend this app talks to.
 *
 * <p>Retrofit generates the implementation from these annotations. Every method returns a
 * {@link Call}, which is only executed once {@code enqueue(...)} is invoked on it.</p>
 *
 * <p>Routes that require a logged in user take the auth token as an {@code Authorization}
 * header. Use {@link LoginSession#bearerToken()} to build that value.</p>
 */
public interface APIService {

    /**
     * Requests a one-time login token for the given email address.
     *
     * @param request the request holding the email address; the token field stays empty here
     * @return the response telling whether the token could be sent
     */
    @POST("/auth/request-login")
    Call<ServerResponse> requestLogin(
            @Body LoginRequest request
    );

    /**
     * Verifies the email and token pair with the backend.
     *
     * @param request the email address together with the one-time token the user entered
     * @return the response holding the auth token on success
     */
    @POST("/auth/login")
    Call<ServerResponse> login(
            @Body LoginRequest request
    );

    /**
     * Checks whether a previously saved login is still valid, so a returning user can skip
     * the login screen.
     *
     * @param token   the auth token for authorization
     * @param request the saved email and token pair
     * @return the response telling whether the saved login is still accepted
     */
    @POST("/auth/validate")
    Call<ServerResponse> validate(
            @Header("Authorization") String token,
            @Body LoginRequest request
    );

    /**
     * Deletes the account for the currently verified email/token pair.
     *
     * @param token the auth token for authorization
     * @return the response telling whether the account was deleted
     */
    @PATCH("/account/deleteAccount")
    Call<BasicResponse> deleteAccount(
            @Header("Authorization") String token
    );

    /**
     * Loads all professors from the backend.
     *
     * @return the response with all professors
     */
    @GET("/data/professor")
    Call<ProfessorResponse> getProfessors();

    /**
     * Loads all lectures from the backend.
     *
     * @return the response with all lectures
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
     *
     * @param lectureId the id of the lecture offering the averages are wanted for
     * @return the response with one average value per rating topic
     */
    @GET("/ratings/{lectureId}")
    Call<RatingAverageResponse> getRatings(
            @Path("lectureId") String lectureId
    );

    /**
     * Posts an answer to an existing comment.
     *
     * @param token   the auth token for authorization
     * @param request the id of the answered comment together with the answer text
     * @return the response telling whether the answer was stored
     */
    @POST("/social/answers")
    Call<BasicResponse> postAnswer(
            @Header("Authorization") String token,
            @Body SubmitAnswerRequest request
    );

}
