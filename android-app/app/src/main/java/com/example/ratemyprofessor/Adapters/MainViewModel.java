package com.example.ratemyprofessor.Adapters;

import android.app.Application;
import android.content.Context;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;

import com.example.ratemyprofessor.ServerCommunication.APIService;
import com.example.ratemyprofessor.ServerCommunication.AuthManager;
import com.example.ratemyprofessor.ServerCommunication.Database;
import com.example.ratemyprofessor.ServerCommunication.RetrofitClient;

public class MainViewModel extends AndroidViewModel {

    public MainViewModel(@NonNull Application application) {
        super(application);
        refreshLocalData();
    }

    /**
     * Pulls the current professors and lectures from the server into the local database, so
     * the search screen has something to work with.
     */
    private void refreshLocalData() {
        if (AuthManager.getInstance().isLoggedIn()){
            Context context = getApplication().getApplicationContext();
            APIService apiService = RetrofitClient.getClient().create(APIService.class);
            Database.getInstance(context).updateDB(apiService);
        }
    }
}
