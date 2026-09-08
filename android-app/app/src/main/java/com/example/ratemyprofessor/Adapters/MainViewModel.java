package com.example.ratemyprofessor.Adapters;

import android.app.Application;
import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;

import com.example.ratemyprofessor.ServerCommunication.APIService;
import com.example.ratemyprofessor.ServerCommunication.AuthManager;
import com.example.ratemyprofessor.ServerCommunication.Database;
import com.example.ratemyprofessor.ServerCommunication.NetworkUtils;
import com.example.ratemyprofessor.ServerCommunication.RetrofitClient;

import java.util.concurrent.TimeUnit;

public class MainViewModel extends AndroidViewModel {

    private static final String SYNC_STORAGE = "sync_state";
    private static final String LAST_SUCCESSFUL_SYNC = "last_successful_sync";
    private static final long REFRESH_INTERVAL_MILLIS = TimeUnit.HOURS.toMillis(6);

    public MainViewModel(@NonNull Application application) {
        super(application);
        refreshLocalDataIfStale();
    }

    /**
     * Pulls the current professors and lectures from the server into the local database, so
     * the search screen has something to work with.
     */
    private void refreshLocalDataIfStale() {
        if (AuthManager.getInstance().isLoggedIn()) {
            Context context = getApplication().getApplicationContext();
            if (!NetworkUtils.isInternetAvailable(context)) {
                return;
            }

            SharedPreferences syncState = context.getSharedPreferences(
                    SYNC_STORAGE,
                    Context.MODE_PRIVATE
            );
            long lastSuccessfulSync = syncState.getLong(LAST_SUCCESSFUL_SYNC, 0);
            if (System.currentTimeMillis() - lastSuccessfulSync < REFRESH_INTERVAL_MILLIS) {
                return;
            }

            APIService apiService = RetrofitClient.getClient().create(APIService.class);
            Database.getInstance(context).updateDB(apiService, successful -> {
                if (successful) {
                    syncState.edit()
                            .putLong(LAST_SUCCESSFUL_SYNC, System.currentTimeMillis())
                            .apply();
                }
            });
        }
    }
}
