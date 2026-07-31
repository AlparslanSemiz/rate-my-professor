package com.example.myapplication_java.Fragments;

import android.os.Bundle;

import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import com.example.myapplication_java.Adapters.CommentsAdapter;
import com.example.myapplication_java.DomainModel.Comment;
import com.example.myapplication_java.DomainModel.CommentType;
import com.example.myapplication_java.DomainModel.VoteType;
import com.example.myapplication_java.R;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginSession;
import com.example.myapplication_java.ServerCommunication.Responses.BasicResponse;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.ServerCommunication.VoteRequest;
import com.example.myapplication_java.databinding.FragmentReplyBinding;
import com.example.myapplication_java.databinding.ItemCommentBinding;
import com.example.myapplication_java.databinding.ItemReplyBinding;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * It is the fragment that displays the replies to a comment.
 */
public class ReplyFragment extends Fragment implements CommentsAdapter.OnCommentClickListener {

    private Comment comment;
    private FragmentReplyBinding binding;
    private RecyclerView answerList;
    private APIService apiService;

    public ReplyFragment() {
        apiService = RetrofitClient.getClient().create(APIService.class);
        // Required empty public constructor
    }
    public ReplyFragment(Comment comment) {
        apiService = RetrofitClient.getClient().create(APIService.class);
        this.comment = comment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentReplyBinding.inflate(inflater, container, false);
        answerList = binding.answerList;
        ItemCommentBinding mainComment = binding.mainComment;


        mainComment.userName.setText(comment.studentUsername());
        mainComment.contentText.setText(comment.content());
        mainComment.upvotesNum.setText(String.valueOf(comment.upVotes()));
        mainComment.downvotesNum.setText(String.valueOf(comment.downVotes()));

        mainComment.replyButton.setOnClickListener(v -> mainComment.commentBox.getRoot().setVisibility(View.VISIBLE));
        mainComment.commentBox.cancelButton.setOnClickListener(v -> mainComment.commentBox.getRoot().setVisibility(View.GONE));
        mainComment.commentBox.sendReply.setOnClickListener(v ->
                onReplySend(comment.commentID(), mainComment.commentBox.replyText.getText().toString())
        );


        mainComment.commentsIcon.setOnClickListener(v -> onOpenReplies(comment));
        mainComment.upvoteIcon.setOnClickListener(v -> {
            mainComment.upvotesNum.setText(String.valueOf(comment.upVotes() + 1));
            mainComment.downvotesNum.setText(String.valueOf(comment.downVotes()));
            vote(comment.commentID(), VoteType.UP, CommentType.COMMENT);
        });

        mainComment.downvoteIcon.setOnClickListener(v -> {
            mainComment.upvotesNum.setText(String.valueOf(comment.upVotes()));
            mainComment.downvotesNum.setText(String.valueOf(comment.downVotes() + 1));
            vote(comment.commentID(), VoteType.DOWN, CommentType.COMMENT);
        });
        mainComment.replyButton.setVisibility(View.INVISIBLE);
        mainComment.commentsIcon.setOnClickListener(v -> {});
        mainComment.commentsNum.setText(String.valueOf(comment.answers().size()));


        answerList.setLayoutManager(new LinearLayoutManager(getContext()));
        List<Comment> answers = comment.answers();
        CommentsAdapter adapter = new CommentsAdapter(answers, this, CommentType.REPLY);
        answerList.setAdapter(adapter);
        return binding.getRoot();
    }

    @Override
    public void onReplySend(String commentId, String reply) {
    }

    @Override
    public void onOpenReplies(Comment comment) {
    }

    @Override
    public void vote(String commentID, VoteType voteType, CommentType commentType) {
        LoginSession session = LoginSession.from(getContext());
        String authToken = session.bearerToken();
        Call<BasicResponse> call;
        if (commentType == CommentType.COMMENT) {
            call = apiService.voteComment(authToken, commentID, new VoteRequest(voteType));
            Log.println(Log.DEBUG, "Reply", "votecomment");
        } else {
            call = apiService.voteAnswer(authToken, commentID, new VoteRequest(voteType));
            Log.println(Log.DEBUG, "Reply", "voteanswer");
        }
        call.enqueue(new Callback<>() {
            @Override
            public void onResponse(Call<BasicResponse> call, Response<BasicResponse> response) {
                if (!response.isSuccessful()) {
                    Log.println(Log.ERROR, "replyfragment", response.errorBody().toString());
                    Toast.makeText(getContext(), "Vote couldn't be sent. (fail) ", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<BasicResponse> call, Throwable throwable) {
                Log.println(Log.ERROR, "replyfragment", throwable.getMessage());
                Toast.makeText(getContext(), "Vote couldn't be sent(error). ", Toast.LENGTH_SHORT).show();
            }
        });
    }
}