package com.example.myapplication_java.DomainModel;

/**
 * The logged in student.
 *
 * <p>Users stay anonymous towards other students: comments and ratings are shown with
 * {@link #displayName}, never with the real name or the email address.</p>
 */
public class User {

    /**
     * Unique id of the user.
     */
    public String userId;

    /**
     * The KIT email address the account was registered with.
     */
    public String kitEmail;

    /**
     * The KIT user code ("u-Kürzel") of the student.
     */
    public String kitUserCode;

    /**
     * The anonymised name shown next to comments and ratings.
     */
    public String displayName;

    /**
     * Path of the profile picture on the server.
     */
    public String profileImagePath;

    public User(String userId, String kitEmail, String kitUserCode, String displayName, String profileImagePath) {
        this.userId = userId;
        this.kitEmail = kitEmail;
        this.kitUserCode = kitUserCode;
        this.displayName = displayName;
        this.profileImagePath = profileImagePath;
    }

    //TODO: Implement the following methods.

    /**
     * Publishes a review written by this user. Not implemented yet.
     *
     * @param review the review to publish
     */
    public void createReview(Review review) {

    }

    /**
     * Publishes a comment written by this user. Not implemented yet. The comment screen
     * currently posts directly through
     * {@link com.example.myapplication_java.ServerCommunication.APIService#postComment}.
     *
     * @param comment the comment to publish
     */
    public void writeComment(Comment comment) {}

    /**
     * Casts an up- or downvote on someone else's comment. Not implemented yet.
     *
     * @param comment  the comment being voted on
     * @param voteType whether it is an upvote or a downvote
     */
    public void voteComment(Comment comment, VoteType voteType) {}
}
