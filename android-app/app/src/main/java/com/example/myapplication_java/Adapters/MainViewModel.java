package com.example.myapplication_java.Adapters;

import android.app.Application;
import android.content.Context;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.ViewModel;

import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.Database;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;

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
        Context context = getApplication().getApplicationContext();
        APIService apiService = RetrofitClient.getClient().create(APIService.class);
        Database.getInstance(context).updateDB(apiService);
    }
}
