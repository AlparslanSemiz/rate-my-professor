package com.example.myapplication_java.logic;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

/**
 * This is a class that holds the search query form the user
 */
public class SearchViewModel extends ViewModel {

    private final MutableLiveData<String> query = new MutableLiveData<>("");

    public LiveData<String> getQuery() {
        return query;
    }

    public void setQuery(String newQuery) {
        query.setValue(newQuery);
    }

    public void clearQuery() {
        query.setValue("");
    }
}