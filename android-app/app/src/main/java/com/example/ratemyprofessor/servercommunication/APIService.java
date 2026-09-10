package com.example.ratemyprofessor.servercommunication;

import com.example.ratemyprofessor.servercommunication.requests.BugReportRequest;
import com.example.ratemyprofessor.servercommunication.requests.CommentReportRequest;
import com.example.ratemyprofessor.servercommunication.requests.SubmitAnswerRequest;
import com.example.ratemyprofessor.servercommunication.requests.VoteRequest;
import com.example.ratemyprofessor.servercommunication.responses.BasicResponse;
import com.example.ratemyprofessor.servercommunication.requests.LoginRequest;
import com.example.ratemyprofessor.servercommunication.requests.PostCommentRequest;
import com.example.ratemyprofessor.servercommunication.requests.RatingRequest;
import com.example.ratemyprofessor.servercommunication.responses.CommentsResponse;
import com.example.ratemyprofessor.servercommunication.responses.LectureDetailResponse;
import com.example.ratemyprofessor.servercommunication.responses.LecturesResponse;
import com.example.ratemyprofessor.servercommunication.responses.NotificationsResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorDetailResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorsResponse;
import com.example.ratemyprofessor.servercommunication.responses.RatingAverageResponse;
import com.example.ratemyprofessor.servercommunication.responses.RatingCategoriesResponse;
import com.example.ratemyprofessor.servercommunication.responses.ServerResponse;
import com.example.ratemyprofessor.servercommunication.responses.StudentProfileResponse;
import com.example.ratemyprofessor.servercommunication.responses.UserRatingResponse;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Url;

/**
 * Describes every route of the backend this app talks to.
 *
 * <p>Retrofit generates the implementation from these annotations. Every method returns a
 * {@link Call}, which is only executed once {@code enqueue(...)} is invoked on it.</p>
 *
 * <p>Routes that require a logged-in user take the auth token as an {@code Authorization}
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
     * Revokes every auth token of the account, so all devices it is logged in on are logged
     * out, not only the one sending this request.
     *
     * <p>This is the route behind the "log out on all devices" action: a token that leaked, or
     * a device the user no longer has, cannot be taken away from the device itself, so the
     * server has to invalidate the tokens centrally.</p>
     *
     * @param token the auth token for authorization; it is revoked along with all others
     * @return the response telling whether the tokens were revoked
     */
    @POST("/auth/logout-all")
    Call<BasicResponse> logoutAllDevices(
            @Header("Authorization") String token
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
    Call<ProfessorsResponse> getProfessors();

    /**
     * Loads the details of a specific professor from the backend.
     *
     * @param professorId the UUID of the professor
     * @return the response containing the professor details
     */
    @GET("/data/professor/{professor_id}")
    Call<ProfessorDetailResponse> getProfessor(
            @Path("professor_id") String professorId
    );

    /**
     * Loads all lectures from the backend.
     *
     * @return the response with all lectures
     */
    @GET("/data/lectures")
    Call<LecturesResponse> getLectures();


    /**
     * Loads the details of a specific lecture from the backend.
     *
     * @param lectureId the id of the lecture
     * @return the response containing the lectures details
     */
    @GET("/data/lectures/{lecture_id}")
    Call<LectureDetailResponse> getLecture(
            @Path("lecture_id") String lectureId
    );

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
    Call<CommentsResponse> getComments(
            @Header("Authorization") String token,
            @Path("lecture_id") String lectureId
    );

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
     * Submits a new rating
     *
     * @param token the Authorization header value, including the Bearer prefix
     * @param request the request body sent to the server
     * @return the call to execute or enqueue for the server response
     */
    @POST("/ratings/rate")
    Call<ServerResponse> submitRating(
            @Header("Authorization") String token,
            @Body RatingRequest request
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

    /**
     * Creates a request to vote on a top-level comment.
     *
     * @param token the Authorization header value, including the Bearer prefix
     * @param commentID the identifier of the comment
     * @param request the request body sent to the server
     * @return the call to execute or enqueue for the server response
     */
    @POST("/social/comments/vote/comment/{comment_id}")
    Call<BasicResponse> voteComment(
            @Header("Authorization") String token,
            @Path("comment_id") String commentID,
            @Body VoteRequest request
    );

    /**
     * Creates a request to vote on a reply.
     *
     * @param token the Authorization header value, including the Bearer prefix
     * @param answerID the identifier of the reply
     * @param request the request body sent to the server
     * @return the call to execute or enqueue for the server response
     */
    @POST("/social/comments/vote/answer/{answer_id}")
    Call<BasicResponse> voteAnswer(
            @Header("Authorization") String token,
            @Path("answer_id") String answerID,
            @Body VoteRequest request
    );

    /**
     * Loads all comments from the backend.
     *
     * @return the response with all comments
     */
    @GET("/social/sync/comments")
    Call<CommentsResponse> getAllComments();

    /**
     * Returns the User Information
     *
     * @param token the auth token for authorization
     * @return the student's profile information
     */
    @GET("/account/information")
    Call<StudentProfileResponse> getUserInformation(
            @Header("Authorization") String token
    );

    /**
     * Get all Ratings from a specific user
     *
     * @param token the Authorization header value, including the Bearer prefix
     * @return the call to execute or enqueue for the server response
     */
    @GET("/account/ratings")
    Call<UserRatingResponse> getUserRatings(
            @Header("Authorization") String token
    );

    /**
     * Creates a request to report a comment.
     *
     * @param token the Authorization header value, including the Bearer prefix
     * @param request the request body sent to the server
     * @return the call to execute or enqueue for the server response
     */
    @POST("/social/comments/report")
    Call<BasicResponse> reportComment(
            @Header("Authorization") String token,
            @Body CommentReportRequest request
    );

    /**
     * Creates a request to report a reply.
     *
     * @param token the Authorization header value, including the Bearer prefix
     * @param request the request body sent to the server
     * @return the call to execute or enqueue for the server response
     */
    @POST("/answers/report")
    Call<BasicResponse> reportReply(
            @Header("Authorization") String token,
            @Body CommentReportRequest request
    );

    /**
     * Creates a request to download the image at the supplied URL.
     *
     * @param url the image URL
     * @return the call to execute or enqueue for the server response
     */
    @GET
    Call<ResponseBody> downloadImage(@Url String url);

    /**
     * Creates a request to retrieve the current user notifications.
     *
     * @param token the Authorization header value, including the Bearer prefix
     * @return the call to execute or enqueue for the server response
     */
    @GET("/social/notifications")
    Call<NotificationsResponse> getNotifications(
            @Header("Authorization") String token
    );

    /**
     * Creates a request to mark a notification as seen.
     *
     * @param token the Authorization header value, including the Bearer prefix
     * @param notificationId the unique notification identifier
     * @return the call to execute or enqueue for the server response
     */
    @PATCH("/social/notifications/{notification_id}")
    Call<BasicResponse> markNotificationsAsSeen(
            @Header("Authorization") String token,
            @Path("notification_id") String notificationId
    );

    /**
     * Creates a request to retrieve the rating categories for a lecture offering.
     *
     * @param lectureId the identifier of the lecture offering
     * @return the call to execute or enqueue for the server response
     */
    @GET("/ratings/{lectureId}/categories")
    Call<RatingCategoriesResponse> getCategories(@Path("lectureId") String lectureId);

    /**
     * Interface used for bug reports
     *
     * @param token the Authorization header value, including the Bearer prefix
     * @param request the request body sent to the server
     * @return the call to execute or enqueue for the server response
     */
    @POST("/reports")
    Call<BasicResponse> reportBug(
            @Header("Authorization") String token,
            @Body BugReportRequest request
    );

    /**
     * Creates a request to retrieve the current user ratings for a lecture offering.
     *
     * @param token the Authorization header value, including the Bearer prefix
     * @param lectureId the identifier of the lecture offering
     * @return the call to execute or enqueue for the server response
     */
    @GET("/ratings/own/{lectureId}")
    Call<RatingAverageResponse> getOwnRatings(
            @Header("Authorization") String token,
            @Path("lectureId") String lectureId);

}
