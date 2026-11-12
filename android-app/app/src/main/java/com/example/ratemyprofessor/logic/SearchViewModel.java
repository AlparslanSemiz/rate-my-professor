package com.example.ratemyprofessor.logic;

import android.util.Log;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

/**
 * This is a class that holds the search query form the user
 *
 * <p>The search screen and its two tabs share one instance of this ViewModel. The screen
 * writes the typed text into it and each tab observes it, so both result lists stay in sync
 * without knowing about each other.</p>
 */
public class SearchViewModel extends ViewModel {

    private static final String TAG = "SearchViewModel";

    private final MutableLiveData<String> query = new MutableLiveData<>("");

    /**
     * Returns the query.
     *
     * @return the current search query as an observable value
     */
    public LiveData<String> getQuery() {
        return query;
    }

    /**
     * Publishes a new search query to all observers.
     *
     * @param newQuery the text the user typed
     */
    public void setQuery(String newQuery) {
        query.setValue(newQuery);
    }

    /**
     * Resets the query, which makes the tabs show the unfiltered lists again.
     */
    public void clearQuery() {
        query.setValue("");
    }
}
